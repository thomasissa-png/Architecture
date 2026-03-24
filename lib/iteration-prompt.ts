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
  furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; roomType?: string | null }
): string {
  const modBlock = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `- ${label}: ${m}`;
    })
    .join("\n");

  return [
    "This is a REFINEMENT of a previous generation. The room surfaces in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts, lighting changes, or texture smoothing.",
    "Focus ONLY on adjusting the furniture and decoration as described below.",
    `APPLY THESE CHANGES:\n${modBlock}`,
    `BASE STYLE (keep everything not contradicted by the changes above): ${furniturePrompt}.`,
    "Distribute furniture across the FULL DEPTH and WIDTH of the room. If the room is deep or has multiple zones, place a primary group in the foreground AND a secondary group further back. If the room is also wide, add a lateral anchor on the opposite side.",
    "Place all objects naturally on the existing floor. Every piece of furniture must have correct perspective, scale, and cast realistic shadows consistent with the existing light direction. Match shadow hardness to the lighting type.",
    "If the ceiling appears very high or the room is very large, scale up furniture proportionally.",
    "Respect the furniture density implied by the style. If minimalist, leave large empty floor areas. If the room is small, reduce accent pieces.",
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Add room-appropriate fixtures and freestanding accessories. Built-in cabinetry, vanity units, and countertops are expected for this room type. No curtains."
      : "ONLY add freestanding objects. Do NOT attach anything to walls. No wall-mounted art, no built-in shelving, no curtains.",
    "Room structure is LOCKED — walls, floor, ceiling, paint, windows, doors must remain visually identical to the input. Same colors, same textures, same geometry. Shadows from furniture are expected and natural.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, vents, thermostats, switches. Do not place furniture in front of radiators.",
    "If the input has zero windows, the output must have zero windows.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic interior photograph. No text, watermarks, or logos.",
  ].join(" ");
}

// ─── Flux Depth Pro — Iteration furniture prompt ────────────────────
export function buildIterationFurnitureFluxPrompt(
  furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; roomType?: string | null }
): string {
  // Flux: modifications FIRST (first tokens = most weight), then condensed style
  const modSummary = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `${label}: ${m}`;
    })
    .join("; ");

  return [
    `CHANGES: ${modSummary}.`,
    `BASE STYLE (keep uncontradicted items): ${furniturePrompt}.`,
    "Placed naturally across the full depth of this finished room. Primary group foreground, secondary group in back if space allows, lateral anchor if room is wide.",
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Room-appropriate fixtures and accessories. Built-in cabinetry, vanity, countertops expected. No curtains."
      : "Freestanding furniture only. No wall-mounted objects, no built-in shelving, no curtains.",
    "Every wall, floor, and ceiling surface visually identical to input — same colors, textures. Room structure LOCKED. Shadows from furniture are natural.",
    "Keep all wall-mounted equipment: radiators, heaters, vents, switches visible. Do not place furniture in front of radiators.",
    "Same room geometry, same camera angle, same lighting conditions.",
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
  furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; isOutdoor?: boolean }
): string {
  const modBlock = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `- ${label}: ${m}`;
    })
    .join("\n");

  return [
    "This is a REFINEMENT of a previous outdoor generation. The ground surface and vertical structures in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts or texture changes.",
    "Focus ONLY on adjusting the outdoor furniture and decoration as described below.",
    `APPLY THESE CHANGES:\n${modBlock}`,
    `BASE STYLE (keep everything not contradicted by the changes above): ${furniturePrompt}.`,
    "Distribute furniture naturally across the available floor space. If the space is large, place a primary seating group and a secondary accent further back.",
    "Place all objects naturally on the existing ground. Every piece of outdoor furniture must have correct perspective, scale, and cast realistic shadows consistent with the existing natural light direction.",
    "ONLY add freestanding outdoor objects. Do NOT attach anything to walls, guard rails, or facades.",
    "Ground surface and vertical structures are LOCKED — guard rails, walls, facades, gates, fences must remain visually identical to the input. Same colors, same textures, same geometry. Shadows from furniture are expected and natural.",
    "Preserve existing vegetation in the background. Do not alter tree lines, hedges, or background plants.",
    "Open-air space — no ceiling. Sky preserved as-is.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ].join(" ");
}

export function buildIterationOutdoorFurnitureFluxPrompt(
  furniturePrompt: string,
  modifications: string[],
  meta: { width?: number; height?: number; isOutdoor?: boolean }
): string {
  const modSummary = modifications
    .map((m, i) => {
      const label = i === modifications.length - 1 ? `v${i + 2} (current)` : `v${i + 2}`;
      return `${label}: ${m}`;
    })
    .join("; ");

  return [
    `CHANGES: ${modSummary}.`,
    `BASE STYLE (keep uncontradicted items): ${furniturePrompt}.`,
    "Placed naturally across the available floor space. Primary seating group in foreground, secondary accent further back if space allows.",
    "Freestanding outdoor furniture only. No wall-mounted objects, no objects attached to guard rails.",
    "Ground surface and vertical structures LOCKED — guard rails, walls, facades same colors, textures, geometry. Shadows from furniture are natural.",
    "Preserve background vegetation. Open-air space, no ceiling, sky as-is.",
    "Same camera angle, same lighting conditions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

export { MAX_ITERATIONS, PASS1_TTL_MS };
