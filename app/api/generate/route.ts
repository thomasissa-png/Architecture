import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Singleton OpenAI client — reuses HTTP connections across passes
let _openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}
// Replicate (Flux) REMOVED — GPT-4.1 only with retry (Sprint 23)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decrementCredit, addCredits } from "@/lib/credits";
import { logGeneration, savePass1Cache, getPass1Cache, getPool, saveIterationBase, getIterationBase } from "@/lib/db";
import { preprocessIterationComment, classifyIterationIntent } from "@/lib/custom-prompt";
import {
  buildIterationFurnitureResponsesPrompt,
  MAX_ITERATIONS,
  PASS1_TTL_MS,
} from "@/lib/iteration-prompt";
import { applyRoomTypeOverrides } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";
import { saveUserPhoto } from "@/lib/user-photos";
import {
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildAdjustResponsesPrompt,
  buildAdjustOutdoorResponsesPrompt,
} from "@/lib/iteration-prompt";

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

// Global deadline for the entire route — prevents Replit proxy 504.
// Budget: pass1 up to 120s + pass2 up to 120s = 240s worst case.
// We cap at 150s to leave margin before Replit proxy timeout (~180s).
const ROUTE_DEADLINE_MS = 150_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
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

function checkRateLimit(ip: string): boolean {
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
function getOutputSize(
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
function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
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

function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
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
function buildOutdoorSurfacesResponsesPrompt(
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
function buildOutdoorFurnitureResponsesPrompt(
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
async function tryOpenAIResponses(
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
async function tryOpenAIResponsesWithPrompt(
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

async function generateIterationPass(
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

async function generatePass(
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

// ─── API Route Handler ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute avant de réessayer." },
      { status: 429 }
    );
  }

  // F4: Internal dossier batch calls skip auth + credit (already handled by dossier API)
  // Secured with a shared secret to prevent external clients from bypassing auth/credits
  const internalSecret = request.headers.get("X-Internal-Secret");
  const isInternalDossierCall =
    request.headers.get("X-Internal-Dossier") === "true" &&
    !!internalSecret &&
    !!process.env.INTERNAL_API_SECRET &&
    internalSecret === process.env.INTERNAL_API_SECRET;

  // Auth + credit check
  // - Connected users: use credit system (optimistic decrement)
  // - Anonymous users: allowed with IP rate limit only (2 free generations enforced by rate limit)
  // - Internal dossier calls: skip (credits managed by dossier batch endpoint)
  const session = isInternalDossierCall ? null : await getServerSession(authOptions);
  console.log(`[generate] session: userId="${session?.user?.id || "NONE"}" email="${session?.user?.email || "NONE"}" isInternal=${isInternalDossierCall}`);

  if (!isInternalDossierCall && session?.user?.id) {
    // Connected user — decrement credit optimistically
    const decremented = await decrementCredit(session.user.id);
    if (!decremented) {
      return NextResponse.json(
        { error: "Plus de visuels disponibles. Rechargez pour continuer." },
        { status: 402 }
      );
    }
  }
  // Anonymous users pass through — protected by IP rate limit (10 req/min)

  let styleId = "unknown";

  try {
    const body = await request.json();
    const {
      image,
      surfacePrompt,
      furniturePrompt,
      styleId: bodyStyleId = "custom",
      withFurniture = true,
      width,
      height,
      // F1 iteration params
      pass1_key: pass1Key,
      iterationComment,
      previousModifications = [],
      sessionId,
      // F2 room type
      roomType = null,
      // F3 outdoor
      isOutdoor = false,
      outdoorSubtype = null,
    } = body as {
      image?: string;
      surfacePrompt?: string;
      furniturePrompt?: string;
      styleId?: string;
      withFurniture?: boolean;
      width?: number;
      height?: number;
      pass1_key?: string;
      iterationComment?: string;
      previousModifications?: string[];
      sessionId?: string;
      roomType?: string | null;
      isOutdoor?: boolean;
      outdoorSubtype?: string | null;
    };

    styleId = bodyStyleId;

    // ── F1 Iteration flow: adjust (edit furnished) or restyle (re-pass 2) ──
    if (pass1Key) {
      if (!iterationComment || !iterationComment.trim()) {
        return NextResponse.json(
          { error: "Le commentaire d'itération est requis." },
          { status: 400 }
        );
      }

      // Load pass 1 from Object Storage cache
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Check TTL (24h)
      const age = Date.now() - cached.meta.createdAt;
      if (age > PASS1_TTL_MS) {
        return NextResponse.json(
          { error: "Les surfaces de cette génération ont expiré (>24h). Regénérez depuis l'image originale." },
          { status: 410 }
        );
      }

      // Check max iterations
      if (previousModifications.length >= MAX_ITERATIONS) {
        return NextResponse.json(
          { error: `Nombre maximum d'itérations atteint (${MAX_ITERATIONS}).` },
          { status: 403 }
        );
      }

      const outputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const originalFurniturePrompt = cached.meta.furniturePrompt;

      // Classify intent: adjust (edit furnished image) vs restyle (redo from empty)
      console.log("Classifying iteration intent...");
      const intent = await classifyIterationIntent(iterationComment.trim());
      console.log(`Iteration intent: ${intent}`);

      // Pre-process the iteration comment via GPT-4.1-mini
      console.log("Pre-processing iteration comment...");
      const preprocessResult = await preprocessIterationComment(
        iterationComment.trim(),
        cached.meta.styleId,
        originalFurniturePrompt
      );

      // Build all modifications: previous + current enriched
      const allModifications = [...previousModifications, preprocessResult.enrichedComment];

      // Build iteration prompts — use outdoor builders if the original generation was outdoor
      const iterMeta = {
        width: cached.meta.width,
        height: cached.meta.height,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor,
        allowWallMounted: preprocessResult.allowWallMounted,
      };

      let responsesPrompt: string;
      let sourceImageBase64: string;

      if (intent === "adjust") {
        // ADJUST mode: edit the furnished result, keep existing furniture
        // Try to load the last furnished result from Object Storage
        const effectiveSessionId = sessionId ?? pass1Key;
        const furnishedBase64 = await getIterationBase(effectiveSessionId);

        if (furnishedBase64) {
          sourceImageBase64 = furnishedBase64;
          console.log("Adjust mode: using furnished iteration base image");
        } else {
          // Fallback: no furnished image stored yet — use pass1 (restyle behavior)
          sourceImageBase64 = cached.imageBase64;
          console.log("Adjust mode: no iteration base found, falling back to pass1 image");
        }

        // Build adjust-specific prompts (preserve existing, apply change only)
        if (cached.meta.isOutdoor) {
          responsesPrompt = buildAdjustOutdoorResponsesPrompt(
            iterationComment.trim(),
            preprocessResult.enrichedComment,
          );

        } else {
          responsesPrompt = buildAdjustResponsesPrompt(
            iterationComment.trim(),
            preprocessResult.enrichedComment,
            iterMeta,
          );

        }
      } else {
        // RESTYLE mode: original behavior — re-pass 2 from empty pass1 image
        sourceImageBase64 = cached.imageBase64;
        console.log("Restyle mode: using pass1 (empty) image");

        if (cached.meta.isOutdoor) {
          responsesPrompt = buildIterationOutdoorFurnitureResponsesPrompt(
            originalFurniturePrompt,
            allModifications,
          );

        } else {
          responsesPrompt = buildIterationFurnitureResponsesPrompt(
            originalFurniturePrompt,
            allModifications,
            iterMeta,
          );

        }
      }

      const t0 = Date.now();

      // Check if client disconnected before starting expensive iteration
      if (request.signal?.aborted) {
        throw new Error("Client disconnecté avant le début de l'itération.");
      }

      console.log(`Starting iteration (${intent})... Output size: ${outputSize.openai}`);
      const result = await generateIterationPass(sourceImageBase64, responsesPrompt, outputSize);
      const t1 = Date.now();

      const outputBase64 = result.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const iterationNumber = previousModifications.length + 1;

      // Fire-and-forget: save the furnished result as the new iteration base
      const effectiveSessionId = sessionId ?? pass1Key;
      saveIterationBase(effectiveSessionId, outputBase64).catch((err) =>
        console.error("saveIterationBase (iteration) failed:", err)
      );

      const response = NextResponse.json({
        image: result.image,
        model: result.model,
        iterationNumber,
        warnings: preprocessResult.warnings,
        enrichedComment: preprocessResult.enrichedComment,
        intent,
      });

      // Fire-and-forget: log + save iteration image
      logGeneration({
        ip,
        styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt,
        furniturePrompt: originalFurniturePrompt,
        withFurniture: true,
        inputWidth: cached.meta.width,
        inputHeight: cached.meta.height,
        modelUsed: `${result.model} (${intent})`,
        pass2Model: result.model,
        durationMs: t1 - t0,
        pass2DurationMs: t1 - t0,
        success: true,
        builtPromptPass2: responsesPrompt,
        outputBase64,
        // Iteration-specific fields
        isIteration: true,
        iterationNumber,
        sessionId: sessionId ?? undefined,
        userCommentRaw: iterationComment.trim(),
        userCommentEnriched: preprocessResult.enrichedComment,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.outdoorSubtype ?? undefined,
        promptVersion: PROMPT_VERSION,
      }).catch((err) => console.error("DB log (iteration) failed:", err));

      // Save iteration as a NEW user_photos entry (Bug 4 fix)
      // CRITICAL: await output saveImage before calling saveUserPhoto.
      // Skip entirely if outputKey is null to avoid "Image non disponible" in gallery.
      // Must await (with timeout) before returning response — fire-and-forget is killed
      // by Replit's serverless runtime after the response is sent.
      if (session?.user?.id) {
        const iterPhotoPromise = (async () => {
          try {
            const { saveImage: saveImg } = await import("@/lib/db");
            const ts = Date.now();

            const outputKey = await saveImg(outputBase64, `user_photo_iter${iterationNumber}_${ts}_output`).catch((err) => {
              console.error("[saveUserPhoto iteration] output saveImage failed:", err);
              return null;
            });

            if (!outputKey) {
              console.error("[saveUserPhoto iteration] SKIPPING — outputKey is null");
              return null;
            }

            const pass1ImageKey = cached.imageBase64
              ? await saveImg(cached.imageBase64, `user_photo_iter${iterationNumber}_${ts}_pass1`).catch(() => null)
              : null;

            await saveUserPhoto({
              userId: session.user.id,
              inputImageKey: null, // original input not available in iteration cache
              outputImageKey: outputKey,
              pass1ImageKey: pass1ImageKey,
              styleId: cached.meta.styleId || null,
              roomType: cached.meta.isOutdoor ? null : (cached.meta.roomType || null),
              roomLabel: null,
              isOutdoor: cached.meta.isOutdoor || false,
              propertyId: null,
            });
            return outputKey;
          } catch (err) {
            console.error("saveUserPhoto (iteration) failed:", err);
            return null;
          }
        })();

        // Wait up to 5s for the gallery save to complete before returning
        await Promise.race([
          iterPhotoPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
      }

      // Generation succeeded — credit was already decremented optimistically

      return response;
    }

    // ── Standard generation flow (pass 1 + pass 2) ────────────────────
    if (!image || !surfacePrompt || !furniturePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Calculate output size matching the input aspect ratio
    const outputSize = getOutputSize(width, height);

    const base64Image = image.replace(/^data:image\/[\w+]+;base64,/, "");

    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image dépasse la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    // ── Pipeline 2 passes ────────────────────────────────────────────
    // Pass 1: Finish surfaces using surfacePrompt — room stays empty
    // Pass 2 (optional): Add furniture using furniturePrompt — surfaces untouched

    // F3: Apply outdoor subtype overrides OR F2 room type overrides (mutually exclusive)
    let trimmedSurface: string;
    let trimmedFurniture: string;
    let outdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;

    if (isOutdoor) {
      // Outdoor mode: apply subtype overrides, no room type
      const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
        applyOutdoorSubtypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), outdoorSubtype ?? null);
      trimmedSurface = effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;

      // Extract raw subtype overrides for injection into builders
      const sub = outdoorSubtype ? OUTDOOR_SUBTYPES[outdoorSubtype] : null;
      outdoorParam = {
        isOutdoor: true,
        subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
        subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
      };
    } else {
      // Indoor mode: apply room type overrides
      // Rooms with dedicated builders absorb surface directives directly — skip surface concatenation
      // but still need furniture replacement and negative override from applyRoomTypeOverrides
      // dining_room excluded: it has dedicated FURNITURE builders but no dedicated SURFACE builder,
      // so it needs the standard surface concatenation path (roomSurfaceOverride appended to surfacePrompt).
      const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
      const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);

      const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
        applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);

      // If dedicated builder exists: use raw style surfacePrompt (builder handles room specifics)
      // Otherwise: use the concatenated effectiveSurfacePrompt (room override appended)
      trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;
    }

    const t0 = Date.now();

    // Check if client disconnected before starting expensive work.
    // Next.js App Router provides request.signal that aborts when the client drops the connection.
    // This prevents wasting OpenAI API credits on abandoned requests.
    if (request.signal?.aborted) {
      throw new Error("Client disconnecté avant le début de la génération.");
    }

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}${isOutdoor ? ` outdoor subtype: ${outdoorSubtype}` : roomType ? ` roomType: ${roomType}` : ""}`);
    const pass1 = await generatePass(base64Image, trimmedSurface, trimmedFurniture, 1, outputSize, isOutdoor ? null : roomType, outdoorParam);
    const t1 = Date.now();

    // Build the final prompts for logging (what the model actually receives)
    const builtPromptPass1 = isOutdoor
      ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "")
      : buildSurfacesResponsesPrompt(trimmedSurface, roomType);
    const builtPromptPass2 = isOutdoor
      ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "")
      : buildFurnitureResponsesPrompt(trimmedFurniture, roomType);

    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    // Cache pass 1 for F1 iterations (fire-and-forget)
    const pass1CacheKey = sessionId
      ? `sessions/${sessionId}/pass1_${Date.now()}.jpg`
      : `sessions/anon_${Date.now()}/pass1.jpg`;

    let pass1Saved = false;
    // R4: Launch cache save in parallel — pass 2 uses pass1Base64 from memory, not cache
    const pass1CachePromise = savePass1Cache(pass1CacheKey, pass1Base64, {
      width: width ?? outputSize.w,
      height: height ?? outputSize.h,
      styleId,
      furniturePrompt: trimmedFurniture,
      surfacePrompt: trimmedSurface,
      createdAt: Date.now(),
      roomType: isOutdoor ? null : (roomType ?? null),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
    })
      .then(() => { pass1Saved = true; })
      .catch((err) => console.error("Pass1 cache save failed:", err));

    // If surfaces-only mode, return pass 1 result directly
    if (!withFurniture) {
      // Await cache save before responding (need pass1Saved flag + Replit kills worker after response)
      await pass1CachePromise;
      const outputBase64 = pass1Base64;
      const response = NextResponse.json({
        image: pass1.image,
        model: `${pass1.model} (surfaces uniquement)`,
        ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
      });

      // Fire-and-forget: log to DB + save images to filesystem
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: false, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (surfaces uniquement)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, outputBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
      }).catch((err) => console.error("DB log failed:", err));

      // Generation succeeded — credit was already decremented optimistically

      return response;
    }

    // Pass 2 is ALWAYS attempted after a successful pass 1 (audit #36, #39, #40: empty rooms = no client value).
    // Retry once before falling back to pass 1 result alone.
    // Check global deadline — if pass 1 was slow, skip pass 2 rather than risk a 504.
    const elapsedAfterPass1 = Date.now() - t0;
    const remainingBudget = ROUTE_DEADLINE_MS - elapsedAfterPass1;

    console.log(`Starting pass 2 (furniture)... Elapsed: ${Math.round(elapsedAfterPass1 / 1000)}s, remaining budget: ${Math.round(remainingBudget / 1000)}s`);
    let pass2: { image: string; model: string } | null = null;
    let pass2Failed = false;
    let pass2Attempts = 0;

    if (request.signal?.aborted) {
      // Client disconnected after pass 1 — don't waste credits on pass 2
      console.warn("Client disconnected after pass 1 — skipping pass 2");
      pass2Failed = true;
      pass2Attempts = 0;
    } else if (remainingBudget < 30_000) {
      // Less than 30s left — not enough for a pass 2 attempt. Deliver pass 1.
      console.warn(`Deadline approaching (${Math.round(remainingBudget / 1000)}s left) — skipping pass 2 to avoid 504`);
      pass2Failed = true;
      pass2Attempts = 0;
    }

    if (!pass2Failed) for (let attempt = 1; attempt <= 2; attempt++) {
      pass2Attempts = attempt;
      try {
        pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, isOutdoor ? null : roomType, outdoorParam);
        break; // success
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Pass 2 attempt ${attempt}/2 failed: ${msg}`);
        if (attempt < 2) {
          console.log("Retrying pass 2...");
        }
      }
    }

    const t2 = Date.now();

    // If pass 2 failed after 2 attempts, deliver pass 1 (surfaces only) with pass2Failed flag
    if (!pass2) {
      pass2Failed = true;
      console.warn("Pass 2 failed after 2 attempts — delivering pass 1 (surfaces only)");

      // Refund the credit — delivering an empty room (surfaces only) is not the paid service.
      if (session?.user?.id) {
        addCredits(session.user.id, 1).catch((refundErr) => {
          console.error("CRITICAL: Credit refund (pass2 failed) failed for user", session.user.id, refundErr);
        });
        console.log(`[generate] Credit refunded for user ${session.user.id} (pass 2 failed)`);
      }
    }

    const finalImage = pass2 ? pass2.image : pass1.image;
    const outputBase64 = finalImage.replace(/^data:image\/[\w+]+;base64,/, "");

    // Fire-and-forget: save furnished result as iteration base for future adjust iterations
    if (sessionId) {
      saveIterationBase(sessionId, outputBase64).catch((err) =>
        console.error("saveIterationBase (initial gen) failed:", err)
      );
    }

    // Save to user gallery BEFORE sending response (critical for Replit autoscale).
    // On autoscale, the worker is killed after the response is sent.
    // Any async work after NextResponse.json() will be lost.
    let photoId: string | null = null;
    console.log(`[generate] saveUserPhoto check: userId="${session?.user?.id || "NONE"}" — ${session?.user?.id ? "WILL save to gallery" : "SKIPPING gallery save (no session)"}`);
    if (session?.user?.id) {
      try {
        const { saveImage: saveImg } = await import("@/lib/db");
        const ts = Date.now();

        // Save output image — retry once on failure
        let outputKey = await saveImg(outputBase64, `user_photo_${ts}_output`).catch((err) => {
          console.error("[saveUserPhoto] output saveImage failed (attempt 1):", err);
          return null;
        });

        if (!outputKey) {
          await new Promise((r) => setTimeout(r, 1000));
          outputKey = await saveImg(outputBase64, `user_photo_${ts}_output_r`).catch((err) => {
            console.error("[saveUserPhoto] output saveImage failed (attempt 2):", err);
            return null;
          });
        }

        if (outputKey) {
          // Save input and pass1 in parallel (non-critical)
          const [inputKey, pass1ImageKey] = await Promise.all([
            saveImg(base64Image, `user_photo_${ts}_input`).catch(() => null),
            pass1Base64 ? saveImg(pass1Base64, `user_photo_${ts}_pass1`).catch(() => null) : null,
          ]);

          photoId = await saveUserPhoto({
            userId: session.user.id,
            inputImageKey: inputKey,
            outputImageKey: outputKey,
            pass1ImageKey: pass1ImageKey,
            styleId: styleId || null,
            roomType: isOutdoor ? null : (roomType || null),
            roomLabel: null,
            isOutdoor: isOutdoor || false,
            propertyId: null,
          });
          console.log(`[generate] saveUserPhoto SUCCESS: photoId=${photoId} outputKey=${outputKey}`);
        } else {
          console.error("[saveUserPhoto] SKIPPING — outputKey null after 2 attempts");
        }
      } catch (err) {
        console.error("[saveUserPhoto] FAILED:", err);
      }
    }
    console.log(`[generate] photoId final: ${photoId || "NULL"} for userId="${session?.user?.id || "NONE"}"`);

    // Ensure cache save completed before checking pass1Saved
    await pass1CachePromise;

    const response = NextResponse.json({
      image: finalImage,
      model: pass2 ? `${pass1.model} → ${pass2.model}` : `${pass1.model} (surfaces uniquement — passe 2 échouée)`,
      ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
      ...(photoId ? { photoId } : {}),
      ...(pass2Failed ? { pass2Failed: true } : {}),
    });

    // Log to DB BEFORE returning response (Replit autoscale kills worker after response)
    await logGeneration({
      ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
      withFurniture: true, inputWidth: width, inputHeight: height,
      modelUsed: pass2 ? `${pass1.model} → ${pass2.model}` : `${pass1.model} (pass2 failed x${pass2Attempts})`,
      pass1Model: pass1.model, pass2Model: pass2?.model ?? "FAILED",
      durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
      success: !pass2Failed,
      builtPromptPass1, builtPromptPass2,
      inputBase64: base64Image, pass1Base64, outputBase64,
      sessionId: sessionId ?? undefined,
      pass1CacheKey,
      roomType: isOutdoor ? undefined : (roomType ?? undefined),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      promptVersion: PROMPT_VERSION,
    }).catch((err) => console.error("DB log failed:", err));

    // Generation succeeded — credit was already decremented optimistically

    return response;
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur";

    // Refund credit on generation failure (optimistic decrement pattern)
    if (session?.user?.id) {
      addCredits(session.user.id, 1).catch((refundErr) => {
        console.error("CRITICAL: Credit refund failed for user", session.user.id, refundErr);
        // Log to DB for manual reconciliation
        getPool().query(
          `INSERT INTO generation_logs (ip, style_id, success, error_message)
           VALUES ($1, $2, false, $3)`,
          [ip, "refund_failed", `Refund failed for user ${session.user.id}: ${refundErr instanceof Error ? refundErr.message : "unknown"}`]
        ).catch(() => {});
      });
    }

    // Log failures too
    logGeneration({
      ip, styleId,
      surfacePrompt: "error", furniturePrompt: "error",
      withFurniture: true, success: false, errorMessage: message, promptVersion: PROMPT_VERSION,
    }).catch((err) => console.error("DB log failed:", err));

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
