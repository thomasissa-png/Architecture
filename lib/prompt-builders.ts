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

// ── Pass 1: Surface finishing ────────────────────────────────────────
export function buildSurfacesResponsesPrompt(surfacePrompt: string): string {
  return [
    "Edit this photo of a room.",
    `Apply this surface finish: ${surfacePrompt}.`,
    "Refinish the floor, repaint or replaster walls, update the ceiling light fixture to match the style description above.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration, no objects.",
    "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "Preserve the existing lighting conditions, light direction, shadow angles, color temperature, and exposure exactly as in the input.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep depth of field, sharp focus throughout. No text, watermarks, or logos in the output.",
  ].join(" ");
}

export function buildSurfacesFluxPrompt(surfacePrompt: string): string {
  return [
    `${surfacePrompt}, finished empty room interior.`,
    "Refinished floor, repainted walls, updated ceiling light fixture.",
    "Completely empty room — no furniture, no rugs, no textiles, no objects.",
    "Exact same number of windows and doors as the original. Same room geometry, same proportions.",
    "Preserve existing lighting conditions and camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────
export function buildFurnitureResponsesPrompt(furniturePrompt: string): string {
  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Distribute furniture across the FULL DEPTH and WIDTH of the room. If the room is deep or has multiple zones (e.g. under a mezzanine, an alcove, a back area), place a primary furniture group in the foreground AND a secondary group further back (reading nook, small desk, console table, side chair). If the room is also wide, add a lateral anchor (accent chair, floor lamp, or side table) on the opposite side to balance the composition. Do not leave the back or sides of the room empty.",
    "Place all objects naturally on the existing floor. Every piece of furniture — including those in the back of the room — must have correct perspective, scale, and cast realistic shadows consistent with the existing light direction and intensity.",
    "ONLY add freestanding objects that rest on the floor or sit on existing surfaces. Do NOT attach anything to walls. No wall-mounted art, no built-in shelving, no curtains.",
    "Room structure is LOCKED: every wall, window, door, ceiling, and floor surface must remain pixel-identical to the input. No new openings, no color shift on any surface.",
    "If the input has zero windows, the output must have zero windows.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, photo-realistic interior photograph. No text, watermarks, or logos in the output.",
  ].join(" ");
}

export function buildFurnitureFluxPrompt(furniturePrompt: string): string {
  return [
    `${furniturePrompt}, placed naturally across the full depth of this finished room interior.`,
    "Distribute furniture in depth and width: primary group in foreground, secondary group in the back if space allows, lateral anchor (accent chair, floor lamp) on the opposite side if room is wide. Do not leave rear or side areas empty.",
    "Freestanding furniture only. No wall-mounted objects, no built-in shelving, no curtains.",
    "Every wall, floor, and ceiling surface identical to input — same colors, same textures, no new openings.",
    "Same room geometry, same proportions, same camera angle, same lighting conditions.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.",
  ].join(" ");
}

// Flux Depth Pro negative prompt — prevents common artifacts
export const FLUX_NEGATIVE_PROMPT =
  "distorted perspective, fisheye, stretched walls, shallow depth of field, bokeh, cartoon, illustration, 3D render, watermark, text, blurry, overexposed windows, extra windows, extra doors, floating furniture, dangling cables, junction box, unfinished floor";
