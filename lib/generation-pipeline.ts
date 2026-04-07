/**
 * Generation pipeline — shared between /api/generate and /api/cron/process-queue.
 * Extracted from route.ts to avoid duplication (Sprint 23).
 * NO dependency on NextRequest/NextResponse/session/headers.
 */
import OpenAI from "openai";
import sharp from "sharp";
import { applyRoomTypeOverrides, ROOM_TYPES, getStyleMaterialHint } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";

// v55 — type sécurisé pour input_fidelity (l'API n'expose pas encore les types).
export type InputFidelity = "high" | "low";

// Singleton OpenAI client — reuses HTTP connections across passes
let _openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openaiClient;
}

// ─── Complex room detection (best-of-2 gate) ────────────────────────
/**
 * Returns true if the room inventory mentions at least one feature that
 * historically degrades single-pass generations (vaults, mezzanines,
 * double-height, L-shaped, >=3 windows, etc.).
 *
 * Used by `generatePass` to decide whether to spend the extra API call
 * for best-of-2 scoring. Simple rooms take the single-generation path.
 *
 * Exported for direct testing — the regex is the de-facto spec for what
 * "complex" means in the pipeline.
 *
 * Exact regex kept identical to the inline version shipped in session 32
 * (pipeline v49) to avoid behavioural drift.
 */
export function isComplexRoom(roomInventory: string | undefined | null): boolean {
  if (!roomInventory) return false;
  return /vault|beam|mezzanine|double.height|L.shaped|loft|cathedral|arch|column|pillar|alcove|bay.window|[3-9]\s*windows?/i.test(
    roomInventory,
  );
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
 * v52 (audit v51 Yann 7.2 Lucas 7.5: P0 ANTI_FENETRE couvre mezzanines/niveaux superieurs, P1 PASS2_PREAMBLE anti-elargissement pieces etroites + bathroom builder renforce, P1 EQUIPMENT_PRESERVATION couvre convecteurs au sol et seche-serviettes),
 * v55 (audit v54 Yann 7.35 Lucas 7.10 NO-GO — 4 fixes P0:
 *   P0-A bug propagation room_type Pipeline B — dining_room/office utilisaient le variant living-room concatene, le modele tranchait pour le bloc le plus long et livrait un salon. Fix: extension de la regle override-replace a TOUS les room types non-living_room (et plus seulement les dedicated builders).
 *   P0-B suppression "vault beams" amorcantes sur 10/12 styles — la formulation poussait gpt-image-1.5 a halluciner des poutres meme sur plafonds plats. Conservee uniquement pour Mediterranean/Industrial avec formulation conditionnelle stricte.
 *   P0-C ARCHITECTURAL HONESTY clause ajoutee en tete de tous les builders passe 1 (8 branches indoor) — interdit l'invention de structures non visibles dans l'input.
 *   P0-D color shift Contemporary — surfacePrompt reformule pour preserver la temperature warm/cool des murs au lieu de les neutraliser globalement.
 *   Fixes appliques en synchro StylePicker.tsx + style-resolver.ts (24 modifications synchronisees + 2 surfacePrompts Contemporary).
 * v58 (Sprint audit v57 Yann+Lucas — 3 P0 prompt-engineering, decision @ia autonomous):
 *   P0-1 bathroom biais douche — roomFurnitureOverride dans lib/room-types.ts reformule en mode
 *     PRESERVATION-FIRST. Avant : "frameless glass walk-in shower 80-90cm + If room large add freestanding tub"
 *     ecrasait litteralement la baignoire/douche existante (le modele obeit a l'instruction explicite
 *     avant input_fidelity). Apres : "preserve all existing sanitary fixtures exactly", uniquement
 *     accessoires freestanding/wall-mounted, pas de prescription d'equipement. Affecte les 12 styles bathroom.
 *   P0-2 iteration adjust over-conservative — buildAdjustResponsesPrompt clause equipment-preservation
 *     etendue avec exception conditionnelle "UNLESS the requested change above explicitly asks to remove
 *     or relocate one of these items". Resout la contradiction SURGICAL EDIT vs EQUIPMENT_PRESERVATION
 *     quand l'utilisateur demande "enleve le ballon d'eau chaude".
 *   P0-3 TEMPORARY_OBJECTS_TO_REMOVE manquant — CLEANUP_V53 etendu avec debris, ladders, scaffolding,
 *     buckets, paint pots, tarps, drop cloths, hand tools, power tools, brooms, et people visibles
 *     (workers, painters, occupants, photographers, hands). Pieces brutes Thomas marchand de biens
 *     desormais nettoyees en pass 1. Affecte les 8 builders pass 1 indoor (Kitchen, Bathroom, WC,
 *     Bedroom, Laundry, Cellar, Entryway, fallback living/dining/office).
 *   Reportes en v59 : Option 3 sharp pre-processing (P2 Lucas), EQUIPMENT_PRESERVE/HIDE split par room_type. */
export const PROMPT_VERSION = "v58";

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
const DSLR_LINE = "DSLR wide-angle, sharp focus, deep DOF. Same focal length as input. No text.";

// v53: PASS 1 — condensed from 663 words to ~180 words.
// gpt-image-1.5 loses focus after ~200 words. Structure FIRST, action SECOND.
const PASS1_PREAMBLE_V53 = "STRUCTURE LOCK: every column, beam, slab edge, and ceiling shape keeps its exact width, depth, and position. EXACT same count of windows and doors at same positions — solid walls stay solid. Same camera angle, same framing, same room dimensions — FIXED, no stretch. Edit surfaces only: wall color, floor material, ceiling finish, and one ceiling light fixture. Apply finishes OVER existing textures, not replacing the 3D shape underneath.";
// v57: ARCHITECTURAL_HONESTY_V55 clause removed by Option 2 rollback (decision 087e38b).
// The clause was injected in 8 pass-1 builders but did not prevent the leakage problems
// observed in v56 audits. Removed to reduce prompt length and revert to v54 baseline.
const PRESERVATION_V53 = "Ceiling: keep every bump, step, soffit, vault, and beam visible — paint over their surface, keep their shape. Columns, posts, IPN beams, and metal lintels: keep full width and original material texture. Slab edges: keep full thickness. Mouldings, cornices, and decorative trims: keep shape and position, paint over. Keep the input's color temperature — do not warm or cool.";
// v58: TEMPORARY_OBJECTS_TO_REMOVE — inclut debris de chantier, outils, personnes (Sprint audit v57 Yann+Lucas).
// Les chantiers bruts livres par Thomas (marchand de biens) contiennent regulierement echelles, seaux, debris,
// peintres, occupants, photographes. Sans cette clause, ces elements restent visibles a 100% en pass 1.
const CLEANUP_V53 = "Remove all loose construction items and temporary objects: cables, junction boxes, exposed pipes, outlets, construction debris, rubble, cardboard boxes, paint pots, buckets, tarps, drop cloths, ladders, step-stools, scaffolding, hand tools, power tools, brooms, and any people visible (workers, painters, occupants, photographers, hands) — replace each removed zone with the surrounding wall, floor, or ceiling finish. Keep all fixed equipment in place: radiators, heaters, vents, panels — same count, same positions. Existing built-in fixtures (bathtub, shower tray, toilet, sink) stay if present. Room stays COMPLETELY EMPTY of people, tools, and debris — no furniture, no new fixtures.";

// v54: ANTI_INVENTION still used by outdoor pass 1.
const ANTI_INVENTION = "Only modify surfaces as described. No new architectural elements (arches, vaults, columns, niches, coffers, windows, doors) unless already in the input. Areas beyond the frame edges of the input are unknown — leave them as-is, do not invent what is there.";

// v54: outdoor-specific preservation constants — condensed from v51
const OUTDOOR_ANTI_FENETRE = "EXACT same count of openings (doors, windows, gates, archways) at same positions. Do not add or remove any opening.";
const OUTDOOR_PREAMBLE_P1_V54 = "STRUCTURE LOCK: every wall, fence, facade, gate, low wall, raised border, stone edging, and level change keeps its exact position and shape. EXACT same openings count. Same camera angle, same framing, same space dimensions — FIXED, no stretch. Edit ground surface only. Sky preserved as-is, preserve blown-out highlights.";
const OUTDOOR_PREAMBLE_P2_V54 = "Edit this outdoor photo. Ground surface, walls, fences, facades, gates, low walls, raised borders, stone edging, and sky are final — keep unchanged. Same camera angle, same space geometry. Space dimensions FIXED — do not stretch or compress. No curtains, no drapes.";


// ── Pass 1: Surface finishing ────────────────────────────────────────
// v36: ACTION FIRST in all builders (v30 lesson — GPT-image-1 weights early tokens more)
export function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null, roomInventory?: string): string {
  // Inject room inventory right after PREAMBLE if available
  const inventoryLine = roomInventory ? `This room has: ${roomInventory}` : "";
  // v53: All pass 1 builders condensed — structure FIRST, ~220 words total (was ~663)
  // Kitchen
  if (roomTypeId === "kitchen") {
    const kitchenSurface = surfacePrompt.replace(/,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi, "");
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${kitchenSurface}.`,
      "Floor: ceramic or stone tiles (kitchen). Splashback behind work area. If one accent wall exists, keep it.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom
  if (roomTypeId === "bathroom") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "Ceramic tiles floor-to-ceiling in wet zones. Water-resistant matte floor. ONE ceiling light only — the pendant described in style, no recessed spots unless specified. If one accent wall exists, keep it.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // WC
  if (roomTypeId === "wc") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles. Washable paint on lower walls.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "If one accent wall exists, keep it — style color on other walls only.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry
  if (roomTypeId === "laundry") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "Waterproof ceramic floor. Washable white walls.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar
  if (roomTypeId === "cellar") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "Concrete or sealed stone floor. Light grey paint over masonry.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway
  if (roomTypeId === "entryway") {
    return [
      PASS1_PREAMBLE_V53,
      inventoryLine,
      PRESERVATION_V53,
      `Surface style: ${surfacePrompt}.`,
      "Durable entrance floor — ceramic, stone, or hard wood.",
      CLEANUP_V53,
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  // v53: condensed prompt — structure FIRST, ~220 words total (was ~663)
  return [
    PASS1_PREAMBLE_V53,
    inventoryLine,
    PRESERVATION_V53,
    `Surface style: ${surfacePrompt}.`,
    "If one accent wall exists (different color/texture), keep it — style color on other walls only.",
    CLEANUP_V53,
    DSLR_LINE,
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// v54: condensed pass 2 constants — from ~478 to ~200 words total.
// Rationale: gpt-image-1.5 loses focus after ~200 words. The furniturePrompt (hero pieces,
// materials, silhouettes) was buried at word ~480. Now it starts at ~150-200, in the
// zone of maximum attention. Pass 2 receives the FINISHED image from pass 1 — the model
// sees a clean room and only needs to ADD objects. Heavy preservation constants
// (CAMERA 83w, COLUMN 75w, LIGHT 27w) are unnecessary here and are condensed to 1 line each.

const PASS2_PREAMBLE_V54 = "Edit this photo of a finished room. Walls, floor, ceiling are final — keep them unchanged. Same camera angle. Room dimensions FIXED — do not stretch or compress. Columns visible — do not hide with furniture. Keep the input's color temperature. No curtains, no drapes. If the room is narrow or compact, preserve that — reduce furniture count rather than widening walls.";
const PASS2_EQUIPMENT_V54 = "Keep all fixed equipment (radiators, convectors, heaters, vents, panels, towel dryers) — same count, same positions. No furniture blocking them.";
const PASS2_ANTI_INVENTION_V54 = "No new architectural elements (arches, niches, columns, coffers, windows, doors) unless already in the input.";
const PASS2_DENSITY_V54 = "Respect furniture density implied by the style — if minimalist, leave large empty floor areas. If compact room, fewer pieces. Distribute furniture across FULL depth: primary group in foreground, secondary anchor (console, lamp, plant) in the back third. Balance left and right sides.";
const PASS2_FINISH_V54 = "Contact shadows on every piece. DSLR wide-angle, sharp focus, deep DOF. Same focal length as input. No text. Freestanding objects only — place furniture INSIDE the room only, not on terraces or balconies visible through windows.";

// v54: Legacy pass 2 constants — DEAD CODE, replaced by PASS2_*_V54 above. Kept for reference.
const DEPTH_DISTRIBUTION_KITCHEN = "Distribute kitchen elements across the full depth. Work zones along walls, island in middle if >10m2. Counter accessories spread across full counter length.";
const DEPTH_DISTRIBUTION_BEDROOM = "Bed as primary anchor, dresser or wardrobe as background anchor in back third. Balance nightstands both sides. If one side empty, add floor lamp or bench.";

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
  // Kitchen: v54 — condensed pass 2 constants, furniturePrompt in attention zone
  if (roomTypeId === "kitchen") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD kitchen elements: ${resolvedPrompt}.`,
      "Cabinetry against walls. Island only if >10m2. Ceiling light from pass 1 — keep as-is. Scale to apparent width.",
      DEPTH_DISTRIBUTION_KITCHEN,
      "Include 2-3 lived-in details: cutting board, fruit bowl, folded tea towel. Luxury listing photo.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Bathroom: v54 — condensed pass 2 constants
  if (roomTypeId === "bathroom") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD bathroom fixtures: ${resolvedPrompt}.`,
      "Keep existing bathtub/shower/sink/toilet at same position, size, shape. Do not duplicate any fixture already visible.",
      "Compact by default: ONE vanity 60cm, ONE basin, no freestanding tub. Only 80cm vanity or freestanding tub if room clearly >2.5m wide. 80cm shower max if compact.",
      "Do not widen or deepen the room. 60cm min passage width.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // WC: v54 — condensed pass 2 constants
  if (roomTypeId === "wc") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD WC fixtures: ${resolvedPrompt}.`,
      "Very small space — minimal items. Wall-hung or floor toilet, compact hand basin with mirror above. Door = 204cm reference.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Bedroom: v54 — condensed pass 2 constants
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD bedroom furniture: ${resolvedPrompt}.`,
      DEPTH_DISTRIBUTION_BEDROOM,
      "Scale bed to room: 140cm if compact, skip bench. Door = 204cm reference.",
      "Include 2-3 lived-in details: open book on nightstand, draped throw on bed, ceramic mug. Luxury listing photo.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Entryway: v54 — condensed pass 2 constants
  if (roomTypeId === "entryway") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD entryway furniture: ${resolvedPrompt}.`,
      "Small space — console max 60% wall width. Freestanding only. If deep, secondary element (bench, plant) in back third. Door = 204cm reference.",
      "Include 1-2 lived-in details: keys on console, casually placed hat.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Laundry: v54 — condensed pass 2 constants
  if (roomTypeId === "laundry") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD laundry equipment: ${resolvedPrompt}.`,
      "Functional layout — washing machine, cabinet, drying rack, basket. No decorative objects. If compact (<4m2), skip folding table. If deep, storage in back third.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Cellar: v54 — condensed pass 2 constants
  if (roomTypeId === "cellar") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD cellar furnishing: ${resolvedPrompt}.`,
      "Functional storage — shelving, boxes, utility light. Wine rack if space allows. If compact, single shelf only. If deep, storage in back third.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // Dining room: v54 — condensed pass 2 constants
  if (roomTypeId === "dining_room") {
    return [
      PASS2_PREAMBLE_V54,
      inventoryLine,
      PASS2_EQUIPMENT_V54,
      PASS2_ANTI_INVENTION_V54,
      `ADD furniture and decoration: ${resolvedPrompt}.`,
      "Center table with chairs. If deep, sideboard as background anchor. If compact, round 120cm + 4 chairs. Freestanding only.",
      "Include 2-3 lived-in details: ceramic vase with branch, folded linen napkin, carafe. Luxury listing photo.",
      PASS2_FINISH_V54,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  // v54: condensed pass 2 constants, furniturePrompt in attention zone
  return [
    PASS2_PREAMBLE_V54,
    inventoryLine,
    PASS2_EQUIPMENT_V54,
    PASS2_ANTI_INVENTION_V54,
    `ADD furniture and decoration: ${resolvedPrompt}.`,
    PASS2_DENSITY_V54,
    "Fill 30-40% of floor area. Door = 204cm, sill = 90cm scale references. No duplicates unless style calls for a pair.",
    "Include 2-3 lived-in details: open book, coffee cup, draped throw. Luxury listing photo.",
    PASS2_FINISH_V54,
  ].join(" ");
}

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
// v54: condensed from ~350 to ~200 words. Added low walls, raised borders, stone edging (Camille P3).
export function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string,
  roomInventory?: string
): string {
  const inventoryLine = roomInventory ? `This space has: ${roomInventory}` : "";
  // v54: condensed outdoor pass 1 — structure FIRST, ~200 words (was ~350)
  return [
    OUTDOOR_PREAMBLE_P1_V54,
    inventoryLine,
    `CHANGE ONLY the ground surface finish: ${surfacePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Keep all fixed ground elements (access covers, drain grates, manholes, utility plates) — apply material AROUND them. Preserve expansion joints, step nosings, level changes, threshold transitions.",
    "Keep all vertical structures: guard rails, walls, facades, gates, fences, full-height glazing. Keep wall color and temperature — do not warm or cool. Glass blocks and skylights keep translucency.",
    "Preserve existing vegetation. Keep the input's color temperature and light direction.",
    ANTI_INVENTION,
    "No furniture — EMPTY outdoor space with finished ground only.",
    DSLR_LINE,
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Outdoor Pass 2: Outdoor furniture placement ─────────────────────────
// v54: condensed from ~250 to ~150 words. Added low walls, raised borders, stone edging (Camille P3).
export function buildOutdoorFurnitureResponsesPrompt(
  furniturePrompt: string,
  subtypeOverride: string,
  roomInventory?: string
): string {
  const resolvedPrompt = resolveChooseOne(furniturePrompt);
  const inventoryLine = roomInventory ? `This space has: ${roomInventory}` : "";
  // v54: condensed outdoor pass 2 — ~150 words (was ~250)
  return [
    OUTDOOR_PREAMBLE_P2_V54,
    inventoryLine,
    OUTDOOR_ANTI_FENETRE,
    PASS2_ANTI_INVENTION_V54,
    `Add outdoor furniture and decoration: ${resolvedPrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute across full depth and width. If large, primary group + secondary accent further back. Outdoor plants only (no monstera, no fiddle leaf). Scale: balcony max 120cm plants, garden max 200cm.",
    "Lights off in daylight. Outdoor-rated textiles. If <10m2, bistro-scale furniture.",
    "Include 2-3 lived-in details: open book, glass of water, draped throw. Contact shadows on every piece.",
    "Keep the input's color temperature and light direction.",
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
  roomInventory?: string,
  inputFidelity: InputFidelity = "high" // v57: rollback to "high" universally (decision 087e38b — Option 2)
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
          input_fidelity: inputFidelity,
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
    model: `OpenAI ${IMAGE_MODEL} (pass ${pass}, fidelity=${inputFidelity})`,
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
  const complex = isComplexRoom(roomInventory);

  // v57 — input_fidelity defaults to "high" universally (decision 087e38b — Option 2 rollback).
  // Audit v56 trajectory: 7.22 → 5.65 → 5.10 (-2.12 pts). Both Yann and Lucas converged on rollback.
  // The compositing artifact is API-level, not fidelity-level — "low" did not solve it and degraded preservation.
  // Single generation with retry — used for pass 1, or pass 2 on simple rooms
  const generateSingle = async (): Promise<{ image: string; model: string }> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_PASS_RETRIES; attempt++) {
      try {
        return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai, roomTypeId, outdoor, roomInventory, "high");
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
  if (pass === 1 || !originalImageBase64 || !complex) {
    if (pass === 2) {
      console.log(`[best-of-2] SKIPPED — room is ${complex ? "complex" : "simple"}, single candidate`);
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

    // CRITICAL FIX (v55, session 35 audit Yann/Lucas Pipeline B):
    // When a roomType has a non-empty roomFurnitureOverride (dining_room, office, AND all
    // dedicated builders), we MUST use the override + a brief style hint INSTEAD of the
    // merged living-room style variant. The previous behavior only applied this rule to
    // the dedicated-builder set, leaving dining_room and office to receive the concatenated
    // "Dining room furniture: table 180cm + 6 chairs ... An architect's living room ...
    // curved four-seat sofa ..." prompt — the model tranchait pour le bloc le plus long
    // et livrait un salon au lieu d'une salle a manger (Pipeline B audit #196).
    //
    // Rule: living_room is the ONLY indoor room type with an empty roomFurnitureOverride,
    // and therefore the ONLY room type that should receive the full style variant verbatim.
    // hasDedicatedBuilder is still used above to bypass the room-type SURFACE override for
    // dedicated builders (they apply their own surface directives in buildSurfacesResponsesPrompt).
    const rt = roomType ? ROOM_TYPES[roomType] : null;
    if (rt?.roomFurnitureOverride) {
      trimmedFurniture = `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
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
