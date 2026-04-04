/**
 * Iteration prompt builders for F1 — re-pass 2 only.
 *
 * These are SEPARATE from the standard builders in route.ts.
 * The iteration always starts from the pass 1 result (surfaces),
 * never from a previous iteration output.
 */

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
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation. Keep the same camera height, tilt angle, and horizontal rotation.",
    "Keep the same number of windows and doors at the same positions and sizes. Walls without windows must remain solid. Room structure preserved — walls, floor, ceiling, paint, openings visually identical to input. Keep exact count and position of all openings. Each structural column or pillar must remain as a separate vertical element at its exact position.",
    "Keep all existing furniture and objects exactly as they are — do not remove, move, or resize anything unless explicitly requested below.",
    "This is a refinement. Room surfaces are final. Focus only on the changes below.",
    `Apply these changes:\n${modBlock}`,
    "Add only the items described above. Everything else stays untouched. Leave the rest of the floor empty.",
    "Distribute furniture across the full depth of the room. Place items in the foreground third and at least one anchor in the back third. Avoid clustering all furniture in one zone.",
    "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room. Match shadow hardness to the lighting type.",
    "Preserve existing light direction and color temperature from the input photo. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint or yellow cast.",
    // Room-type-specific fixture rules
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Add room-appropriate fixtures and freestanding accessories. Built-in cabinetry, vanity units, and countertops are expected for this room type."
      : meta.roomType === "wc"
      ? "Wall-hung toilet and wall-mounted hand basin expected. Other items (shelf, brush holder) freestanding only. Very small space — do not overcrowd."
      : meta.roomType === "laundry"
      ? "Washing machine and functional equipment expected. Storage cabinet, drying rack, laundry basket. No decorative objects, no luxury items."
      : meta.roomType === "cellar"
      ? "Functional storage only — shelving, storage boxes, utility light. Wine rack if space allows. No luxury furniture, no decorative objects."
      : meta.roomType === "entryway"
      ? "Small space — do not overcrowd. Freestanding items only: console, coat rack, small bench, runner rug."
      : meta.allowWallMounted
      ? "Wall-mounted items are allowed ONLY for the items explicitly requested by the user."
      : "ONLY add freestanding objects resting on the floor. Do not attach anything to walls.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, water heater (cylindrical tank), vents, thermostats, switches, boiler. Do not place furniture in front of radiators.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic interior photograph. No text, watermarks, or logos. ",
  ].join(" ");
}

// ─── Outdoor Iteration Builders ─────────────────────────────────────
// Same logic as indoor but:
// - No "walls, floor, ceiling" → "Ground surface and vertical structures are preserved"
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
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation. Keep the same camera height, tilt angle, and horizontal rotation.",
    "Ground surface and vertical structures are preserved — guard rails, walls, facades, gates, fences must remain visually identical to the input. Same colors, same textures, same geometry. Shadows from furniture are expected and natural.",
    "Keep all existing furniture, planters, lamps, and decorations exactly as they are — do not remove, move, or resize any existing item.",
    "This is a refinement of a previous outdoor generation. The ground surface and vertical structures in this photo are final. They must not change — not even subtle color shifts or texture changes.",
    "Focus only on adjusting the outdoor furniture and decoration as described below.",
    `Apply these changes:\n${modBlock}`,
    "Add only the items described above. Everything else in the photo — all existing furniture, planters, lamps — stays untouched.",
    "Do not add any other furniture, decoration, planter, lamp, or object not explicitly mentioned. Leave the rest of the space empty.",
    "Distribute furniture across the full depth of the space. Primary group foreground, secondary anchor further back. Avoid clustering everything in one zone.",
    "Place all objects naturally on the existing ground. Every piece of outdoor furniture must appear firmly grounded with visible contact shadows consistent with the existing natural light direction.",
    "Only add freestanding outdoor objects. Do not attach anything to walls, guard rails, or facades.",
    "Do not place opaque structures (screens, shelving, A-frames) directly in front of full-height windows or glass doors.",
    "Preserve existing vegetation in the background. Do not alter tree lines, hedges, or background plants.",
    "Open-air space — no ceiling. Sky preserved as-is.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic outdoor photograph. No text, watermarks, or logos. ",
  ].join(" ");
}

// ─── ADJUST mode prompts (edit furnished image, keep existing furniture) ──

export function buildAdjustResponsesPrompt(
  userComment: string,
  enrichedComment: string,
  meta: { roomType?: string | null; allowWallMounted?: boolean },
): string {
  return [
    "Make a small, precise edit to this photo. Edit the existing image, do not recreate it. Keep everything else unchanged.",
    "Keep all visible furniture, appliances, decorations, and fixtures at the same position, same size, same color, same texture.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation. Keep the same camera height, tilt angle, and horizontal rotation.",
    "Keep the same number of windows and doors at the same positions and sizes. Walls without windows must remain solid. Room structure preserved — walls, floor, ceiling, paint, windows, doors must remain visually identical to the input. Each structural column or pillar must remain as a separate vertical element at its exact position.",
    `Apply this single change only: ${enrichedComment}`,
    "That is the only modification. Keep everything else in the image as it is.",
    "Do not remove, move, resize, or recolor any existing item unless the user explicitly asks for it in the change above.",
    "Do not add any item not described in the change above. Do not rearrange furniture. Do not change wall color or texture. Do not change floor material or color.",
    "If removing an object, fill the vacated area with the surrounding floor or wall texture — do not place a new object in its place.",
    // Room-type-specific rules
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Preserve all built-in cabinetry, appliances (oven, stove, fridge, dishwasher), countertops, backsplash, and sink exactly as they appear."
      : meta.roomType === "wc"
      ? "Very small space — do not overcrowd."
      : "",
    "Every piece must appear firmly grounded on the floor with visible contact shadows. Match shadow hardness to the lighting type.",
    "Preserve existing light direction and color temperature from the input photo. Even if the style uses warm materials, the room's overall lighting temperature must match the input. No warm tint or yellow cast.",
    "Preserve all wall-mounted fixed equipment: radiators, heaters, water heater (cylindrical tank), vents, thermostats, switches, boiler.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic interior photograph. No text, watermarks, or logos. ",
  ].filter(Boolean).join(" ");
}

export function buildAdjustOutdoorResponsesPrompt(
  userComment: string,
  enrichedComment: string,
): string {
  return [
    "Make a small, precise edit to this photo. Edit the existing image, do not recreate it. Keep everything else unchanged.",
    "Keep all visible furniture, planters, lamps, and decorations at the same position, same size, same color, same texture.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation. Keep the same camera height, tilt angle, and horizontal rotation.",
    "Ground surface and vertical structures are preserved — guard rails, walls, facades, gates, fences must remain visually identical.",
    `Apply this single change only: ${enrichedComment}`,
    "That is the only modification. Keep everything else in the image as it is.",
    "Do not remove, move, resize, or recolor any existing item unless the user explicitly asks for it in the change above.",
    "Do not add any item not described in the change above. Do not rearrange furniture.",
    "If removing an object, fill the vacated area with the surrounding ground texture — do not place a new object in its place.",
    "Every piece must appear firmly grounded on the ground with visible contact shadows consistent with the existing natural light direction.",
    "Preserve existing vegetation in the background. Do not alter tree lines, hedges, or background plants.",
    "Open-air space — no ceiling. Sky preserved as-is.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic outdoor photograph. No text, watermarks, or logos. ",
  ].join(" ");
}

export { PASS1_TTL_MS };
