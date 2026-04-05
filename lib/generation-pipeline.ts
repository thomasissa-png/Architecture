/**
 * Generation pipeline — shared between /api/generate and /api/cron/process-queue.
 * Extracted from route.ts to avoid duplication (Sprint 23).
 * NO dependency on NextRequest/NextResponse/session/headers.
 */
import OpenAI from "openai";
import sharp from "sharp";
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

// ─── Pre-pass vision: extract room geometry inventory ───────────────
// Uses GPT-4.1-mini in vision mode to describe the room's geometry
// before generation. The inventory is injected into pass 1 and pass 2
// prompts so the model knows what to preserve.
// Fail-open: if this fails or times out, generation continues normally.
const VISION_TIMEOUT_MS = 5_000;

export async function extractRoomInventory(imageBase64: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const mimeType = detectMimeType(imageBase64);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4.1-mini",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content:
              "Describe this room's geometry in one concise paragraph. Count: windows (number, positions), doors (number, positions), ceiling type (flat/vaulted/beamed), visible equipment (radiators, heaters, water heater, electrical panel), floor material, approximate room shape. Also describe the framing: which walls or elements are cropped at the edges of the photo, and whether the lens appears wide-angle or standard. Be factual, no opinions.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      },
      { signal: controller.signal },
    );

    clearTimeout(timer);

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    if (text) {
      console.log(`[extractRoomInventory] OK (${text.length} chars): ${text.substring(0, 120)}...`);
    }
    return text;
  } catch (err) {
    // Fail-open: log and return empty string — generation continues without inventory
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[extractRoomInventory] Failed (fail-open): ${msg}`);
    return "";
  }
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
 * v45 (gpt-image-1.5 preservation-first: PASS1_PREAMBLE+PASS2_PREAMBLE en tete de TOUS les builders — les 8 passe 1 + 9 passe 2 + 2 outdoor. Preservation AVANT style pour forcer le mode edition. "CHANGE ONLY" en passe 1, "ADD" en passe 2. Suppression doublons CAMERA/LIGHT en fin de prompt — deja dans les constantes en tete.),
 * v52 (audit v51 Yann 7.2 Lucas 7.5: P0 ANTI_FENETRE couvre mezzanines/niveaux superieurs, P1 PASS2_PREAMBLE anti-elargissement pieces etroites + bathroom builder renforce, P1 EQUIPMENT_PRESERVATION couvre convecteurs au sol et seche-serviettes) */
export const PROMPT_VERSION = "v52";

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
  // Match the input ratio as closely as possible.
  // OpenAI only supports 3 sizes: 1024x1024, 1536x1024, 1024x1536.
  // A landscape input (4:3, 3:2, 16:9) must output landscape, not square.
  if (ratio > 1.2) return { openai: "1536x1024", w: 1536, h: 1024 }; // landscape
  if (ratio < 0.83) return { openai: "1024x1536", w: 1024, h: 1536 }; // portrait
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
const DSLR_LINE = "DSLR full-frame, deep DOF, sharp focus. Same focal length as the input photo. Clean rendering, no HDR, no color grading, no text.";
const CEILING_PRESERVATION = "Ceiling: if demolition damage visible, apply smooth plaster coat then style finish. Preserve intentional elements (beams, rafters, arches, slab undersides) with original texture — keep raw concrete formwork marks, aged wood grain, and metal patina intact. Paint over the texture, not a smooth coat. Keep ceiling curvature exactly.";
const COLUMN_PRESERVATION = "Keep each column or pillar as a separate vertical element at its exact position.";
const LIGHT_PRESERVATION = "Preserve existing light direction and shadow positions. Keep the input's color temperature — warm materials reflect existing light without shifting overall tone. Keep whites neutral.";
const WALL_PRESERVATION = "Wall geometry stays identical: same angles, corners, depth. Only change color and texture. Keep raw stone or brick visible with limewash unless style explicitly requests opaque paint. Structural elements (IPN beams, concrete columns, mezzanine slab edges, metal lintels) keep their original surface material and texture — apply paint over the texture, not a smooth coat.";
const CAMERA_PRESERVATION = "Same camera angle, height, tilt, and field of view as input. The frame edges must match the input exactly — walls that are cut off at the edge of the input photo must be cut off at the same position in the output. Do not widen or narrow the frame. Room dimensions are FIXED — the distance between opposite walls must be IDENTICAL to the input. Do not stretch, widen, compress, or reshape the space to accommodate furniture or finishes.";
const ANTI_FENETRE = "Count the windows and doors visible in the input photo. The output must have the EXACT same count, at the same positions, same sizes. If a wall has no window in the input, it must remain a solid wall in the output — even if the wall extends beyond the visible frame. Do not add windows, doors, or openings to walls that are partially visible or out of frame. This includes upper levels, mezzanines, and loft areas — do not add windows or openings at any height level.";
const ANTI_INVENTION = "Only modify surfaces as described. No new architectural elements (arches, vaults, columns, niches, coffers, windows, doors) unless already in the input. Areas beyond the frame edges of the input are unknown — leave them as-is, do not invent what is there.";

// v51: extracted from 8 inline copies in pass 1 builders (P2-1 audit)
const CONSTRUCTION_CLEANUP = "Remove construction leftovers: dangling cables, junction boxes, exposed wiring, electrical outlets, round black wall boxes, cable exits, exposed plumbing pipes, copper tubes, PVC pipes, water supply lines, drain pipes — cover with wall or floor finish. Count all fixed wall-mounted equipment in the input (radiators, convectors, heaters, water heater, boiler, vents, thermostats, switches, electrical panels). The output MUST have the SAME count at the SAME positions — if the input shows 1 radiator below a window, the output MUST show 1 radiator below that window.";

// v51: outdoor-specific preservation constants (P0-1, P0-2, P1-6 audit)
const OUTDOOR_ANTI_FENETRE = "Count all openings (doors, windows, gates, archways) visible in the input. The output must have the EXACT same count at the same positions. Do not add or remove any opening.";
const OUTDOOR_PREAMBLE_P2 = "Edit this outdoor photo. The ground surface, walls, fences, facades, gates, and sky are final — keep them unchanged. Same camera angle, same space geometry, same openings. Space dimensions are FIXED — do not stretch, widen, or compress the area to accommodate furniture. No curtains, no drapes.";

// v44: gpt-image-1.5 preservation preambles — MUST be the FIRST tokens in every prompt.
// gpt-image-1.5 is more creative than gpt-image-1 and regenerates scenes unless preservation is stated FIRST.
const PASS1_PREAMBLE = "Edit this photo. Preserve the room geometry, camera angle, all windows and doors (same count, same positions), wall layout, ceiling shape, and room dimensions. Room dimensions are FIXED — do not stretch, widen, or compress the space. The distance between opposite walls must be IDENTICAL to the input. The output image must show the same framing as the input — same edges, same crop, same field of view.";
const PASS2_PREAMBLE = "Edit this photo of a finished room. The wall colors, floor material, and ceiling finish are final — keep them unchanged. Same camera angle, same room geometry, same windows, same doors. Room dimensions are FIXED — do not stretch, widen, or compress the space to accommodate furniture. If the room appears narrow or compact, preserve that compactness — reduce furniture count and size rather than stretching walls apart. No curtains, no drapes.";

// ── Pass 1: Surface finishing ────────────────────────────────────────
// v36: ACTION FIRST in all builders (v30 lesson — GPT-image-1 weights early tokens more)
export function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null, roomInventory?: string): string {
  // Inject room inventory right after PREAMBLE if available
  const inventoryLine = roomInventory ? `This room has: ${roomInventory}` : "";
  // Kitchen: v44 — preservation FIRST, then style
  if (roomTypeId === "kitchen") {
    const kitchenSurface = surfacePrompt.replace(/,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi, "");
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${kitchenSurface}.`,
      "Floor: ceramic or natural stone tiles (kitchen-appropriate). Subway tile or smooth splashback behind work area. Ceiling light per style description.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no furniture, no appliances.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: v44 — preservation FIRST, then style
  if (roomTypeId === "bathroom") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Floor-to-ceiling ceramic tiles in shower zone and vanity area. Water-resistant floor — ceramic or stone, matte non-slip. Recessed IP44 ceiling spotlights.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no fixtures, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // WC: v44 — preservation FIRST, then style
  if (roomTypeId === "wc") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles or vinyl. Washable matte paint or tiles on lower walls.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no fixtures, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: v44 — preservation FIRST, then style
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Flooring per style description above. Ceiling light per style description. If ONE accent wall exists, preserve it — apply style color to other walls only.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no furniture, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "laundry") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Waterproof floor — white or light grey ceramic tiles matte. Walls in washable matte white paint.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no appliances, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "cellar") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Concrete or stone floor as-is or with sealant. Clean matte white or light grey paint over masonry.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — bare floors, bare walls.",
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "entryway") {
    return [
      PASS1_PREAMBLE,
      inventoryLine,
      ANTI_FENETRE,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
      `Change only the surface finishes: ${surfacePrompt}.`,
      "Durable entrance floor — ceramic tiles, natural stone, or hard-wearing wood. Ceiling light per style description.",
      CONSTRUCTION_CLEANUP,
      "Room stays completely empty — no furniture, no objects.",
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  // v45: preservation FIRST for gpt-image-1.5
  return [
    PASS1_PREAMBLE,
    inventoryLine,
    ANTI_FENETRE,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_INVENTION,
    `Change only the surface finishes: ${surfacePrompt}.`,
    "Apply the described finish to the existing floor and walls. Do not add structural elements that are absent from the input. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture), preserve it as-is — apply the style's wall color to the other walls only.",
    CONSTRUCTION_CLEANUP,
    "Keep the room completely empty — no furniture, no rugs, no objects.",
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const EQUIPMENT_PRESERVATION = "Count all fixed equipment in the input (radiators, floor-standing convectors, electric convector heaters, wall-mounted heaters, water heaters, boiler, vents, thermostats, switches, electrical panels, towel dryers). The output MUST contain the SAME number at the SAME positions. If the input shows 1 radiator below a window, the output MUST show 1 radiator below that window. Do not place furniture in front of radiators or convectors.";
// v51: P1-2 — prevent architectural hallucinations in pass 2 (Art Deco arches, Haussmannien niches, etc.)
const PASS2_ANTI_INVENTION = "No new architectural elements (arches, niches, columns, coffers, windows, doors) unless already in the input.";
const CONTACT_SHADOWS = "Every piece must have visible contact shadows on the floor.";
const DEPTH_DISTRIBUTION_KITCHEN = "Distribute kitchen elements across the full depth of the room. Work zones along walls, island or table in the middle zone if space allows. Counter accessories spread across the full counter length — never cluster on one end.";
const DEPTH_DISTRIBUTION_BEDROOM = "Distribute bedroom furniture across the full depth and width of the room. Bed as primary anchor, dresser or wardrobe as background anchor in the back third. Balance nightstands on both sides when space allows. If one side of the room appears empty, place a floor lamp or bench to balance the composition laterally.";

/**
 * Pre-resolve "choose one:" alternatives in a prompt by randomly picking one option.
 * This forces variety between generations — without this, the model tends to
 * produce the same composition every time ("template figé").
 * Example: "(choose one: oatmeal bouclé, grey linen, cream wool)" → "oatmeal bouclé"
 */
function resolveChooseOne(prompt: string): string {
  return prompt.replace(/\(choose one:\s*([^)]+)\)/gi, (_, options: string) => {
    const choices = options.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (choices.length === 0) return "";
    return choices[Math.floor(Math.random() * choices.length)];
  });
}

// v36: ACTION FIRST in all builders (v30 lesson), camera/structure at END
export function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null, roomInventory?: string): string {
  // Resolve "choose one:" alternatives randomly for variety between generations
  const resolvedPrompt = resolveChooseOne(furniturePrompt);
  // Inject room inventory right after PREAMBLE if available
  const inventoryLine = roomInventory ? `This room has: ${roomInventory}` : "";
  // Kitchen: v45 — preservation FIRST for gpt-image-1.5, then add elements
  if (roomTypeId === "kitchen") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following kitchen elements: ${resolvedPrompt}.`,
      "Built-in cabinetry and countertops against walls. Add island only if kitchen appears larger than 10m2. If compact, skip island. The ceiling light was already placed in pass 1 — keep it as-is.",
      "Scale kitchen to apparent width — fewer elements if compact, full set if spacious. Skip island under 10m2.",
      DEPTH_DISTRIBUTION_KITCHEN,
      CONTACT_SHADOWS,
      "Scale references: door = 204cm, sill = 90cm. Freestanding objects only.",
      "Include 2-3 lived-in details: a wooden cutting board, a fruit bowl, a folded linen tea towel on the counter.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "bathroom") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following bathroom fixtures and accessories: ${resolvedPrompt}.`,
      "If a bathtub, shower, sink, or toilet is visible in the input, keep it at the same position, same size, same shape.",
      "This is a compact bathroom by default. ONE vanity, ONE basin — never a double vanity. Use 60cm vanity, skip stool and basket, no freestanding tub. Only use 80cm vanity or add freestanding tub if the room is clearly wider than 2.5m. Ignore shower and tub dimensions from the style if room is compact — use 80cm shower maximum.",
      "Do not duplicate any fixture already visible. If a shower exists, do not add another. If a tub exists, do not add a shower stall.",
      "The bathroom width and depth must match the input exactly — do not widen or deepen the room to fit more fixtures. This bathroom is NARROW — if the walls are close together in the input, they must be equally close in the output. Reduce furniture size rather than stretching the room.",
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
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following WC fixtures: ${resolvedPrompt}.`,
      "Very small space — minimal items. Wall-hung or floor toilet, compact hand basin with mirror above.",
      CONTACT_SHADOWS,
      "Scale reference: door = 204cm.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following bedroom furniture: ${resolvedPrompt}.`,
      "Freestanding only — bed, nightstands, rug, wardrobe/dresser as background anchor. All objects resting on the floor. Furniture must not touch walls.",
      "Calm atmosphere — respect furniture density implied by the style. If minimalist, leave large empty floor areas.",
      DEPTH_DISTRIBUTION_BEDROOM,
      CONTACT_SHADOWS,
      "Scale bed to room: if compact, 140cm bed instead of 160cm, skip bench. Door = 204cm reference.",
      "Include 2-3 lived-in details: an open book on the nightstand, a casually draped throw on the bed, a ceramic mug on a side table.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "entryway") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following entryway furniture: ${resolvedPrompt}.`,
      "Small space — do not overcrowd. Console max 60% of wall width. Freestanding only: console, mirror propped on console, coat rack, bench, runner rug. All objects resting on the floor.",
      "If the entryway is deep enough, place a secondary element (bench, umbrella stand, plant) in the back third. If wide, balance left and right sides.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      "Include 1-2 lived-in details: a set of keys on the console, a casually placed hat, a small stack of mail.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "laundry") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following laundry equipment: ${resolvedPrompt}.`,
      "Functional layout — washing machine, cabinet, drying rack, basket. No decorative objects. If compact (<4m2), skip folding table and drying rack.",
      "If deep enough, place storage shelving or a basket in the back third. If wide, balance equipment on both sides.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "cellar") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following cellar furnishing: ${resolvedPrompt}.`,
      "Functional storage — shelving unit, boxes, utility light. Wine rack if space allows. If compact, single shelf, no wine rack.",
      "If the cellar is deep, place at least one storage element in the back third. If wide, use both sides of the space.",
      CONTACT_SHADOWS,
      "Door = 204cm reference.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      DSLR_LINE,
    ].join(" ");
  }

  // Dining room: v45 — preservation FIRST for gpt-image-1.5
  if (roomTypeId === "dining_room") {
    return [
      PASS2_PREAMBLE,
      inventoryLine,
      CAMERA_PRESERVATION, LIGHT_PRESERVATION,
      COLUMN_PRESERVATION,
      EQUIPMENT_PRESERVATION,
      PASS2_ANTI_INVENTION,
      `ADD the following furniture and decoration: ${resolvedPrompt}.`,
      "Center dining table with chairs, balanced across the room width. If deep room, add sideboard as background anchor in the back third. If one side is empty, place a floor lamp or console to balance laterally. If compact, round table 120cm + 4 chairs instead of rectangular 180cm + 6.",
      "Freestanding only — no wall art, no shelving. Furniture must not touch walls.",
      CONTACT_SHADOWS,
      "Door = 204cm, sill = 90cm references.",
      "Include 2-3 lived-in details: a ceramic vase with a branch, a linen napkin casually folded, a carafe on the table.",
      "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
      "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  // v45: preservation FIRST for gpt-image-1.5
  return [
    PASS2_PREAMBLE,
    inventoryLine,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    COLUMN_PRESERVATION,
    EQUIPMENT_PRESERVATION,
    PASS2_ANTI_INVENTION,
    `ADD the following furniture and decoration: ${resolvedPrompt}.`,
    "Freestanding objects only. Fill 30-40% of the visible floor area with furniture — the room must look LIVED IN, not empty with a sofa in the middle.",
    "Place at least ONE furniture piece in the BACK THIRD of the room (console table, bookshelf, floor lamp, plant on stand). Place at least ONE piece on EACH SIDE of the room. The foreground has the main seating group, the background has secondary anchors. No empty zones.",
    "Adapt density to room size: if the visible floor area appears compact, keep 5-6 key pieces only. If the room is very large or deep, add a second furniture grouping in the back zone.",
    CONTACT_SHADOWS,
    "Scale references: door = 204cm, handle = 100cm, sill = 90cm. Scale furniture to room volume — if compact (<4m wide), use smaller pieces. Scale up if ceiling >3m.",
    "No duplicate items unless style calls for a pair.",
    "Include 2-3 lived-in details: an open book, a coffee cup on a side table, a casually draped throw. Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog.",
    "Place furniture INSIDE the room only — do not add any object on exterior terraces, balconies, or patios visible through windows or glazing.",
    DSLR_LINE,
  ].join(" ");
}

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
// v51: P0-1 added OUTDOOR_ANTI_FENETRE, P0-3 added roomInventory
export function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string,
  roomInventory?: string
): string {
  const inventoryLine = roomInventory ? `This space has: ${roomInventory}` : "";
  return [
    "Edit this exact outdoor photo. Preserve exactly: the space geometry, camera angle, every wall and fence position, every opening, ground level changes, sky. Space dimensions are FIXED — do not stretch, widen, or compress the area. The distance between walls and fences must be IDENTICAL to the input.",
    inventoryLine,
    OUTDOOR_ANTI_FENETRE,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky.",
    `CHANGE ONLY the ground surface finish: ${surfacePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Preserve all fixed ground elements: metal access covers, drain grates, manholes, utility plates. Apply the new ground material AROUND these elements, not over them.",
    "Preserve all expansion joints, step nosings, level changes, and threshold transitions in the ground surface.",
    "Preserve all existing guard rails, exterior walls, facades, gates, fences, and full-height glazing (glass doors, bay windows, sliding doors). Do not add or remove any vertical structure.",
    "Keep the existing wall color and texture — do not warm, smooth, or repaint walls unless the surface prompt explicitly names a wall finish.",
    "Glass blocks and skylights keep their translucency — light passes through them in the output.",
    "Preserve existing vegetation in the background. Only modify ground surface in the foreground zone.",
    "Maintain the exact wall and facade color temperature from the input — do not warm or cool the surfaces.",
    ANTI_INVENTION,
    "No furniture in this pass — EMPTY outdoor space with finished ground only.",
    DSLR_LINE,
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Outdoor Pass 2: Outdoor furniture placement ─────────────────────────
// v51: P0-2 added OUTDOOR_PREAMBLE_P2, P0-1 added OUTDOOR_ANTI_FENETRE, P0-3 added roomInventory
export function buildOutdoorFurnitureResponsesPrompt(
  furniturePrompt: string,
  subtypeOverride: string,
  roomInventory?: string
): string {
  const resolvedPrompt = resolveChooseOne(furniturePrompt);
  const inventoryLine = roomInventory ? `This space has: ${roomInventory}` : "";
  return [
    OUTDOOR_PREAMBLE_P2,
    inventoryLine,
    OUTDOOR_ANTI_FENETRE,
    CAMERA_PRESERVATION, LIGHT_PRESERVATION,
    PASS2_ANTI_INVENTION,
    `Add outdoor furniture and decoration: ${resolvedPrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture across the full depth and width of the space — use both left and right sides. If large, create a primary group and a secondary accent further back or to the side.",
    "Outdoor plants only — no houseplants (no monstera, no fiddle leaf, no pothos). Scale plants to space: balcony max 120cm, garden max 200cm.",
    "All lighting fixtures off in daylight. Textiles must be outdoor-rated. If space under 10m2, use bistro-scale furniture.",
    "Include 2-3 lived-in details: an open book on a side table, a glass of water, a casually draped outdoor throw on a chair.",
    CONTACT_SHADOWS,
    DSLR_LINE,
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
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string },
  roomInventory?: string
): Promise<{ image: string; model: string }> {
  const openai = getOpenAI();

  let prompt: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesResponsesPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "", roomInventory)
        : buildOutdoorFurnitureResponsesPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "", roomInventory);
  } else {
    prompt =
      pass === 1
        ? buildSurfacesResponsesPrompt(surfacePrompt, roomTypeId, roomInventory)
        : buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId, roomInventory);
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

// ─── Best-of-2 scoring: local SSIM structural similarity (no API call) ──

/**
 * Score how well an output image preserves the original room's geometry.
 * Uses local SSIM calculation via sharp — zero API cost, ~50ms.
 * Fail-open: returns 5 on any error.
 */
export async function scorePreservationLocal(inputBase64: string, outputBase64: string): Promise<number> {
  try {
    const SIZE = 256;
    const [inputBuf, outputBuf] = await Promise.all([
      sharp(Buffer.from(inputBase64, "base64")).resize(SIZE, SIZE, { fit: "fill" }).greyscale().raw().toBuffer(),
      sharp(Buffer.from(outputBase64, "base64")).resize(SIZE, SIZE, { fit: "fill" }).greyscale().raw().toBuffer(),
    ]);

    const n = inputBuf.length;
    let sumInput = 0, sumOutput = 0, sumInputSq = 0, sumOutputSq = 0, sumCross = 0;
    for (let i = 0; i < n; i++) {
      const a = inputBuf[i], b = outputBuf[i];
      sumInput += a; sumOutput += b;
      sumInputSq += a * a; sumOutputSq += b * b;
      sumCross += a * b;
    }
    const meanA = sumInput / n, meanB = sumOutput / n;
    const varA = sumInputSq / n - meanA * meanA;
    const varB = sumOutputSq / n - meanB * meanB;
    const covAB = sumCross / n - meanA * meanB;

    const C1 = 6.5025, C2 = 58.5225; // (0.01*255)^2, (0.03*255)^2
    const ssim = ((2 * meanA * meanB + C1) * (2 * covAB + C2)) /
                 ((meanA * meanA + meanB * meanB + C1) * (varA + varB + C2));

    // Map SSIM (0-1) to score (1-10)
    const score = Math.round(Math.max(1, Math.min(10, ssim * 10)));
    console.log(`[scorePreservationLocal] SSIM=${ssim.toFixed(4)} → score=${score}`);
    return score;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scorePreservationLocal] Failed (fail-open): ${msg}`);
    return 5;
  }
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
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string },
  roomInventory?: string,
  originalImageBase64?: string
): Promise<{ image: string; model: string; bestOf2?: { score1: number; score2: number; chosen: 1 | 2 } }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Clé API OpenAI non configurée.");
  }

  // Determine if room is complex enough to warrant best-of-2
  const isComplexRoom = roomInventory && /vault|beam|mezzanine|double.height|L.shaped|loft|cathedral|arch|column|pillar|alcove|bay.window|[3-9]\s*windows?/i.test(roomInventory);

  // Single generation with retry — used for pass 1, or pass 2 on simple rooms
  const generateSingle = async (): Promise<{ image: string; model: string }> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_PASS_RETRIES; attempt++) {
      try {
        return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai, roomTypeId, outdoor, roomInventory);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`OpenAI pass ${pass} attempt ${attempt + 1}/${MAX_PASS_RETRIES} failed:`, lastError.message);
        if (attempt < MAX_PASS_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
    throw new Error(`Échec passe ${pass} après ${MAX_PASS_RETRIES} tentatives. ${lastError?.message ?? ""}`);
  };

  // Pass 1, no original image, or simple room pass 2: single generation
  if (pass === 1 || !originalImageBase64 || !isComplexRoom) {
    if (pass === 2) {
      console.log(`[best-of-2] SKIPPED — room is ${isComplexRoom ? "complex" : "simple"}, single candidate`);
    }
    return await generateSingle();
  }

  // Pass 2 on complex room: best-of-2 — generate 2 candidates in parallel, keep best spatial preservation
  console.log("[best-of-2] Complex room detected, generating 2 pass-2 candidates in parallel...");

  const results = await Promise.allSettled([generateSingle(), generateSingle()]);

  const candidates: Array<{ image: string; model: string }> = [];
  for (const r of results) {
    if (r.status === "fulfilled") candidates.push(r.value);
  }

  if (candidates.length === 0) {
    const firstErr = results[0].status === "rejected" ? results[0].reason : new Error("Unknown");
    throw firstErr instanceof Error ? firstErr : new Error(String(firstErr));
  }

  if (candidates.length === 1) {
    console.log("[best-of-2] Only 1 candidate succeeded, using it directly");
    return candidates[0];
  }

  // Score both candidates against the ORIGINAL input image (not pass 1) — local SSIM, zero API cost
  const extractB64 = (img: string) => img.replace(/^data:image\/[\w+]+;base64,/, "");
  const [score1, score2] = await Promise.all([
    scorePreservationLocal(originalImageBase64, extractB64(candidates[0].image)),
    scorePreservationLocal(originalImageBase64, extractB64(candidates[1].image)),
  ]);

  const chosen = score1 >= score2 ? 0 : 1;
  console.log(`[best-of-2] SSIM scores: candidate1=${score1}, candidate2=${score2} → chose candidate${chosen + 1}`);

  return {
    ...candidates[chosen],
    bestOf2: { score1, score2, chosen: (chosen + 1) as 1 | 2 },
  };
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
  roomInventory: string;
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

  // Pre-pass vision: extract room geometry inventory (fail-open, 5s timeout)
  const roomInventory = await extractRoomInventory(inputBase64);

  const t0 = Date.now();

  // Pass 1: surfaces
  const pass1 = await generatePass(inputBase64, trimmedSurface, trimmedFurniture, 1, outputSize, isOutdoor ? null : roomType, outdoorParam, roomInventory);
  const t1 = Date.now();
  const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

  // Build prompts for logging
  const builtPromptPass1 = isOutdoor
    ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "", roomInventory)
    : buildSurfacesResponsesPrompt(trimmedSurface, roomType, roomInventory);
  const builtPromptPass2 = isOutdoor
    ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "", roomInventory)
    : buildFurnitureResponsesPrompt(trimmedFurniture, roomType, roomInventory);

  // Surfaces-only mode
  if (!withFurniture) {
    return {
      outputBase64: pass1Base64, pass1Base64,
      pass1Model: pass1.model, pass2Model: null, pass2Failed: false,
      durationMs: t1 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: 0,
      builtPromptPass1, builtPromptPass2, trimmedSurface, trimmedFurniture,
      roomInventory,
    };
  }

  // Pass 2: furniture with best-of-2 scoring (originalImageBase64 = input for spatial comparison)
  let pass2: { image: string; model: string; bestOf2?: { score1: number; score2: number; chosen: 1 | 2 } } | null = null;
  let pass2Failed = false;
  try {
    pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, isOutdoor ? null : roomType, outdoorParam, roomInventory, inputBase64);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Pipeline pass 2 failed: ${msg}`);
    pass2Failed = true;
  }

  const t2 = Date.now();
  const finalBase64 = pass2
    ? pass2.image.replace(/^data:image\/[\w+]+;base64,/, "")
    : pass1Base64;

  return {
    outputBase64: finalBase64, pass1Base64,
    pass1Model: pass1.model, pass2Model: pass2?.model ?? null, pass2Failed,
    durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
    builtPromptPass1, builtPromptPass2, trimmedSurface, trimmedFurniture,
    roomInventory,
  };
}
