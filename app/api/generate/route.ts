export const dynamic = "force-dynamic";

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
import { getSessionRobust } from "@/lib/session";
import { decrementCredit, addCredits, getMaxIterations } from "@/lib/credits";
import { logGeneration, savePass1Cache, getPass1Cache, getPool, saveIterationBase, getIterationBase, saveImage, withStorageRetry } from "@/lib/db";
import { preprocessIterationComment, classifyIterationIntent } from "@/lib/custom-prompt";
import {
  buildIterationFurnitureResponsesPrompt,
  PASS1_TTL_MS,
} from "@/lib/iteration-prompt";
import { applyRoomTypeOverrides, ROOM_TYPES, getStyleMaterialHint } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";
import { saveUserPhoto } from "@/lib/user-photos";
import {
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildAdjustResponsesPrompt,
  buildAdjustOutdoorResponsesPrompt,
} from "@/lib/iteration-prompt";
import { enqueueGeneration, shouldQueue } from "@/lib/generation-queue";

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
 * v34 (audit Yann structurel: DEPTH_DISTRIBUTION imperatif sans conditionnels, densite adaptative, furniturePrompts 12 styles avec FOREGROUND/LATERAL/BACKGROUND/ACCENTS, pre-processor custom enrichi few-shot + filtrage assoupli),
 * v37 (audit croise Yann+Lucas #91-95: P0 anti-fenetre hallucinee comptage explicite, P0 equipements muraux water heater nomme, P1 anti-warm shift materiaux chauds, P2 texture poutres conditionnelle, P2 camera position LOCKED, P1 pierre brute limewash),
 * v42 (density conditionals: kitchen 3-tier width scaling, dining room compact/large, office compact skip bookshelf — fix gen #112 overcrowded compact kitchen),
 * v43 (audit croise Yann+Lucas #111-117: P0 COLUMN_PRESERVATION active tous builders, P0 ANTI_FENETRE remonte position 2, P1 anti-warm shift renforce white balance, P1 Cosy marqueurs tactiles quantites, P1 PHOTO_GRAIN restaure ISO 200 + vignetting) */
export const PROMPT_VERSION = "v43";

// ─── Image generation model ─────────────────────────────────────────
// v36: configurable via env var. Default gpt-image-1 (v32 reverted gpt-image-1.5 for spatial regression).
// Set IMAGE_MODEL=gpt-image-1.5 in env to switch back if regression is resolved.
const IMAGE_MODEL = (process.env.IMAGE_MODEL as string) || "gpt-image-1";

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
const DSLR_LINE = "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.";
// PHOTO_GRAIN supprimé — décision fondateur : rendu lisse voulu, pas de grain/vignetting
const CEILING_PRESERVATION = "CEILING RULE: If the ceiling shows ANY demolition damage (hanging plaster, exposed lath, holes, torn surfaces, peeling paint, cables, structural chaos), treat it as a BLANK CANVAS — cover EVERYTHING with smooth fresh plaster coat followed by the style ceiling finish. Do NOT preserve demolition damage as geometry. Only preserve INTENTIONAL structural elements (concrete beams, wooden rafters, brick arches, IPN metal beams) — keep their exact surface texture and patina. Smooth plaster BETWEEN beams only. Preserve ceiling CURVATURE exactly — vaults, arches, barrel ceilings, and curved surfaces must keep their exact profile. Do NOT flatten any curved ceiling into a flat plane.";
const COLUMN_PRESERVATION = "Each structural column or pillar must remain as a separate vertical element at its exact position. Do NOT merge columns into arches or decorative frames.";
const LIGHT_PRESERVATION = "Preserve existing light direction, shadow positions, and relative intensity. Maintain input's color temperature — warm-toned materials (brass, wood, copper) reflect existing light, they do NOT shift the overall lighting warm. Do not artificially brighten dark areas. Do not add any warm tint, amber cast, or golden color grading. Match the exact white balance of the input photo. The output color temperature must match the input exactly — measure by the whites (walls, ceiling, window frames). Raw concrete, bare masonry, and grey plaster must stay cool-grey — do not shift to beige, sand, or warm stone. Warm-toned MATERIALS (wood, brass, leather) have warm LOCAL color but must NOT shift the GLOBAL white balance.";
const WALL_PRESERVATION = "Wall geometry must stay identical: same angles, same corners, same depth. Wall finishing means changing color and texture only — never add or remove volume, never round corners, never change wall thickness. Do not add baseboards or moldings unless already present in the input. If walls show raw stone, exposed brick, or masonry, apply a limewash or transparent finish over the existing texture — do NOT cover with opaque paint unless the surfacePrompt explicitly requests it.";
const CAMERA_PRESERVATION = "Same camera angle, lens distortion, vanishing points, field of view, orientation. Camera position is LOCKED: same height, same tilt angle, same horizontal rotation as input.";
const ANTI_FENETRE = "EXACTLY the same number of windows and doors as the input — same positions, same sizes. Walls without windows must remain solid.";
const ANTI_INVENTION = "Do NOT invent architectural elements absent from the input: no arches, no vaults, no glass partitions, no columns, no niches, no decorative ceiling coffers. If the ceiling is damaged or stripped, apply a simple flat white finish — do not reconstruct ornamental geometry. If a wall is partially demolished, keep it as-is — do not complete or extend it.";

// ── Pass 1: Surface finishing ────────────────────────────────────────
// v36: ACTION FIRST in all builders (v30 lesson — GPT-image-1 weights early tokens more)
function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: action first — OVERRIDE floor from surfacePrompt (kitchens need tiles, not wood)
  if (roomTypeId === "kitchen") {
    // Strip any floor directive from surfacePrompt to avoid contradiction with kitchen tile override
    const kitchenSurface = surfacePrompt.replace(/,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi, "");
    return [
      `Edit this photo of a kitchen. Apply this surface finish: ${kitchenSurface}.`,
      ANTI_FENETRE,
      "FLOOR OVERRIDE: ceramic or natural stone floor tiles suited for a kitchen — NOT wood, NOT parquet. Subway tile or smooth splashback behind work area. Ceiling light per style description.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish. Keep radiators, water heater (cylindrical tank), switches, vents in exact position.",
      "Room stays COMPLETELY EMPTY — no furniture, no appliances.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: action first
  if (roomTypeId === "bathroom") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Floor-to-ceiling ceramic tiles in shower zone and vanity area. Water-resistant floor — ceramic or stone, matte non-slip. Recessed IP44 ceiling spotlights.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, cable exits — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in exact position.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // WC: action first
  if (roomTypeId === "wc") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Waterproof floor — small ceramic tiles or vinyl. Washable matte paint or tiles on lower walls.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: action first — floor tone decided by surfacePrompt (not hardcoded warm)
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Flooring per style description above. Ceiling light per style description. If ONE accent wall exists, preserve it — apply style color to other walls only.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, cable exits — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: action first
  if (roomTypeId === "laundry") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Waterproof floor — white or light grey ceramic tiles matte. Walls in washable matte white paint.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no appliances, no objects.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: action first
  if (roomTypeId === "cellar") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Concrete or stone floor as-is or with sealant. Clean matte white or light grey paint over masonry.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays COMPLETELY EMPTY — bare floors, bare walls.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: action first
  if (roomTypeId === "entryway") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      ANTI_FENETRE,
      "Durable entrance floor — ceramic tiles, natural stone, or hard-wearing wood. Ceiling light per style description.",
      "Remove construction leftovers: outlets, cables, junction boxes — blend into wall finish. Keep radiators, heaters, water heater (cylindrical tank), vents, switches in position.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects.",
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  // v36: Action FIRST (v30 lesson), camera/light at END
  return [
    `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
    ANTI_FENETRE,
    "Apply the described finish to the existing floor and walls. Do not add structural elements that are absent from the input. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture), preserve it as-is — apply the style's wall color to the other walls only.",
    "Remove all visible construction elements: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits — blend into wall finish.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, water heater (cylindrical tank), vents, thermostats, switches, boiler in exact position.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no objects.",
    CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
    `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const EQUIPMENT_PRESERVATION = "Keep ALL wall-mounted fixed equipment visible: water heater (cylindrical tank), radiator, convector, thermostat, ventilation grille, electrical panel, boiler — do not remove, hide, or cover them with furniture. Do not place furniture in front of radiators. No curtains.";
const CONTACT_SHADOWS = "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room.";
const DEPTH_DISTRIBUTION_KITCHEN = "Distribute kitchen elements across the FULL DEPTH of the room. Work zones along walls, island or table in the middle zone if space allows. Counter accessories spread across the full counter length — never cluster on one end.";
const DEPTH_DISTRIBUTION_BEDROOM = "Distribute bedroom furniture across the FULL DEPTH of the room. Bed as primary anchor, dresser or wardrobe as background anchor in the back third. Never cluster all furniture against one wall.";

// v36: ACTION FIRST in all builders (v30 lesson), camera/structure at END
function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: action first — ceiling light already set in pass 1, skip pendant here
  if (roomTypeId === "kitchen") {
    return [
      `Add the following kitchen elements to this photo of a finished room: ${furniturePrompt}.`,
      "Built-in cabinetry and countertops against walls. Add island ONLY if kitchen appears >10m2. If compact, skip island. Do NOT add a ceiling pendant — the ceiling light was already placed in pass 1.",
      DEPTH_DISTRIBUTION_KITCHEN,
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      "Scale references: door = 204cm, sill = 90cm. Freestanding objects only.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint or yellow cast.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Bathroom: action first
  if (roomTypeId === "bathroom") {
    return [
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "If a bathtub, shower, sink, or toilet is visible in the input, it must appear in the output at the SAME position, SAME size, SAME shape. Treat existing fixtures as LOCKED elements.",
      "This is a compact bathroom by default. ONE vanity, ONE basin — never a double vanity. Use 60cm vanity, skip stool and basket, no freestanding tub. Only use 80cm vanity or add freestanding tub if the room is clearly wider than 2.5m. Ignore shower and tub dimensions from the style if room is compact — use 80cm shower maximum.",
      "Do not duplicate any fixture already visible. If a shower exists, do not add another. If a tub exists, do not add a shower stall.",
      "The bathroom width and depth must match the input exactly — do not widen or deepen the room to fit more fixtures.",
      "Scale references: ceiling ~250cm, tile size, plumbing proportions. 60cm min passage width.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint or yellow cast.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // WC: action first
  if (roomTypeId === "wc") {
    return [
      `Add the following WC fixtures to this photo of a finished room: ${furniturePrompt}.`,
      "Very small space — minimal items. Wall-hung or floor toilet, compact hand basin with mirror above.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling visually identical to input — same geometry. Scale reference: door = 204cm. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Bedroom: action first + restore "Calm atmosphere" from v30
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Add the following bedroom furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Freestanding only — bed, nightstands, rug, wardrobe/dresser as background anchor. All objects resting on the floor. Furniture must not touch walls.",
      "Calm atmosphere — respect furniture density implied by the style. If minimalist, leave large empty floor areas.",
      DEPTH_DISTRIBUTION_BEDROOM,
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      "Scale bed to room: if compact, 140cm bed instead of 160cm, skip bench. Door = 204cm reference.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same number of openings. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Entryway: action first
  if (roomTypeId === "entryway") {
    return [
      `Add the following entryway furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Small space — do not overcrowd. Console max 60% of wall width. Freestanding only: console, mirror propped on console, coat rack, bench, runner rug. All objects resting on the floor.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, doors visually identical to input — same geometry. Door = 204cm reference. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Laundry: action first
  if (roomTypeId === "laundry") {
    return [
      `Add the following laundry equipment to this photo of a finished room: ${furniturePrompt}.`,
      "Functional layout — washing machine, cabinet, drying rack, basket. No decorative objects. If compact (<4m2), skip folding table and drying rack.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling visually identical to input — same geometry. Door = 204cm reference. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Cellar: action first
  if (roomTypeId === "cellar") {
    return [
      `Add the following cellar furnishing to this photo of a finished room: ${furniturePrompt}.`,
      "Functional storage — shelving unit, boxes, utility light. Wine rack if space allows. If compact, single shelf, no wine rack.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling visually identical to input — same geometry. Door = 204cm reference. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // Dining room: action first
  if (roomTypeId === "dining_room") {
    return [
      `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
      "Center dining table with chairs. If deep room, add sideboard as background anchor. If compact, round table 120cm + 4 chairs instead of rectangular 180cm + 6.",
      "Freestanding only — no wall art, no shelving. Furniture must not touch walls.",
      CONTACT_SHADOWS,
      EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
      "Door = 204cm, sill = 90cm references.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo.",
      `${CAMERA_PRESERVATION} Room structure LOCKED: walls, floor, ceiling, windows visually identical to input — same geometry, same openings. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint.`,
      "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  // v36: Action FIRST (v30 lesson), camera/structure at END
  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Freestanding objects only, resting on the floor. Furniture must not touch walls.",
    "Distribute furniture across FULL DEPTH and WIDTH of the room. Primary seating group in the foreground third, at least one secondary anchor (side table, accent chair, floor lamp) in the back third. Never cluster everything in one zone.",
    "Adapt density to room size: if the visible floor area appears compact, keep 5-6 key pieces only. If the room is very large or deep, add a second furniture grouping in the back zone.",
    CONTACT_SHADOWS,
    EQUIPMENT_PRESERVATION, COLUMN_PRESERVATION,
    "Scale references: door = 204cm, handle = 100cm, sill = 90cm. Scale furniture to room volume — if compact (<4m wide), use smaller pieces. Scale up if ceiling >3m.",
    "No duplicate items unless style calls for a pair.",
    "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
    "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
    `${CAMERA_PRESERVATION} Room structure is LOCKED: walls, floor, ceiling, windows, doors visually identical to input — same angles, same geometry, same number of openings. Preserve exact count and position of all openings. Preserve existing light direction and color temperature. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint or yellow cast.`,
    "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Do NOT add HDR processing, color grading, or cinematic tone mapping. No text or watermarks.",
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
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering.",
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
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "Ground surfaces are LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    `Add outdoor furniture and decoration to this photo of a finished outdoor space: ${furniturePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back.",
    "Use visible architectural cues as scale references — a standard guard rail is 100cm tall, a French door is 215cm tall, a floor tile 60x60cm. All furniture must be proportional to these references.",
    "All lighting fixtures OFF in daylight — unlit lanterns, dark string light bulbs, zero flames. Textiles must be outdoor-rated weather-resistant.",
    "Scale plants to space: balcony/small terrace max 120cm, garden max 200cm. If space under 10m2, use bistro-scale furniture.",
    "Keep glass doors and full-height windows unobstructed. If overhead structure exists (pergola, beams), consider one hanging plant or lantern.",
    "Every piece must cast realistic shadows consistent with the existing natural light direction.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
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
  const session = isInternalDossierCall ? null : await getSessionRobust(request);
  console.log(`[generate] session: userId="${session?.user?.id || "NONE"}" isInternal=${isInternalDossierCall}`);

  // Credit check is deferred after body parsing — see below (after pass1Key detection)
  // Anonymous users pass through — protected by IP rate limit (10 req/min)

  let styleId = "unknown";

  // Hoisted for queue fallback in catch block
  let _image: string | undefined;
  let _surfacePrompt: string | undefined;
  let _furniturePrompt: string | undefined;
  let _width: number | undefined;
  let _height: number | undefined;
  let _roomType: string | null = null;
  let _isOutdoor = false;
  let _outdoorSubtype: string | null = null;
  let _withFurniture = true;
  let _pass1Key: string | undefined;

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
      // Split-mode: progressive display (pass1 shown while pass2 runs)
      splitMode = false,
      pass2Only = false,
      userId: bodyUserId,
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
      splitMode?: boolean;
      pass2Only?: boolean;
      userId?: string;
    };

    styleId = bodyStyleId;

    console.log(`[generate] splitMode=${splitMode}, pass2Only=${pass2Only}, withFurniture=${withFurniture}, pass1Key=${pass1Key ? "yes" : "no"}`);

    // Select style variant for furniture diversity (indoor named styles only)
    let resolvedFurniturePrompt = furniturePrompt;
    if (styleId && styleId !== "custom" && !isOutdoor && furniturePrompt && image) {
      try {
        const { selectVariant } = await import("@/lib/style-variants");
        const crypto = await import("crypto");
        const imageData = image.slice(image.indexOf(",") + 1);
        const imageHash = crypto.createHash("sha256").update(imageData).digest("hex").slice(0, 16);
        const variant = selectVariant(imageHash, styleId);
        if (variant.furniturePrompt) {
          resolvedFurniturePrompt = variant.furniturePrompt;
        }
      } catch {
        // Fallback to original furniturePrompt
      }
    }

    // Assign to hoisted vars for queue fallback in catch
    _image = image; _surfacePrompt = surfacePrompt; _furniturePrompt = resolvedFurniturePrompt;
    _width = width; _height = height; _roomType = roomType; _isOutdoor = isOutdoor;
    _outdoorSubtype = outdoorSubtype; _withFurniture = withFurniture; _pass1Key = pass1Key;

    // Credit check — AFTER body parsing so we know if it's an iteration or pass2Only
    // Iterations do NOT consume a credit (spec F1). Only new generations do.
    // pass2Only does NOT consume a credit (already debited in the splitMode pass1 call).
    const isIteration = !!pass1Key && !pass2Only;
    if (!isInternalDossierCall && session?.user?.id && !isIteration && !pass2Only) {
      const decremented = await decrementCredit(session.user.id);
      if (!decremented) {
        return NextResponse.json(
          { error: "Plus de visuels disponibles. Rechargez pour continuer." },
          { status: 402 }
        );
      }
    }

    // ── F1 Iteration flow: adjust (edit furnished) or restyle (re-pass 2) ──
    // Skip iteration flow when pass2Only — that's handled by the split-mode pass2Only block below.
    if (pass1Key && !pass2Only) {
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

      // Check max iterations — simplified: if user has a valid pass1Key, they paid.
      // The pass1 cache IS the proof of payment. No session check needed for MVP.
      // Default to 3 iterations (Pro level) — the cache existing = user generated = user paid.
      const MAX_ITER_DEFAULT = 3;
      const iterUserId = session?.user?.id ?? bodyUserId ?? cached.meta.userId ?? null;
      const userMaxIter = iterUserId ? await getMaxIterations(iterUserId) : MAX_ITER_DEFAULT;
      console.log(`[iteration] userId="${iterUserId || "NONE"}", maxIter=${userMaxIter}, previousMods=${previousModifications.length}`);
      if (previousModifications.length >= userMaxIter) {
        return NextResponse.json(
          { error: `Nombre maximum d'itérations atteint (${userMaxIter}).` },
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

      // Iteration succeeded — no credit consumed (iterations are free)

      return response;
    }

    // ── Split-mode pass 2 only: resume from cached pass 1 ─────────────
    if (pass2Only && pass1Key) {
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Verify this is a pending pass2 (single-use anti-replay)
      if (!cached.meta.pendingPass2) {
        return NextResponse.json(
          { error: "Cette passe 2 a déjà été exécutée." },
          { status: 409 }
        );
      }

      // Clear the pendingPass2 flag (single-use) by re-saving meta without it
      const updatedMeta = { ...cached.meta, pendingPass2: false };
      const metaKey = pass1Key.replace(".jpg", "_meta.json");
      const metaBuffer = Buffer.from(JSON.stringify(updatedMeta), "utf-8");
      await withStorageRetry(
        (client) => client.uploadFromBytes(metaKey, metaBuffer),
        `clearPendingPass2(${metaKey})`
      ).catch((err) => console.error("Failed to clear pendingPass2 flag:", err));

      const p2OutputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const p2RoomType = cached.meta.isOutdoor ? null : (cached.meta.roomType ?? null);

      // Rebuild outdoor param if needed
      let p2OutdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;
      if (cached.meta.isOutdoor) {
        const sub = cached.meta.outdoorSubtype ? OUTDOOR_SUBTYPES[cached.meta.outdoorSubtype] : null;
        p2OutdoorParam = {
          isOutdoor: true,
          subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
          subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
        };
      }

      const p2t0 = Date.now();
      console.log(`[pass2Only] Starting pass 2 from cache key: ${pass1Key}`);

      let pass2Result: { image: string; model: string } | null = null;
      let pass2Err: string | null = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          pass2Result = await generatePass(
            cached.imageBase64,
            cached.meta.surfacePrompt,
            cached.meta.furniturePrompt,
            2,
            p2OutputSize,
            p2RoomType,
            p2OutdoorParam
          );
          break;
        } catch (err) {
          pass2Err = err instanceof Error ? err.message : String(err);
          console.error(`[pass2Only] attempt ${attempt}/2 failed: ${pass2Err}`);
        }
      }

      const p2t1 = Date.now();

      if (!pass2Result) {
        // Pass 2 failed — refund credit
        if (session?.user?.id) {
          addCredits(session.user.id, 1).catch((refundErr) => {
            console.error("CRITICAL: Credit refund (pass2Only failed) failed:", refundErr);
          });
          console.log(`[pass2Only] Credit refunded for user ${session.user.id}`);
        }
        return NextResponse.json(
          { error: `L'ameublement a échoué. ${pass2Err ?? ""}`.trim(), pass2Failed: true },
          { status: 500 }
        );
      }

      const p2OutputBase64 = pass2Result.image.replace(/^data:image\/[\w+]+;base64,/, "");

      // Save iteration base for future adjustments
      if (sessionId) {
        saveIterationBase(sessionId, p2OutputBase64).catch((err) =>
          console.error("saveIterationBase (pass2Only) failed:", err)
        );
      }

      // Save to user gallery BEFORE response (Replit autoscale kills worker after response)
      let photoId: string | null = null;
      if (session?.user?.id) {
        try {
          const ts = Date.now();
          let outputKey = await saveImage(p2OutputBase64, `user_photo_${ts}_output`).catch(() => null);
          if (!outputKey) {
            await new Promise((r) => setTimeout(r, 1000));
            outputKey = await saveImage(p2OutputBase64, `user_photo_${ts}_output_r`).catch(() => null);
          }
          if (outputKey) {
            const pass1ImageKey = await saveImage(cached.imageBase64, `user_photo_${ts}_pass1`).catch(() => null);
            photoId = await saveUserPhoto({
              userId: session.user.id,
              inputImageKey: null,
              outputImageKey: outputKey,
              pass1ImageKey: pass1ImageKey,
              styleId: cached.meta.styleId || null,
              roomType: cached.meta.isOutdoor ? null : (cached.meta.roomType || null),
              roomLabel: null,
              isOutdoor: cached.meta.isOutdoor || false,
              propertyId: null,
            });
          }
        } catch (err) {
          console.error("[saveUserPhoto pass2Only] FAILED:", err);
        }
      }

      // Build prompt for logging
      const p2BuiltPrompt = cached.meta.isOutdoor
        ? buildOutdoorFurnitureResponsesPrompt(cached.meta.furniturePrompt, p2OutdoorParam?.subtypeFurnitureOverride ?? "")
        : buildFurnitureResponsesPrompt(cached.meta.furniturePrompt, p2RoomType);

      await logGeneration({
        ip, styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt, furniturePrompt: cached.meta.furniturePrompt,
        withFurniture: true, inputWidth: cached.meta.width, inputHeight: cached.meta.height,
        modelUsed: `pass2Only: ${pass2Result.model}`,
        pass2Model: pass2Result.model,
        durationMs: p2t1 - p2t0, pass2DurationMs: p2t1 - p2t0,
        success: true,
        builtPromptPass2: p2BuiltPrompt,
        outputBase64: p2OutputBase64,
        pass1Base64: cached.imageBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.isOutdoor ? undefined : (cached.meta.roomType ?? undefined),
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.isOutdoor ? (cached.meta.outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
      }).catch((err) => console.error("DB log (pass2Only) failed:", err));

      return NextResponse.json({
        image: pass2Result.image,
        model: pass2Result.model,
        pass1_key: pass1Key,
        ...(photoId ? { photoId } : {}),
      });
    }

    // ── Standard generation flow (pass 1 + pass 2) ────────────────────
    if (!image || !surfacePrompt || !resolvedFurniturePrompt) {
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
        applyOutdoorSubtypeOverrides(surfacePrompt.trim(), resolvedFurniturePrompt.trim(), outdoorSubtype ?? null);
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
        applyRoomTypeOverrides(surfacePrompt.trim(), resolvedFurniturePrompt.trim(), roomType ?? null);

      // If dedicated builder exists: use raw style surfacePrompt (builder handles room specifics)
      // Otherwise: use the concatenated effectiveSurfacePrompt (room override appended)
      trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;

      // CRITICAL FIX: For dedicated builders, do NOT inject the full style furniturePrompt
      // (which contains living room items like sofa, coffee table, rug).
      // Instead use the room-specific furniture override + a brief style hint.
      // The full MERGE is only needed for rooms without dedicated builders (living_room, office, etc.)
      if (hasDedicatedBuilder && roomType) {
        const rt = ROOM_TYPES[roomType];
        trimmedFurniture = rt?.roomFurnitureOverride
          ? `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`
          : resolvedFurniturePrompt.trim();
      } else {
        trimmedFurniture = effectiveFurniturePrompt;
      }
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
      // Store userId for iteration fallback (getServerSession can return null on Replit)
      userId: session?.user?.id ?? undefined,
      // Split-mode: store pass2 info so pass2Only call can resume
      ...(splitMode && withFurniture ? {
        pendingPass2: true,
        outputSize: outputSize.openai,
        withFurniture: true,
      } : {}),
    })
      .then(() => { pass1Saved = true; })
      .catch((err) => console.error("Pass1 cache save failed:", err));

    // ── Split-mode: return pass 1 immediately, client will call pass2Only later ──
    if (splitMode && withFurniture) {
      await pass1CachePromise;

      // Log pass 1 as partial success
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: true, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (splitMode pass1)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, pass1Base64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
      }).catch((err) => console.error("DB log (splitMode pass1) failed:", err));

      // Always return pass1_key in split mode — if cache failed, pass2Only will fail
      // gracefully and the user still sees the pass1 result immediately
      if (!pass1Saved) {
        console.error(`[splitMode] pass1 cache save FAILED — pass2Only will not work for key ${pass1CacheKey}`);
      }
      return NextResponse.json({
        image: pass1.image,
        model: pass1.model,
        pass1_key: pass1CacheKey,
        pendingPass2: true,
      });
    }

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
      // Only refund if a credit was actually decremented (not for iterations)
      if (session?.user?.id && !_pass1Key) {
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

    // ── Async queue fallback: if the error is transient and user is logged in,
    // enqueue for background retry instead of refunding immediately.
    if (session?.user?.id && shouldQueue(error) && _image && _surfacePrompt && _furniturePrompt) {
      try {
        // Save input image to Object Storage for the queue worker
        const base64ForQueue = _image.replace(/^data:image\/[\w+]+;base64,/, "");
        const inputKey = await saveImage(base64ForQueue, `queue_${Date.now()}_${session.user.id}_input`);

        const queueId = await enqueueGeneration({
          userId: session.user.id,
          inputImageKey: inputKey,
          surfacePrompt: _surfacePrompt.trim(),
          furniturePrompt: _furniturePrompt.trim(),
          styleId: styleId ?? null,
          roomType: _isOutdoor ? null : (_roomType ?? null),
          isOutdoor: _isOutdoor || false,
          outdoorSubtype: _isOutdoor ? (_outdoorSubtype ?? null) : null,
          inputWidth: _width ?? 1024,
          inputHeight: _height ?? 1024,
          withFurniture: _withFurniture !== false,
        });

        console.log(`[generate] Queued job ${queueId} for user ${session.user.id} (original error: ${message})`);

        // Log the queue event
        logGeneration({
          ip, styleId,
          surfacePrompt: _surfacePrompt.trim(), furniturePrompt: _furniturePrompt.trim(),
          withFurniture: true, success: false, errorMessage: `QUEUED: ${message}`, promptVersion: PROMPT_VERSION,
        }).catch((err) => console.error("DB log failed:", err));

        // Return 202 Accepted — credit stays reserved (not refunded yet)
        return NextResponse.json({
          queued: true,
          queueId,
          message: "Génération lancée en arrière-plan. Vous serez notifié dès que c'est prêt.",
        }, { status: 202 });
      } catch (queueError) {
        console.error("[generate] Queue fallback failed:", queueError);
        // Fall through to standard error handling below
      }
    }

    // Standard error handling: refund credit + return error
    // Only refund if a credit was actually decremented (not for iterations)
    if (session?.user?.id && !_pass1Key) {
      addCredits(session.user.id, 1).catch((refundErr) => {
        console.error("CRITICAL: Credit refund failed for user", session.user.id, refundErr);
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
