/**
 * Generation pipeline — shared between /api/generate and /api/cron/process-queue.
 * Extracted from route.ts to avoid duplication (Sprint 23).
 * NO dependency on NextRequest/NextResponse/session/headers.
 */
import OpenAI from "openai";
import { applyRoomTypeOverrides, ROOM_TYPES, getStyleMaterialHint } from "@/lib/room-types";
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
 * v33 (audit Yann: propagation DEPTH_DISTRIBUTION + CONTACT_SHADOWS aux 7 builders dedies — bedroom, kitchen, bathroom, WC, entryway, laundry, cellar + preservation lumiere passe 2 tous builders),
 * v34 (audit Yann structurel: DEPTH_DISTRIBUTION imperatif, densite adaptative, furniturePrompts avec placement spatial),
 * v42 (density conditionals: kitchen 3-tier width scaling, dining room compact/large, office compact skip bookshelf — fix gen #112 overcrowded compact kitchen),
 * v43 (audit croise Yann+Lucas #111-117: P0 COLUMN_PRESERVATION active tous builders, P0 ANTI_FENETRE remonte position 2, P1 anti-warm shift renforce white balance, P1 Cosy marqueurs tactiles quantites, P1 PHOTO_GRAIN restaure ISO 200 + vignetting),
 * v45 (gpt-image-1.5 preservation-first: PASS1_PREAMBLE+PASS2_PREAMBLE en tete de TOUS les builders — les 8 passe 1 + 9 passe 2 + 2 outdoor. Preservation AVANT style pour forcer le mode edition. "CHANGE ONLY" en passe 1, "ADD" en passe 2. Suppression doublons CAMERA/LIGHT en fin de prompt — deja dans les constantes en tete.) */
export const PROMPT_VERSION = "v45";

// ─── Image generation model ─────────────────────────────────────────
// v36: configurable via env var. Default gpt-image-1 (v32 reverted gpt-image-1.5 for spatial regression).
// gpt-image-1.5 — décision fondateur absolue. On le fait marcher.
const IMAGE_MODEL = "gpt-image-1.5";

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
const DSLR_LINE = "DSLR full-frame wide-angle, deep DOF, sharp focus. Clean rendering, no HDR, no color grading, no text.";
const CEILING_PRESERVATION = "Ceiling: if demolition damage visible, apply smooth plaster coat then style finish. Preserve intentional elements (beams, rafters, arches) with original texture. Keep ceiling curvature exactly.";
const COLUMN_PRESERVATION = "Keep each column or pillar as a separate vertical element at its exact position.";
const LIGHT_PRESERVATION = "Preserve existing light direction and shadow positions. Keep the input's color temperature — warm materials reflect existing light without shifting overall tone. Keep whites neutral.";
const WALL_PRESERVATION = "Wall geometry stays identical: same angles, corners, depth. Only change color and texture. Keep raw stone or brick visible with limewash unless style explicitly requests opaque paint.";
const CAMERA_PRESERVATION = "Same camera angle, height, tilt, and field of view as input.";
const ANTI_FENETRE = "Same number of windows and doors as input, same positions, same sizes. Solid walls stay solid.";
const ANTI_INVENTION = "Only modify surfaces as described. No new architectural elements (arches, vaults, columns, niches, coffers) unless already in the input.";

// v44: gpt-image-1.5 preservation preambles — MUST be the FIRST tokens in every prompt.
// gpt-image-1.5 is more creative than gpt-image-1 and regenerates scenes unless preservation is stated FIRST.
const PASS1_PREAMBLE = "Edit this photo. Preserve the room geometry, camera angle, all windows and doors (same count, same positions), wall layout, ceiling shape, and room dimensions.";
const PASS2_PREAMBLE = "Edit this photo of a finished room. The wall colors, floor material, and ceiling finish are final — keep them unchanged. Same camera angle, same room geometry, same windows, same doors. No curtains, no drapes.";

// ── Pass 1: Surface finishing ────────────────────────────────────────
// v36: ACTION FIRST in all builders (v30 lesson — GPT-image-1 weights early tokens more)
export function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: v44 — preservation FIRST, then style
  if (roomTypeId === "kitchen") {
    const kitchenSurface = surfacePrompt.replace(/,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi, "");
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${kitchenSurface}.`,
      "Floor: ceramic or natural stone tiles (kitchen-appropriate). Subway tile or smooth splashback behind work area. Ceiling light per style description.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep radiators, water heater (cylindrical tank), switches, vents in exact position.",
      "Room stays completely empty — no furniture, no appliances.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: v44 — preservation FIRST, then style
  if (roomTypeId === "bathroom") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Floor-to-ceiling ceramic tiles in shower zone and vanity area. Water-resistant floor — ceramic or stone, matte non-slip. Recessed IP44 ceiling spotlights.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, cable exits — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in exact position.",
      "Room stays completely empty — no fixtures, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // WC: v44 — preservation FIRST, then style
  if (roomTypeId === "wc") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles or vinyl. Washable matte paint or tiles on lower walls.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays completely empty — no fixtures, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: v44 — preservation FIRST, then style
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Flooring per style description above. Ceiling light per style description. If ONE accent wall exists, preserve it — apply style color to other walls only.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, cable exits — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays completely empty — no furniture, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "laundry") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Waterproof floor — white or light grey ceramic tiles matte. Walls in washable matte white paint.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays completely empty — no appliances, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "cellar") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Concrete or stone floor as-is or with sealant. Clean matte white or light grey paint over masonry.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays completely empty — bare floors, bare walls.",
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "entryway") {
    return [
      PASS1_PREAMBLE,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Durable entrance floor — ceramic tiles, natural stone, or hard-wearing wood. Ceiling light per style description.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays completely empty — no furniture, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  // v45: preservation FIRST for gpt-image-1.5
  return [
    PASS1_PREAMBLE,
    ANTI_FENETRE,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
    `Change only the surface finishes: ${surfacePrompt}.`,
    "Apply the described finish to the existing floor and walls. Do not add structural elements that are absent from the input. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture), preserve it as-is — apply the style's wall color to the other walls only.",
    "Remove all visible construction elements: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, water heater (cylindrical tank), vents, thermostats, switches, boiler in exact position.",
    "Keep the room completely empty — no furniture, no rugs, no objects.",
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const EQUIPMENT_PRESERVATION = "Keep wall-mounted equipment visible (radiators, heaters, vents, switches).";
const CONTACT_SHADOWS = "Every piece must have visible contact shadows on the floor.";
const DEPTH_DISTRIBUTION_KITCHEN = "Distribute kitchen elements across the full depth of the room. Work zones along walls, island or table in the middle zone if space allows. Counter accessories spread across the full counter length — never cluster on one end.";
const DEPTH_DISTRIBUTION_BEDROOM = "Distribute bedroom furniture across the full depth of the room. Bed as primary anchor, dresser or wardrobe as background anchor in the back third. Avoid clustering all furniture against one wall.";

// v36: ACTION FIRST in all builders (v30 lesson), camera/structure at END
export function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: v45 — preservation FIRST for gpt-image-1.5, then add elements
  if (roomTypeId === "kitchen") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following kitchen elements: ${furniturePrompt}.`,
      "Built-in cabinetry and countertops against walls. Add island only if kitchen appears larger than 10m2. If compact, skip island. The ceiling light was already placed in pass 1 — keep it as-is.",
      "Scale kitchen to apparent width — fewer elements if compact, full set if spacious. Skip island under 10m2.",
      DEPTH_DISTRIBUTION_KITCHEN,
      CONTACT_SHADOWS,
      "Scale references: door = 204cm, sill = 90cm. Freestanding objects only.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "bathroom") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following bathroom fixtures and accessories: ${furniturePrompt}.`,
      "If a bathtub, shower, sink, or toilet is visible in the input, keep it at the same position, same size, same shape.",
      "This is a compact bathroom by default. ONE vanity, ONE basin — never a double vanity. Use 60cm vanity, skip stool and basket, no freestanding tub. Only use 80cm vanity or add freestanding tub if the room is clearly wider than 2.5m. Ignore shower and tub dimensions from the style if room is compact — use 80cm shower maximum.",
      "Do not duplicate any fixture already visible. If a shower exists, do not add another. If a tub exists, do not add a shower stall.",
      "The bathroom width and depth must match the input exactly — do not widen or deepen the room to fit more fixtures.",
      "Scale references: ceiling ~250cm, tile size, plumbing proportions. 60cm min passage width.",
      CONTACT_SHADOWS,
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      DSLR_LINE,
    ].join(" ");
  }

  // WC: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "wc") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following WC fixtures: ${furniturePrompt}.`,
      "Very small space — minimal items. Wall-hung or floor toilet, compact hand basin with mirror above.",
      CONTACT_SHADOWS,
      "Scale reference: door = 204cm.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following bedroom furniture: ${furniturePrompt}.`,
      "Freestanding only — bed, nightstands, rug, wardrobe/dresser as background anchor. All objects resting on the floor. Furniture must not touch walls.",
      "Calm atmosphere — respect furniture density implied by the style. If minimalist, leave large empty floor areas.",
      DEPTH_DISTRIBUTION_BEDROOM,
      CONTACT_SHADOWS,
      "Scale bed to room: if compact, 140cm bed instead of 160cm, skip bench. Door = 204cm reference.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "entryway") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following entryway furniture: ${furniturePrompt}.`,
      "Small space — do not overcrowd. Console max 60% of wall width. Freestanding only: console, mirror propped on console, coat rack, bench, runner rug. All objects resting on the floor.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "laundry") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following laundry equipment: ${furniturePrompt}.`,
      "Functional layout — washing machine, cabinet, drying rack, basket. No decorative objects. If compact (<4m2), skip folding table and drying rack.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "cellar") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following cellar furnishing: ${furniturePrompt}.`,
      "Functional storage — shelving unit, boxes, utility light. Wine rack if space allows. If compact, single shelf, no wine rack.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      DSLR_LINE,
    ].join(" ");
  }

  // Dining room: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "dining_room") {
    return [
      PASS2_PREAMBLE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      `ADD the following furniture and decoration: ${furniturePrompt}.`,
      "Center dining table with chairs. If deep room, add sideboard as background anchor. If compact, round table 120cm + 4 chairs instead of rectangular 180cm + 6.",
      "Freestanding only — no wall art, no shelving. Furniture must not touch walls.",
      CONTACT_SHADOWS,
      "Door = 204cm, sill = 90cm references.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  // v45: preservation FIRST for gpt-image-1.5
  return [
    PASS2_PREAMBLE,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    COLUMN_PRESERVATION,
    EQUIPMENT_PRESERVATION,
    `ADD the following furniture and decoration: ${furniturePrompt}.`,
    "Freestanding objects only, resting on the floor. Furniture must not touch walls.",
    "Distribute furniture across full depth and width of the room. Primary seating group in the foreground third, at least one secondary anchor (side table, accent chair, floor lamp) in the back third. Avoid clustering everything in one zone.",
    "Adapt density to room size: if the visible floor area appears compact, keep 5-6 key pieces only. If the room is very large or deep, add a second furniture grouping in the back zone.",
    CONTACT_SHADOWS,
    "Scale references: door = 204cm, handle = 100cm, sill = 90cm. Scale furniture to room volume — if compact (<4m wide), use smaller pieces. Scale up if ceiling >3m.",
    "No duplicate items unless style calls for a pair.",
    "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
    "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
    DSLR_LINE,
  ].join(" ");
}

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
export function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    "Edit this exact outdoor photo. Preserve exactly: the space geometry, camera angle, every wall and fence position, every opening, ground level changes, sky.",
    "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky.",
    `CHANGE ONLY the ground surface finish: ${surfacePrompt}.`,
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
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering.",
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
    "Edit this outdoor photo. Keep all ground surfaces, guard rails, walls, facades, and sky unchanged. Same camera angle. Open-air space — no ceiling.",
    `Add outdoor furniture and decoration: ${furniturePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture across the full depth and width of the space. If large, create a primary group and a secondary accent further back or to the side.",
    "Outdoor plants only — no houseplants (no monstera, no fiddle leaf, no pothos). Scale plants to space: balcony max 120cm, garden max 200cm.",
    "All lighting fixtures off in daylight. Textiles must be outdoor-rated. If space under 10m2, use bistro-scale furniture.",
    "Furniture must have contact shadows on the ground. Keep existing lighting direction.",
    "DSLR wide-angle, deep DOF, sharp focus. Photo-realistic outdoor. No text or watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── Detect base64 image MIME type from magic bytes ─────────────────
export function detectMimeType(base64: string): string {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
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
              image_url: `data:${detectMimeType(imageBase64)};base64,${imageBase64}`,
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
              image_url: `data:${detectMimeType(imageBase64)};base64,${imageBase64}`,
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

// generateIterationPass lives in route.ts (has safety retry logic).
// Do NOT duplicate here — see QA audit generation-robustness-audit.md.

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
    inputBase64, surfacePrompt, furniturePrompt, styleId,
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

    // CRITICAL FIX: For dedicated builders, do NOT inject the full style furniturePrompt
    // (which contains living room items like sofa, coffee table, rug).
    // Instead use the room-specific furniture override + a brief style hint.
    if (hasDedicatedBuilder && roomType) {
      const rt = ROOM_TYPES[roomType];
      trimmedFurniture = rt?.roomFurnitureOverride
        ? `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`
        : furniturePrompt.trim();
    } else {
      trimmedFurniture = effectiveFurniturePrompt;
    }
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
