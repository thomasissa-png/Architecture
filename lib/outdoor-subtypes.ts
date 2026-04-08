/**
 * F3 — Outdoor subtype overrides.
 *
 * Each subtype provides additive overrides concatenated to the style prompts.
 * Unlike room types (F2) which REPLACE furniturePrompt, subtypes CONCATENATE
 * because outdoor furniture is always relevant — the subtype just adds constraints.
 *
 * See docs/ia/f3-outdoor-prompts.md section 2 for full rationale (Yann Duval + Lucas Moreau).
 */

export interface OutdoorSubtype {
  id: string;
  label: string;
  emoji: string;
  subtypeSurfaceOverride: string;
  subtypeFurnitureOverride: string;
  subtypeNegativeOverride: string;
}

export const OUTDOOR_SUBTYPES: Record<string, OutdoorSubtype> = {
  terrasse: {
    id: "terrasse",
    label: "Terrasse",
    emoji: "🏠",
    subtypeSurfaceOverride:
      "Attached terrace with hard-surface ground — preserve house facade and any steps or level changes.",
    subtypeFurnitureOverride: "",
    subtypeNegativeOverride: "lawn, grass, garden path",
  },

  balcon: {
    id: "balcon",
    label: "Balcon",
    emoji: "🌇",
    subtypeSurfaceOverride:
      "Enclosed balcony with existing guard rail — preserve all railings and balcony edges exactly.",
    subtypeFurnitureOverride:
      "Compact furniture only — bistro table 60cm max, folding chairs, no large garden sets, no sun loungers, no parasol wider than 180cm.",
    subtypeNegativeOverride: "large sofa, sun lounger, large parasol, garden set",
  },

  patio: {
    id: "patio",
    label: "Patio",
    emoji: "🏛️",
    subtypeSurfaceOverride:
      "Enclosed outdoor patio space, partially covered — preserve any existing surrounding walls, arches, columns, and overhead beams.",
    subtypeFurnitureOverride: "",
    subtypeNegativeOverride: "lawn, grass, open sky horizon",
  },

  jardin: {
    id: "jardin",
    label: "Jardin",
    emoji: "🌳",
    subtypeSurfaceOverride:
      "Garden with natural ground — preserve all existing trees, grass, hedges and background vegetation. Only update the ground surface in the foreground seating zone.",
    subtypeFurnitureOverride:
      "Place furniture in the foreground only — do not alter background vegetation or tree line.",
    subtypeNegativeOverride:
      "paved floor, concrete, wooden deck (unless already present)",
  },

  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    emoji: "🏙️",
    subtypeSurfaceOverride:
      "Rooftop terrace — preserve skyline, horizon line, parapet walls and guard rails exactly as in the input. Do not invent new railings or barriers.",
    subtypeFurnitureOverride: "",
    subtypeNegativeOverride:
      "lawn, garden path, trees (unless already present)",
  },
};

/** Ordered list for UI display */
export const OUTDOOR_SUBTYPE_LIST: OutdoorSubtype[] = [
  OUTDOOR_SUBTYPES.terrasse,
  OUTDOOR_SUBTYPES.balcon,
  OUTDOOR_SUBTYPES.patio,
  OUTDOOR_SUBTYPES.jardin,
  OUTDOOR_SUBTYPES.rooftop,
];

/**
 * Apply outdoor subtype overrides to the style prompts.
 * Subtypes CONCATENATE (additive) — they don't replace.
 * Returns enriched prompts + negative override for Flux.
 */
export function applyOutdoorSubtypeOverrides(
  surfacePrompt: string,
  furniturePrompt: string,
  subtypeId: string | null
): {
  effectiveSurfacePrompt: string;
  effectiveFurniturePrompt: string;
  subtypeNegativeOverride: string;
} {
  if (!subtypeId || !OUTDOOR_SUBTYPES[subtypeId]) {
    return {
      effectiveSurfacePrompt: surfacePrompt,
      effectiveFurniturePrompt: furniturePrompt,
      subtypeNegativeOverride: "",
    };
  }

  const sub = OUTDOOR_SUBTYPES[subtypeId];

  // Fix 9 (session 39, Finding A1) — jardin mode : the natural ground from the
  // jardin subtype REPLACES the style's hard floor (concrete, tiles, deck). The
  // style still contributes via its furniture prompt and material palette.
  // Without this replace, all 8 outdoor styles produced contradictory prompts
  // on jardin subtype (e.g. "concrete pavers 60x60cm" + "natural ground").
  if (subtypeId === "jardin") {
    return {
      effectiveSurfacePrompt: sub.subtypeSurfaceOverride,
      effectiveFurniturePrompt: sub.subtypeFurnitureOverride
        ? `${furniturePrompt}. ${sub.subtypeFurnitureOverride}`
        : furniturePrompt,
      subtypeNegativeOverride: sub.subtypeNegativeOverride || "",
    };
  }

  return {
    effectiveSurfacePrompt: sub.subtypeSurfaceOverride
      ? `${surfacePrompt}. ${sub.subtypeSurfaceOverride}`
      : surfacePrompt,
    effectiveFurniturePrompt: sub.subtypeFurnitureOverride
      ? `${furniturePrompt}. ${sub.subtypeFurnitureOverride}`
      : furniturePrompt,
    subtypeNegativeOverride: sub.subtypeNegativeOverride || "",
  };
}
