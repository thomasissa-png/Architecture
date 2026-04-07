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
    // v51: P0-5 full CAMERA_PRESERVATION + P0-4 anti-fenetre + P1-4 no curtains + P1-5 anti-warm
    "Edit this photo. Keep all surfaces (walls, floor, ceiling) unchanged. Same camera angle, height, tilt, and field of view. The frame edges must match the input exactly — walls cut off at the edge must be cut off at the same position. Room dimensions are FIXED — do not stretch, widen, or compress the space.",
    "Count the windows and doors visible in the input photo. The output must have the EXACT same count, at the same positions, same sizes. Walls without windows must remain solid.",
    "Before editing, note every visible object in this photo. All of them stay at their current position, size, and color — except changes explicitly requested below.",
    "This is a refinement. Room surfaces are final. Existing furniture keeps its exact color and texture. Focus only on the changes below.",
    `Apply these changes:\n${modBlock}`,
    "Add only the described items. Everything else stays untouched. No curtains, no drapes.",
    "No new architectural elements (arches, niches, columns, coffers, windows, doors) unless already in the input.",
    "Distribute furniture across the full depth. Furniture must have contact shadows on the floor.",
    "Keep existing lighting direction and color temperature. Do not add any warm tint or yellow cast.",
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Built-in cabinetry and countertops expected for this room type."
      : meta.roomType === "wc"
      ? "Small space — keep it simple."
      : meta.roomType === "laundry"
      ? "Washing machine and functional storage expected."
      : meta.roomType === "cellar"
      ? "Functional storage only."
      : meta.roomType === "entryway"
      ? "Small space — console, coat rack, bench, runner rug."
      : meta.allowWallMounted
      ? "Wall-mounted items allowed for the items requested."
      : "Freestanding objects only.",
    "Count all fixed wall-mounted equipment in the input (radiators, convectors, heaters, water heaters, vents, thermostats, switches, electrical panels). The output MUST have the SAME count at the SAME positions — if the input shows 1 radiator below a window, the output MUST show 1 radiator below that window. Do not place furniture in front of radiators or convectors.",
    "DSLR wide-angle, deep DOF, sharp focus. Photo-realistic interior. No text or watermarks.",
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
    // v51: P0-5 full camera preservation + outdoor anti-fenetre
    "Edit this outdoor photo. Keep all ground surfaces, structures, fences, sky unchanged. Same camera angle, height, tilt, and field of view. The frame edges must match the input exactly. Space dimensions are FIXED — do not stretch, widen, or compress the area. The distance between walls and fences must be IDENTICAL to the input.",
    "Count all openings (doors, windows, gates, archways) visible in the input. The output must have the EXACT same count at the same positions. Do not add or remove any opening.",
    "Before editing, note every visible object in this photo. All of them stay at their current position, size, and color — except changes explicitly requested below.",
    `Apply these changes:\n${modBlock}`,
    "Add only the described items. Everything else stays untouched.",
    "Distribute furniture across the full depth. Freestanding objects only.",
    "Keep existing vegetation and background plants. Sky stays as-is. Same lighting.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus. Clean digital rendering. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ].join(" ");
}

// ─── ADJUST mode prompts (edit furnished image, keep existing furniture) ──

export function buildAdjustResponsesPrompt(
  userComment: string,
  enrichedComment: string,
  meta: { roomType?: string | null; allowWallMounted?: boolean },
): string {
  return [
    // v51: P0-5 full camera preservation + P0-4 anti-fenetre + P1-4 no curtains + P1-5 anti-warm
    "Edit this photo. Make a small, precise change. Keep everything else unchanged. Same camera angle, height, tilt, and field of view. The frame edges must match the input exactly — walls cut off at the edge must be cut off at the same position.",
    "Count the windows and doors visible in the input photo. The output must have the EXACT same count, at the same positions, same sizes. Walls without windows must remain solid.",
    "Before editing, mentally list every visible object. All must stay at same position, same size, same color — except the one change described below.",
    `The only change to make: ${enrichedComment}`,
    "Keep all existing furniture, appliances, and decorations at their current positions, sizes, and colors. Keep walls, floor, ceiling, windows, and doors as they are. Room dimensions are FIXED — do not stretch, widen, or compress the space. After editing, verify each object is still at its original position except the one modified.",
    meta.roomType === "kitchen" || meta.roomType === "bathroom"
      ? "Keep all built-in cabinetry, appliances, countertops, and sink as they appear."
      : meta.roomType === "wc"
      ? "Small space — keep it simple."
      : "",
    "If removing an object, fill the area with the surrounding floor or wall texture.",
    "No curtains, no drapes. No new architectural elements (arches, niches, columns, coffers, windows, doors) unless already in the input.",
    // v58 (Sprint audit v57 P0-2) — clause conditionnelle pour resoudre la contradiction
    // entre SURGICAL EDIT et EQUIPMENT_PRESERVATION quand l'utilisateur demande
    // explicitement le retrait d'un equipement liste (ex: "enleve le ballon d'eau chaude").
    // Avant : la directive disait "MUST preserve" sans exception, le modele etait
    // pris entre 2 instructions contradictoires. Apres : la preservation s'applique
    // SAUF si l'enrichedComment ci-dessus demande explicitement le retrait.
    "Count all fixed wall-mounted equipment in the input (radiators, convectors, heaters, water heaters, boiler, vents, thermostats, switches, electrical panels). The output MUST have the SAME count at the SAME positions — UNLESS the requested change above explicitly asks to remove or relocate one of these items, in which case apply the requested removal and keep all the others at their original positions.",
    "Keep existing lighting direction and color temperature. Do not add any warm tint or yellow cast. Furniture must have contact shadows on the floor.",
    "DSLR wide-angle, deep DOF, sharp focus. Photo-realistic interior. No text or watermarks.",
  ].filter(Boolean).join(" ");
}

export function buildAdjustOutdoorResponsesPrompt(
  userComment: string,
  enrichedComment: string,
): string {
  return [
    // v51: P0-5 full camera preservation + outdoor anti-fenetre
    "Edit this outdoor photo. Make a small, precise change. Keep everything else unchanged. Same camera angle, height, tilt, and field of view. The frame edges must match the input exactly.",
    "Count all openings (doors, windows, gates, archways) visible in the input. The output must have the EXACT same count at the same positions. Do not add or remove any opening.",
    "Before editing, mentally list every visible object. All must stay at same position, same size, same color — except the one change described below.",
    `The only change to make: ${enrichedComment}`,
    "Keep all existing furniture, planters, lamps, and decorations at their current positions, sizes, and colors. Keep ground surface, walls, fences, and structures as they are. Space dimensions are FIXED — do not stretch, widen, or compress the area. The distance between walls and fences must be IDENTICAL to the input. After editing, verify each object is still at its original position except the one modified.",
    "If removing an object, fill the area with the surrounding ground texture.",
    "Keep existing vegetation and background plants. Open-air space — sky stays as-is.",
    "Keep existing lighting direction and shadows. Furniture must have contact shadows on the ground.",
    "DSLR wide-angle, deep DOF, sharp focus. Photo-realistic outdoor. No text or watermarks.",
  ].join(" ");
}

export { PASS1_TTL_MS };
