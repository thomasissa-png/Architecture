/**
 * Iteration prompt builders for F1 — re-pass 2 only.
 *
 * These are SEPARATE from the standard builders in route.ts.
 * The iteration always starts from the pass 1 result (surfaces),
 * never from a previous iteration output.
 */

const MAX_ITERATIONS = 3;
const PASS1_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── OpenAI Responses API — Iteration furniture prompt ──────────────
export function buildIterationFurnitureResponsesPrompt(
  _furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; roomType?: string | null; allowWallMounted?: boolean },
): string {
  const modBlock = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `- ${label}: ${m}`;
    })
    .join("\n");

  return [
    "IMPORTANT: All furniture, decoration, and objects currently visible in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    "This is a REFINEMENT of a previous generation. The room surfaces in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts, lighting changes, or texture smoothing.",
    "Focus ONLY on adjusting the furniture and decoration as described below.",
    `APPLY THESE CHANGES:\n${modBlock}`,
    "Add ONLY the items described above. Everything else in the photo — all existing furniture, rugs, plants, lamps — stays untouched.",
    // Iterations are ALWAYS exclusive: add ONLY what the user asked for.
    // The accumulated modifications describe everything the user wants.
    "Do NOT add any other furniture, decoration, rug, lamp, plant, or object not explicitly mentioned. The room should contain ONLY what the user asked for — leave the rest of the floor empty.",
    "If the room is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.",
    "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room. Match shadow hardness to the lighting type.",
    "Preserve existing light direction and color temperature from the input photo. No warm tint or yellow cast.",
    // Room-type-specific fixture rules
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Add room-appropriate fixtures and freestanding accessories. Built-in cabinetry, vanity units, and countertops are expected for this room type. No curtains."
      : meta.roomType === "wc"
      ? "Wall-hung toilet and wall-mounted hand basin expected. Other items (shelf, brush holder) freestanding only. Very small space — do not overcrowd. No curtains."
      : meta.roomType === "laundry"
      ? "Washing machine and functional equipment expected. Storage cabinet, drying rack, laundry basket. No decorative objects, no luxury items. No curtains."
      : meta.roomType === "cellar"
      ? "Functional storage only — shelving, storage boxes, utility light. Wine rack if space allows. No luxury furniture, no decorative objects. No curtains."
      : meta.roomType === "entryway"
      ? "Small space — do not overcrowd. Freestanding items only: console, coat rack, small bench, runner rug. No wall-mounted art, no curtains."
      : meta.allowWallMounted
      ? "Wall-mounted items are allowed ONLY for the items explicitly requested by the user. No curtains."
      : "ONLY add freestanding objects. Do NOT attach anything to walls. No wall-mounted art, no framed paintings, no prints, no mirrors, no built-in shelving, no curtains.",
    "Room structure is LOCKED — walls, floor, ceiling, paint, windows, doors must remain visually identical to the input. Same colors, same textures, same geometry. Shadows from furniture are expected and natural.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, vents, thermostats, switches. Do not place furniture in front of radiators.",
    "If the input has zero windows, the output must have zero windows.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic interior photograph. No text, watermarks, or logos.",
  ].join(" ");
}

// ─── Flux Depth Pro — Iteration furniture prompt ────────────────────
export function buildIterationFurnitureFluxPrompt(
  _furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; roomType?: string | null; allowWallMounted?: boolean },
): string {
  // Flux: modifications FIRST (first tokens = most weight), then condensed style
  const modSummary = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `${label}: ${m}`;
    })
    .join("; ");

  return [
    "IMPORTANT: All existing furniture and objects in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    `CHANGES: ${modSummary}.`,
    "Add ONLY the items described above. Everything else — all existing furniture, rugs, plants, lamps — stays untouched.",
    // Iterations are ALWAYS exclusive: add ONLY what the user asked for.
    "Do NOT add any other furniture, decoration, rug, lamp, plant, or object not mentioned. Leave the rest of the floor empty.",
    // Room-type-specific fixture rules
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Room-appropriate fixtures and accessories. Built-in cabinetry, vanity, countertops expected. No curtains."
      : meta.roomType === "wc"
      ? "Wall-hung toilet and hand basin expected. Very small space, do not overcrowd. No curtains."
      : meta.roomType === "laundry"
      ? "Washing machine and functional equipment expected. No decorative items. No curtains."
      : meta.roomType === "cellar"
      ? "Functional storage only — shelving, boxes, utility light. No luxury furniture. No curtains."
      : meta.roomType === "entryway"
      ? "Small space — console, coat rack, bench, runner. Freestanding only, no curtains."
      : meta.allowWallMounted
      ? "Wall-mounted items allowed ONLY for items explicitly requested. No curtains."
      : "Freestanding furniture only. No wall-mounted objects, no framed paintings, no prints, no mirrors, no built-in shelving, no curtains.",
    "If the room is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.",
    "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture in the back of the room.",
    "Every wall, floor, and ceiling surface visually identical to input — same colors, textures. Room structure LOCKED. Shadows from furniture are natural.",
    "Keep all wall-mounted equipment: radiators, heaters, vents, switches visible. Do not place furniture in front of radiators.",
    "Preserve existing light direction and color temperature. Same camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// Flux negative prompt enriched for iterations
export const FLUX_ITERATION_NEGATIVE_PROMPT =
  "distorted perspective, fisheye, stretched walls, shallow depth of field, bokeh, cartoon, illustration, 3D render, CGI, plastic, watermark, text, blurry, overexposed windows, extra windows, extra doors, floating furniture, dangling cables, junction box, unfinished floor, overly clean, flat lighting, color grading, warm color shift, cool color shift, mismatched furniture style, inconsistent color palette";

// ─── Outdoor Iteration Builders ─────────────────────────────────────
// Same logic as indoor but:
// - No "walls, floor, ceiling" → "Ground surface and vertical structures are LOCKED"
// - No ceiling/luminaire directives
// - No indoor-specific rules (radiators, zero windows check)

export function buildIterationOutdoorFurnitureResponsesPrompt(
  _furniturePrompt: string,
  modifications: string[],
): string {
  const modBlock = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `- ${label}: ${m}`;
    })
    .join("\n");

  return [
    "IMPORTANT: All furniture, decoration, and objects currently visible in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    "This is a REFINEMENT of a previous outdoor generation. The ground surface and vertical structures in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts or texture changes.",
    "Focus ONLY on adjusting the outdoor furniture and decoration as described below.",
    `APPLY THESE CHANGES:\n${modBlock}`,
    "Add ONLY the items described above. Everything else in the photo — all existing furniture, planters, lamps — stays untouched.",
    // Iterations are ALWAYS exclusive: add ONLY what the user asked for.
    "Do NOT add any other furniture, decoration, planter, lamp, or object not explicitly mentioned. Leave the rest of the space empty.",
    "If the space is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.",
    "Place all objects naturally on the existing ground. Every piece of outdoor furniture must appear firmly grounded with visible contact shadows consistent with the existing natural light direction.",
    "ONLY add freestanding outdoor objects. Do NOT attach anything to walls, guard rails, or facades.",
    "Do not place opaque structures (screens, shelving, A-frames) directly in front of full-height windows or glass doors.",
    "Ground surface and vertical structures are LOCKED — guard rails, walls, facades, gates, fences must remain visually identical to the input. Same colors, same textures, same geometry. Shadows from furniture are expected and natural.",
    "Preserve existing vegetation in the background. Do not alter tree lines, hedges, or background plants.",
    "Open-air space — no ceiling. Sky preserved as-is.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ].join(" ");
}

export function buildIterationOutdoorFurnitureFluxPrompt(
  _furniturePrompt: string,
  modifications: string[],
): string {
  const modSummary = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `${label}: ${m}`;
    })
    .join("; ");

  return [
    "IMPORTANT: All existing outdoor furniture and objects in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    `CHANGES: ${modSummary}.`,
    "Add ONLY the items described above. Everything else — all existing furniture, planters, lamps — stays untouched.",
    // Iterations are ALWAYS exclusive: add ONLY what the user asked for.
    "Do NOT add any other furniture, decoration, planter, lamp, or object not mentioned. Leave the rest of the space empty.",
    "Freestanding outdoor furniture only. No wall-mounted objects, no objects attached to guard rails.",
    "No opaque structures (screens, shelving, A-frames) in front of full-height windows or glass doors.",
    "If the space is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.",
    "Every piece must appear firmly grounded on the ground with visible contact shadows consistent with the existing natural light direction.",
    "Ground surface and vertical structures LOCKED — guard rails, walls, facades same colors, textures, geometry. Shadows from furniture are natural.",
    "Preserve background vegetation. Open-air space, no ceiling, sky as-is.",
    "Preserve exact lighting from input — same shadow hardness, direction, color temperature.",
    "Same camera angle, same proportions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// ─── ADJUST mode prompts (edit furnished image, keep existing furniture) ──

export function buildAdjustResponsesPrompt(
  userComment: string,
  enrichedComment: string,
  meta: { roomType?: string | null; allowWallMounted?: boolean },
): string {
  return [
    "IMPORTANT: All furniture, decoration, and objects currently visible in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    "Edit this furnished room photo. Keep ALL existing furniture, decorations, and room surfaces EXACTLY as they are.",
    `APPLY THIS CHANGE ONLY: ${enrichedComment}`,
    "Add ONLY the items described above. Everything else in the photo — all existing furniture, rugs, plants, lamps — stays untouched.",
    "Do NOT remove, move, or modify any existing item unless the user explicitly asks for it.",
    "The room must look identical to the input except for the requested change.",
    // Room-type-specific rules
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Built-in cabinetry, vanity units, and countertops are expected for this room type."
      : meta.roomType === "wc"
      ? "Very small space — do not overcrowd."
      : "",
    "Every piece must appear firmly grounded on the floor with visible contact shadows. Match shadow hardness to the lighting type.",
    "Preserve existing light direction and color temperature from the input photo. No warm tint or yellow cast.",
    "Room structure is LOCKED — walls, floor, ceiling, paint, windows, doors must remain visually identical to the input.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, vents, thermostats, switches.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic interior photograph. No text, watermarks, or logos.",
  ].filter(Boolean).join(" ");
}

export function buildAdjustFluxPrompt(
  userComment: string,
  enrichedComment: string,
): string {
  return [
    "IMPORTANT: All existing furniture and objects in this photo must REMAIN exactly as they are. Do not remove, move, or resize any existing item.",
    `CHANGE: ${enrichedComment}.`,
    "Add ONLY the items described above. Everything else stays untouched.",
    "Keep ALL existing furniture and decoration exactly as-is except for this change.",
    "Every piece must appear firmly grounded on the floor with visible contact shadows.",
    "Room surfaces, camera angle, and lighting unchanged.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

export function buildAdjustOutdoorResponsesPrompt(
  userComment: string,
  enrichedComment: string,
): string {
  return [
    "Edit this furnished outdoor space photo. Keep ALL existing furniture, decorations, and ground surfaces EXACTLY as they are.",
    `APPLY THIS CHANGE ONLY: ${enrichedComment}`,
    "Do NOT remove, move, or modify any existing item unless the user explicitly asks for it.",
    "The space must look identical to the input except for the requested change.",
    "Every piece must appear firmly grounded on the ground with visible contact shadows consistent with the existing natural light direction.",
    "Ground surface and vertical structures are LOCKED — guard rails, walls, facades, gates, fences must remain visually identical.",
    "Preserve existing vegetation in the background.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ].join(" ");
}

export function buildAdjustOutdoorFluxPrompt(
  userComment: string,
  enrichedComment: string,
): string {
  return [
    `CHANGE: ${enrichedComment}.`,
    "Keep ALL existing outdoor furniture and decoration exactly as-is except for this change.",
    "Every piece must appear firmly grounded on the ground with visible contact shadows.",
    "Ground surfaces, vegetation, camera angle, and lighting unchanged.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

export { MAX_ITERATIONS, PASS1_TTL_MS };
