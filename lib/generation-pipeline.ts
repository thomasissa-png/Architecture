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
export function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: dedicated compact prompt (~100 words)
  if (roomTypeId === "kitchen") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Ceramic or natural stone floor tiles — NOT wood, NOT parquet. Subway tile or smooth splashback behind work area.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "For the ceiling light fixture, follow the style description above exactly.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment: radiators, switches, vents in exact position.",
      "Room stays COMPLETELY EMPTY — no furniture, no appliances, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: dedicated compact prompt (~100 words)
  if (roomTypeId === "bathroom") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Floor-to-ceiling ceramic tiles in shower zone and behind vanity area. Water-resistant floor — ceramic or stone tiles, matte non-slip. No wood flooring. Recessed IP44 ceiling spotlights.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // WC: dedicated compact prompt (~90 words)
  if (roomTypeId === "wc") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles or vinyl in neutral tone. Washable matte paint or ceramic tiles on lower half of walls.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "Remove construction leftovers including electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom (adults/children): dedicated compact prompt (~105 words)
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Warm-toned flooring suitable for bare feet. For the ceiling light fixture, follow the style description above exactly.",
      "If the input has ONE accent wall (different color or texture from the other walls), preserve that accent wall as-is — apply the style's wall color to the remaining walls. If ALL walls share the same color, apply the style's wall color to ALL walls uniformly.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: dedicated compact prompt (~90 words)
  if (roomTypeId === "laundry") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof easy-to-clean floor — white or light grey ceramic tiles matte finish. Walls in washable matte white paint.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "Remove construction leftovers including electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no appliances, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: dedicated compact prompt (~90 words)
  if (roomTypeId === "cellar") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Concrete or stone floor kept as-is or with simple sealant. Clean matte white or light grey paint over existing masonry.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "Remove construction leftovers including electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no shelving, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: dedicated compact prompt (~95 words)
  if (roomTypeId === "entryway") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Durable floor finish suitable for an entrance — ceramic tiles, natural stone, or hard-wearing wood.",
      CEILING_PRESERVATION, WALL_PRESERVATION,
      "For the ceiling light fixture, follow the style description above exactly.",
      "Remove construction leftovers including electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  return [
    "Edit this photo of a room.",
    `Apply this surface finish: ${surfacePrompt}.`,
    "Refinish the floor and repaint or replaster the walls. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture from the other walls), preserve that accent wall as-is — apply the style's wall color to the remaining walls. If ALL walls share the same color, apply the style's wall color to ALL walls uniformly.",
    CEILING_PRESERVATION, WALL_PRESERVATION,
    "Remove all visible construction elements: dangling cables, exposed wiring, junction boxes without covers, cable conduits, temporary fixtures, electrical outlets, round black wall boxes, and cable exits. They must blend seamlessly into the wall finish.",
    "Do not add baseboards or moldings unless clearly present in the input photo.",
    "Preserve all wall-mounted fixed equipment visible in the input: radiators, heaters, vents, thermostats, electrical panels, switches, and outlets must remain in their exact position, size, and appearance.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration, no objects.",
    "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output.",
    `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const STRUCTURE_LOCKED = "Room structure is LOCKED: walls, floor, ceiling, windows visually identical to input. Shadows from furniture are natural. No new openings.";
const EQUIPMENT_PRESERVATION = "Keep all wall-mounted equipment visible (radiators, vents, switches, outlets). Do not place furniture in front of radiators.";
const CONTACT_SHADOWS = "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room.";
const DEPTH_DISTRIBUTION = "If the room is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.";
const CAMERA_AND_PHOTO = `${CAMERA_PRESERVATION} DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Subtle photographic film grain must be visible at 100% zoom — not smooth CGI rendering. Natural lens vignetting darkening the corners by 5-10%. No text or watermarks.`;

export function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: compact dedicated prompt (~95 words) — built-ins allowed, no depth distribution
  if (roomTypeId === "kitchen") {
    return [
      `Add the following kitchen elements to this photo of a finished room: ${furniturePrompt}.`,
      "Built-in cabinetry and countertops against walls. Add island or peninsula with stools ONLY if the kitchen is wide enough (visible floor area suggests >10m2). If the kitchen appears compact, skip the island entirely.",
      DEPTH_DISTRIBUTION,
      CONTACT_SHADOWS,
      "Place all elements with correct perspective and scale on the existing floor. Use door frames and window sills as scale references.",
      "Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Bathroom: compact dedicated prompt (~90 words) — wall-mounted vanity allowed, no depth distribution
  if (roomTypeId === "bathroom") {
    return [
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding.",
      "Bathrooms are typically small — scale ALL fixtures to fit within the visible floor area. If the room appears compact (one wall visible is under 2m), use a 60cm vanity instead of 80cm, skip the stool and basket, keep only essentials (shower, vanity, mirror, towel ladder). The shower enclosure must NOT extend beyond one-third of any visible wall.",
      "Use ceiling height (~250cm), tile size, and visible plumbing as scale references. Every fixture must leave at least 60cm clear passage width between it and the opposite wall or fixture.",
      CONTACT_SHADOWS,
      "Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // WC: compact dedicated prompt (~80 words) — very small space, minimal items
  if (roomTypeId === "wc") {
    return [
      `Add the following WC fixtures to this photo of a finished room: ${furniturePrompt}.`,
      "Very small space — minimal items only. Wall-hung or floor toilet, compact hand basin with mirror above.",
      CONTACT_SHADOWS,
      "Place all elements with correct perspective and scale. Use door frame (204cm) as scale reference. Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Bedroom (adults/children): compact dedicated prompt (~100 words) — no depth distribution, no double-height scaling
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Add the following bedroom furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Freestanding furniture only — bed, nightstands, rug beside bed, wardrobe or dresser as background anchor. No wall-mounted art, no built-in shelving, no curtains.",
      DEPTH_DISTRIBUTION,
      CONTACT_SHADOWS,
      "Scale bed to room: if compact room, use 140cm bed instead of 160cm, skip bench at foot. Place all objects naturally with correct perspective and scale. Use door frame height (204cm) as reference.",
      "Preserve existing light direction and color temperature. Calm atmosphere — respect furniture density implied by the style.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "The output must have the exact same number of windows as the input.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Entryway: compact dedicated prompt (~85 words) — small space, minimal items
  if (roomTypeId === "entryway") {
    return [
      `Add the following entryway furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Small space — do not overcrowd. Scale console to visible wall width — never wider than 60% of the available wall. Freestanding items only: console, mirror propped on console, coat rack, small bench, runner rug. No wall-mounted art, no curtains.",
      CONTACT_SHADOWS,
      "Place all objects with correct perspective and scale. Use door frame (204cm tall) as scale reference. Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Laundry: compact dedicated prompt (~85 words) — functional, no decoration
  if (roomTypeId === "laundry") {
    return [
      `Add the following laundry equipment to this photo of a finished room: ${furniturePrompt}.`,
      "Functional layout — washing machine, storage cabinet, drying rack, laundry basket. No decorative objects, no luxury items.",
      "If the room appears compact (under 4m2 visible floor), skip the folding table and drying rack — keep only washing machine, cabinet, and basket.",
      CONTACT_SHADOWS,
      "Place all elements with correct perspective and scale. Use door frame (204cm) as scale reference. Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Cellar: compact dedicated prompt (~85 words) — storage, no luxury
  if (roomTypeId === "cellar") {
    return [
      `Add the following cellar furnishing to this photo of a finished room: ${furniturePrompt}.`,
      "Functional storage — shelving unit, storage boxes, utility light. Wine rack if space allows. No luxury furniture, no decorative objects.",
      "If the room appears compact or narrow, use a single shelving unit and skip the wine rack.",
      CONTACT_SHADOWS,
      "Place all elements with correct perspective and scale. Use door frame (204cm) as scale reference. Preserve existing light direction and color temperature.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Dining room: compact dedicated prompt (~110 words) — depth distribution relevant
  if (roomTypeId === "dining_room") {
    return [
      `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
      "Center the dining table with chairs. If room is deep or has multiple zones, add a sideboard or buffet as background anchor. If the room appears compact, use a round table 120cm with 4 chairs instead of a rectangular 180cm table with 6 chairs.",
      "Every piece must appear firmly grounded on the floor with visible contact shadows. Place all objects naturally with correct perspective and scale. Use door frame (204cm) and window sill as scale references. Cast realistic shadows matching existing light — soft for diffused, hard for direct sunlight.",
      "Preserve existing light direction and color temperature. Respect furniture density implied by the style. If room appears small, reduce accent pieces. Furniture must never appear to touch or crowd the walls.",
      "Freestanding objects only — no wall art, no shelving, no curtains. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged, not blocking radiators). Shadows from new furniture are expected.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ── (condensed ~180 words)
  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Distribute furniture across FULL DEPTH and WIDTH: primary group foreground, secondary group further back if space allows, lateral anchor on opposite side if room is wide.",
    "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room. Match shadow hardness to lighting type: soft for diffused, hard-edged for direct sunlight.",
    "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
    "Scale references: door = 204cm, handle = 100cm, sill = 90cm. Scale furniture to room volume — if compact (<4m wide), use smaller pieces than described in the style. Scale up if ceiling >3m. Furniture must not touch walls.",
    "Preserve existing light direction and color temperature from the input photo. No warm tint or yellow cast.",
    "Respect style density. If minimalist, leave large empty floor areas. If room small, reduce accent pieces. No duplicate items unless style calls for a pair.",
    "Freestanding only — no wall art, no shelving, no curtains. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged). Do not block radiators. If input has zero windows, output has zero windows.",
    CAMERA_AND_PHOTO,
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
