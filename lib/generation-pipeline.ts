/**
 * Generation pipeline — shared between /api/generate and /api/cron/process-queue.
 * Extracted from route.ts to avoid duplication (Sprint 23).
 * NO dependency on NextRequest/NextResponse/session/headers.
 */
import OpenAI from "openai";
import { applyRoomTypeOverrides } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";

// Singleton OpenAI client — reuses HTTP connections across passes
let _openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}

/** Prompt version — increment when modifying any prompt builder or style prompt.
 * Used by audit agents (Yann Duval, Lucas Moreau) to correlate generation quality with prompt version.
 * History: v1-v5 (Sprints 1-7), v6-v10 (Sprints 8-12), v11-v15 (Sprints 13-16), v16-v17 (Sprint 17),
 * v18 (Sprint 18+), v24 (prompts validés Yann/Lucas/Camille 8.0/7.8),
 * v25 (5 corrections additives: Flos IC, no duplicate, plantes visuelles, lanternes, matériaux),
 * v26 (migration gpt-image-1 → gpt-image-1.5, latence /4 attendue),
 * v30 (audit @ia: wall preservation bedroom Flux, scaling DOWN laundry/cellar/outdoor, dimensions kitchen/office, outdoor scale refs),
 * v31 (audit Lucas v30: distribution spatiale remontee position 2, ancrage sol contact shadows, preservation lumiere passe 2, echelle conditionnelle),
 * v32 (revert gpt-image-1.5 → gpt-image-1 — regression spatiale confirmee par audit Lucas, modele configurable via env),
 * v33 (audit Yann: propagation DEPTH_DISTRIBUTION + CONTACT_SHADOWS aux 7 builders dedies — bedroom, kitchen, bathroom, WC, entryway, laundry, cellar + preservation lumiere passe 2 tous builders) */
export const PROMPT_VERSION = "v33";

// ─── Image generation model ─────────────────────────────────────────
// Configurable via env var for A/B testing. Default: gpt-image-1 (validated at 8.0-8.5/10).
// gpt-image-1.5 caused spatial distribution regression (audit Lucas v30).
const IMAGE_MODEL = process.env.IMAGE_GEN_MODEL || "gpt-image-1";

// ─── Timeout wrapper for external API calls ─────────────────────────
const API_TIMEOUT_MS = 120_000;

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout: ${label} n'a pas répondu en ${ms / 1000}s`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ─── Rate Limiting (in-memory, IP-based) ────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Output Size (preserve input aspect ratio) ──────────────────────
// Maps input dimensions to the closest OpenAI-compatible size.
// OpenAI image_generation supports: 1024x1024, 1536x1024, 1024x1536
export function getOutputSize(
  width?: number,
  height?: number
): { openai: string; w: number; h: number } {
  if (!width || !height) {
    return { openai: "1024x1024", w: 1024, h: 1024 };
  }
  const ratio = width / height;
  if (ratio > 1.3) return { openai: "1536x1024", w: 1536, h: 1024 }; // landscape
  if (ratio < 0.77) return { openai: "1024x1536", w: 1024, h: 1536 }; // portrait
  return { openai: "1024x1024", w: 1024, h: 1024 }; // square-ish
}

// ─── Prompt Engineering ──────────────────────────────────────────────
//
// PIPELINE 2 PASSES with SPLIT PROMPTS:
// Pass 1 (surfaces): Uses surfacePrompt — wall color, floor finish, ceiling, fixture ONLY.
// Pass 2 (furniture): Uses furniturePrompt — freestanding objects ONLY.
//
// RULES:
// - NO lighting directives in style prompts (preserve input light)
// - NO curtains/drapes (hallucination risk)
// - NO structural modifications beyond surface finish
// - surfacePrompt: color/finish of walls, floor, ceiling + ceiling fixture
// - furniturePrompt: freestanding objects with precise silhouettes + scale

// ── Shared prompt fragments (constants to avoid duplication) ─────────
const DSLR_LINE = "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle photographic film grain must be visible at 100% zoom — not smooth CGI rendering. Natural lens vignetting darkening the corners by 5-10%. No text or watermarks.";
const CEILING_PRESERVATION = "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape. Refinish ceiling surface: smooth plaster over raw concrete, formwork marks, seams. Beams keep 3D shape but receive clean painted finish.";
const LIGHT_PRESERVATION = "Preserve existing light direction, shadow positions, and relative intensity. Maintain wall color temperature from input. Do not artificially brighten darker areas. Do not add any warm tint or yellow cast — if the input walls are cool-toned or neutral, the output walls must remain the same temperature.";
const WALL_PRESERVATION = "Wall geometry must stay identical: same angles, same corners, same depth. Wall finishing means changing color and texture only — never add or remove volume, never round corners, never change wall thickness.";
const CAMERA_PRESERVATION = "Same camera angle, lens distortion, vanishing points, field of view, orientation.";

// ── Pass 1: Surface finishing ────────────────────────────────────────
// CRITICAL: Camera + geometry preservation FIRST in all builders (highest token weight in GPT-image-1)
export function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: CAMERA+GEOMETRY first
  if (roomTypeId === "kitchen") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Ceramic or natural stone floor tiles — NOT wood. Subway tile or smooth splashback behind work area. Ceiling light per style description.",
      "Remove construction leftovers: cables, junction boxes, outlets — blend into wall finish. Keep radiators, switches, vents in exact position.",
      "Room stays COMPLETELY EMPTY — no furniture, no appliances. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: CAMERA+GEOMETRY first
  if (roomTypeId === "bathroom") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Floor-to-ceiling ceramic tiles in shower zone and vanity area. Water-resistant floor — ceramic or stone, matte non-slip. Recessed IP44 ceiling spotlights.",
      "Remove construction leftovers: cables, junction boxes, outlets — blend into wall finish. Keep radiators, heaters, vents, switches in exact position.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // WC: CAMERA+GEOMETRY first
  if (roomTypeId === "wc") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles or vinyl. Washable matte paint or tiles on lower walls.",
      "Remove construction leftovers: outlets, cables — blend into wall finish. Keep radiators, heaters, vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: CAMERA+GEOMETRY first
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Warm-toned flooring. Ceiling light per style description. If ONE accent wall exists, preserve it — apply style color to other walls only.",
      "Remove construction leftovers: cables, junction boxes, outlets — blend into wall finish. Keep radiators, heaters, vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: CAMERA+GEOMETRY first
  if (roomTypeId === "laundry") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof floor — white or light grey ceramic tiles matte. Walls in washable matte white paint.",
      "Remove construction leftovers: outlets, cables — blend into wall finish. Keep radiators, heaters, vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no appliances, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: CAMERA+GEOMETRY first
  if (roomTypeId === "cellar") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Concrete or stone floor as-is or with sealant. Clean matte white or light grey paint over masonry.",
      "Remove construction leftovers: outlets, cables — blend into wall finish. Keep radiators, heaters, vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no shelving, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: CAMERA+GEOMETRY first
  if (roomTypeId === "entryway") {
    return [
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      CEILING_PRESERVATION, WALL_PRESERVATION,
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Durable entrance floor — ceramic tiles, natural stone, or hard-wearing wood. Ceiling light per style description.",
      "Remove construction leftovers: outlets, cables — blend into wall finish. Keep radiators, heaters, vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  // CRITICAL: Camera + geometry preservation FIRST (highest token weight)
  return [
    `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
    CEILING_PRESERVATION, WALL_PRESERVATION,
    `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
    "Refinish the floor and repaint or replaster the walls. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture), preserve it as-is — apply the style's wall color to the other walls only.",
    "Remove all visible construction elements: dangling cables, junction boxes, electrical outlets, round black wall boxes, cable exits — blend into wall finish.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, vents, thermostats, switches in exact position.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no objects. Same number of windows and doors as input.",
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const EQUIPMENT_PRESERVATION = "Keep all wall-mounted equipment visible (radiators, vents, switches, outlets). Do not place furniture in front of radiators.";
const CONTACT_SHADOWS = "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room.";
const DEPTH_DISTRIBUTION = "If the room is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.";

export function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: CAMERA+STRUCTURE first, then furniture
  if (roomTypeId === "kitchen") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings.`,
      EQUIPMENT_PRESERVATION,
      `Add the following kitchen elements to this photo of a finished room: ${furniturePrompt}.`,
      "Built-in cabinetry and countertops against walls. Add island ONLY if kitchen appears >10m2. If compact, skip island.",
      DEPTH_DISTRIBUTION,
      CONTACT_SHADOWS,
      "Scale references: door = 204cm, sill = 90cm. Preserve existing light direction and color temperature. No warm tint or yellow cast. No curtains.",
      "Result should look like a luxury real estate listing photo. DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Bathroom: CAMERA+STRUCTURE first
  if (roomTypeId === "bathroom") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings.`,
      EQUIPMENT_PRESERVATION,
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "Wall-mounted vanity and mirror expected. Other items freestanding. If compact (wall <2m), use 60cm vanity, skip stool/basket. Shower max one-third of any wall.",
      "Scale references: ceiling ~250cm, tile size, plumbing. 60cm min passage width.",
      CONTACT_SHADOWS,
      "Preserve existing light direction and color temperature. No warm tint or yellow cast. No curtains.",
      "Result should look like a luxury real estate listing photo. DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // WC: CAMERA+STRUCTURE first
  if (roomTypeId === "wc") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry.`,
      EQUIPMENT_PRESERVATION,
      `Add the following WC fixtures to this photo of a finished room: ${furniturePrompt}.`,
      "Very small space — minimal items. Wall-hung or floor toilet, compact hand basin with mirror above.",
      CONTACT_SHADOWS,
      "Scale reference: door = 204cm. Preserve existing light direction and color temperature. No warm tint. No curtains.",
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Bedroom: CAMERA+STRUCTURE first
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same number of openings.`,
      EQUIPMENT_PRESERVATION,
      `Add the following bedroom furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Freestanding only — bed, nightstands, rug, wardrobe/dresser as background anchor. No wall art, no shelving, no curtains. Furniture must not touch walls.",
      DEPTH_DISTRIBUTION,
      CONTACT_SHADOWS,
      "Scale bed to room: if compact, 140cm bed instead of 160cm, skip bench. Door = 204cm reference. Preserve existing light direction and color temperature. No warm tint.",
      "Result should look like a luxury real estate listing photo. DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Entryway: CAMERA+STRUCTURE first
  if (roomTypeId === "entryway") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, doors visually identical to input — same geometry.`,
      EQUIPMENT_PRESERVATION,
      `Add the following entryway furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Small space — do not overcrowd. Console max 60% of wall width. Freestanding only: console, mirror propped on console, coat rack, bench, runner rug. No wall art, no curtains.",
      CONTACT_SHADOWS,
      "Door = 204cm reference. Preserve existing light direction and color temperature. No warm tint.",
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Laundry: CAMERA+STRUCTURE first
  if (roomTypeId === "laundry") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling visually identical to input — same geometry.`,
      EQUIPMENT_PRESERVATION,
      `Add the following laundry equipment to this photo of a finished room: ${furniturePrompt}.`,
      "Functional layout — washing machine, cabinet, drying rack, basket. No decorative objects. If compact (<4m2), skip folding table and drying rack.",
      CONTACT_SHADOWS,
      "Door = 204cm reference. Preserve existing light direction and color temperature. No warm tint. No curtains.",
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Cellar: CAMERA+STRUCTURE first
  if (roomTypeId === "cellar") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling visually identical to input — same geometry.`,
      EQUIPMENT_PRESERVATION,
      `Add the following cellar furnishing to this photo of a finished room: ${furniturePrompt}.`,
      "Functional storage — shelving unit, boxes, utility light. Wine rack if space allows. If compact, single shelf, no wine rack.",
      CONTACT_SHADOWS,
      "Door = 204cm reference. Preserve existing light direction and color temperature.",
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // Dining room: CAMERA+STRUCTURE first
  if (roomTypeId === "dining_room") {
    return [
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings.`,
      EQUIPMENT_PRESERVATION,
      `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
      "Center dining table with chairs. If deep room, add sideboard as background anchor. If compact, round table 120cm + 4 chairs instead of rectangular 180cm + 6.",
      "Freestanding only — no wall art, no shelving, no curtains. Furniture must not touch walls.",
      CONTACT_SHADOWS,
      "Door = 204cm, sill = 90cm references. Preserve existing light direction and color temperature. No warm tint.",
      "Result should look like a luxury real estate listing photo. DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain. No text or watermarks.",
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  // CRITICAL: Camera + Structure FIRST (highest token weight in GPT-image-1), then furniture
  return [
    `${CAMERA_PRESERVATION} Room structure is LOCKED: walls, floor, ceiling, windows, doors visually identical to input — same angles, same geometry, same number of openings. If input has zero windows, output has zero windows.`,
    EQUIPMENT_PRESERVATION,
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Freestanding objects only — no wall art, no shelving, no curtains. Furniture must not touch walls.",
    "Distribute furniture across FULL DEPTH and WIDTH: primary group foreground, secondary group further back if space allows.",
    CONTACT_SHADOWS,
    "Scale references: door = 204cm, handle = 100cm, sill = 90cm. Scale furniture to room volume — if compact (<4m wide), use smaller pieces. Scale up if ceiling >3m.",
    "Preserve existing light direction and color temperature. No warm tint or yellow cast. No duplicate items unless style calls for a pair.",
    "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
    "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle film grain at 100% zoom. Natural lens vignetting 5-10%. No text or watermarks.",
  ].join(" ");
}

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
export function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    "Edit this outdoor photo. Keep exact same camera angle, lens distortion, vanishing points.",
    "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky.",
    `Apply this ground surface finish: ${surfacePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Preserve all fixed ground elements: metal access covers, drain grates, manholes, utility plates. Apply the new ground material AROUND these elements, not over them.",
    "Preserve all expansion joints, step nosings, level changes, and threshold transitions in the ground surface.",
    "Preserve all existing guard rails, exterior walls, facades, gates and fences. Do not add or remove any vertical structure.",
    "Keep the existing wall color and texture — do not warm, smooth, or repaint walls unless the surface prompt explicitly names a wall finish.",
    "Glass blocks and skylights keep their translucency — light passes through them in the output.",
    "Preserve existing vegetation in the background. Only modify ground surface in the foreground zone.",
    "Maintain the exact wall and facade color temperature from the input — do not warm or cool the surfaces.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "No furniture in this pass — EMPTY outdoor space with finished ground only.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Outdoor Pass 2: Outdoor furniture placement ─────────────────────────
export function buildOutdoorFurnitureResponsesPrompt(
  furniturePrompt: string,
  subtypeOverride: string
): string {
  return [
    `Add outdoor furniture and decoration to this photo of a finished outdoor space: ${furniturePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back.",
    "Use visible architectural cues as scale references — a standard guard rail is 100cm tall, a French door is 215cm tall, a floor tile 60x60cm. All furniture must be proportional to these references.",
    "All lighting fixtures must be OFF in daylight — unlit lanterns with cold wax candle stub visible (no flame, no glow, no warm light), unlit string lights with dark glass bulbs, no glowing filaments, no visible flames anywhere.",
    "All cushions, rugs, and textiles must be outdoor-rated weather-resistant (Sunbrella-type acrylic or waterproof polyester). No indoor fabric textures.",
    "Scale all plants to match the space: on a balcony or small terrace (under 15m2) no plant exceeds 120cm total height. On a garden or large terrace, potted trees must not exceed 200cm.",
    "If the outdoor space appears compact (under ~10m2 visible floor), scale down: use a 120cm bistro table instead of 160cm dining, skip large sofas, limit to 2 chairs instead of 4.",
    "Do not place opaque structures (screens, shelving, A-frames) directly in front of full-height windows or glass doors.",
    "If the space has exposed overhead structure (beams, pergola, rafters), consider hanging one trailing plant or lantern from it to activate the vertical dimension — only if clearance allows.",
    "Ground surfaces are LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    "Every piece must cast realistic shadows consistent with the existing natural light direction.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
export async function tryOpenAIResponses(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  size: string,
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  const openai = getOpenAI();

  let prompt: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesResponsesPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "")
        : buildOutdoorFurnitureResponsesPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "");
  } else {
    prompt =
      pass === 1
        ? buildSurfacesResponsesPrompt(surfacePrompt, roomTypeId)
        : buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- image_generation tool not in SDK types
  const response = await withTimeout(
    openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      tools: [
        {
          type: "image_generation",
          model: IMAGE_MODEL,
          action: "edit",
          quality: "high",
          input_fidelity: "high",
          size: size as "1024x1024" | "1536x1024" | "1024x1536",
        },
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
    API_TIMEOUT_MS,
    "OpenAI Responses API"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageOutput = (response as any).output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: `OpenAI ${IMAGE_MODEL} (pass ${pass})`,
  };
}

// ─── Iteration-specific generation (pre-built prompt) ────────────────
export async function tryOpenAIResponsesWithPrompt(
  imageBase64: string,
  prompt: string,
  size: string
): Promise<{ image: string; model: string }> {
  const openai = getOpenAI();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- image_generation tool not in SDK types
  const response = await withTimeout(
    openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
            { type: "input_text", text: prompt },
          ],
        },
      ],
      tools: [
        {
          type: "image_generation",
          model: IMAGE_MODEL,
          action: "edit",
          quality: "high",
          input_fidelity: "high",
          size: size as "1024x1024" | "1536x1024" | "1024x1536",
        },
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
    API_TIMEOUT_MS,
    "OpenAI Responses API"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageOutput = (response as any).output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API (iteration)");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API (iteration)");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: `OpenAI ${IMAGE_MODEL} (iteration)`,
  };
}

export async function generateIterationPass(
  base64Image: string,
  responsesPrompt: string,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Clé API OpenAI requise pour les itérations.");
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_PASS_RETRIES; attempt++) {
    try {
      return await tryOpenAIResponsesWithPrompt(base64Image, responsesPrompt, outputSize.openai);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI iteration attempt ${attempt + 1}/${MAX_PASS_RETRIES} failed:`, lastError.message);
      if (attempt < MAX_PASS_RETRIES - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(`Échec itération après ${MAX_PASS_RETRIES} tentatives. ${lastError?.message ?? ""}`);
}

// ─── Generate one pass with retry (GPT-4.1 only, no Flux fallback) ──
const MAX_PASS_RETRIES = 2; // 1 initial + 1 retry
const RETRY_DELAY_MS = 2_000;

export async function generatePass(
  base64Image: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  outputSize: { openai: string; w: number; h: number },
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Clé API OpenAI non configurée.");
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_PASS_RETRIES; attempt++) {
    try {
      return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai, roomTypeId, outdoor);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} attempt ${attempt + 1}/${MAX_PASS_RETRIES} failed:`, lastError.message);
      if (attempt < MAX_PASS_RETRIES - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  throw new Error(`Échec passe ${pass} après ${MAX_PASS_RETRIES} tentatives. ${lastError?.message ?? ""}`);
}


// ─── High-level pipeline for queue worker ─────────────────────────
export interface PipelineParams {
  inputBase64: string;
  surfacePrompt: string;
  furniturePrompt: string;
  styleId?: string | null;
  roomType?: string | null;
  isOutdoor?: boolean;
  outdoorSubtype?: string | null;
  width: number;
  height: number;
  withFurniture?: boolean;
}

export interface PipelineResult {
  outputBase64: string;
  pass1Base64: string;
  pass1Model: string;
  pass2Model: string | null;
  pass2Failed: boolean;
  durationMs: number;
  pass1DurationMs: number;
  pass2DurationMs: number;
  builtPromptPass1: string;
  builtPromptPass2: string;
  trimmedSurface: string;
  trimmedFurniture: string;
}

export async function runGenerationPipeline(params: PipelineParams): Promise<PipelineResult> {
  const {
    inputBase64, surfacePrompt, furniturePrompt,
    roomType, isOutdoor, outdoorSubtype, width, height,
    withFurniture = true,
  } = params;

  const outputSize = getOutputSize(width, height);

  // Apply room type / outdoor overrides
  let trimmedSurface: string;
  let trimmedFurniture: string;
  let outdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;

  if (isOutdoor) {
    const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
      applyOutdoorSubtypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), outdoorSubtype ?? null);
    trimmedSurface = effectiveSurfacePrompt;
    trimmedFurniture = effectiveFurniturePrompt;
    const sub = outdoorSubtype ? OUTDOOR_SUBTYPES[outdoorSubtype] : null;
    outdoorParam = {
      isOutdoor: true,
      subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
      subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
    };
  } else {
    const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
    const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);
    const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
      applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);
    trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;
    trimmedFurniture = effectiveFurniturePrompt;
  }

  const t0 = Date.now();

  // Pass 1: surfaces
  const pass1 = await generatePass(inputBase64, trimmedSurface, trimmedFurniture, 1, outputSize, isOutdoor ? null : roomType, outdoorParam);
  const t1 = Date.now();
  const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

  // Build prompts for logging
  const builtPromptPass1 = isOutdoor
    ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "")
    : buildSurfacesResponsesPrompt(trimmedSurface, roomType);
  const builtPromptPass2 = isOutdoor
    ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "")
    : buildFurnitureResponsesPrompt(trimmedFurniture, roomType);

  // Surfaces-only mode
  if (!withFurniture) {
    return {
      outputBase64: pass1Base64, pass1Base64,
      pass1Model: pass1.model, pass2Model: null, pass2Failed: false,
      durationMs: t1 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: 0,
      builtPromptPass1, builtPromptPass2, trimmedSurface, trimmedFurniture,
    };
  }

  // Pass 2: furniture (retry up to 2 attempts)
  let pass2: { image: string; model: string } | null = null;
  let pass2Failed = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, isOutdoor ? null : roomType, outdoorParam);
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Pipeline pass 2 attempt ${attempt}/2 failed: ${msg}`);
    }
  }
  if (!pass2) pass2Failed = true;

  const t2 = Date.now();
  const finalBase64 = pass2
    ? pass2.image.replace(/^data:image\/[\w+]+;base64,/, "")
    : pass1Base64;

  return {
    outputBase64: finalBase64, pass1Base64,
    pass1Model: pass1.model, pass2Model: pass2?.model ?? null, pass2Failed,
    durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
    builtPromptPass1, builtPromptPass2, trimmedSurface, trimmedFurniture,
  };
}
