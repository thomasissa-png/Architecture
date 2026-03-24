/**
 * F3 — Outdoor style definitions for prompt enrichment.
 *
 * Each outdoor style provides:
 * - surfacePrompt: ground surface, guard rails, facades (pass 1)
 * - furniturePrompt: outdoor furniture, planters, lighting (pass 2)
 *
 * RULES (from CLAUDE.md):
 * - NO lighting directives in style prompts
 * - NO curtains/drapes/windows mentions
 * - NO ceiling/luminaire directives (outdoor = open sky)
 * - Prompts short (~8 sentences max)
 *
 * See docs/ia/f3-outdoor-prompts.md for full rationale (Yann Duval + Lucas Moreau).
 */

export interface OutdoorStyle {
  id: string;
  label: string;
  emoji: string;
  description: string;
  surfacePrompt: string;
  furniturePrompt: string;
}

export const OUTDOOR_STYLES: Record<string, OutdoorStyle> = {
  contemporain_outdoor: {
    id: "contemporain_outdoor",
    label: "Contemporain Outdoor",
    emoji: "🏢",
    description: "Dalles béton gris, mobilier modulaire anthracite",
    surfacePrompt:
      "Contemporary outdoor: large-format smooth grey concrete pavers 60x60cm with narrow joints, preserve all existing guard rails and exterior walls unchanged, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Contemporary outdoor furniture: modular L-shaped outdoor sofa 240cm in charcoal weather-resistant fabric with aluminium frame, rectangular tempered glass coffee table 100x60cm on black steel legs, two LED ground lanterns 30cm tall flanking the seating area, single tall architectural planter 80cm with clipped boxwood sphere, neutral outdoor cushions in graphite and off-white. Clean geometric layout, no clutter.",
  },

  mediterraneen_outdoor: {
    id: "mediterraneen_outdoor",
    label: "Méditerranéen",
    emoji: "🫒",
    description: "Tomettes terre cuite, table fer forgé, oliviers",
    surfacePrompt:
      "Mediterranean outdoor: natural stone or warm terracotta floor tiles with aged patina, preserve all existing walls facades and guard rails unchanged, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Mediterranean outdoor furniture: round wrought-iron table 120cm in antique white with matching 4 bistro chairs, two large terracotta pots 50cm with olive trees, ceramic lanterns with candles on the table, linen table runner in natural ecru, small herb pots (rosemary, lavender) along the wall edge. Warm convivial atmosphere with natural materials.",
  },

  boheme_garden: {
    id: "boheme_garden",
    label: "Bohème Garden",
    emoji: "🌿",
    description: "Dalles irrégulières, poufs, macrame, guirlandes",
    surfacePrompt:
      "Bohemian garden outdoor: reclaimed irregular stone pavers with white gravel borders, preserve all existing vegetation walls and fences unchanged, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Bohemian garden furniture: two round waterproof floor poufs 50cm in terracotta and mustard, low pallet-style coffee table 90x60cm with weathered wood finish, outdoor jute rug 160x230cm, three hanging macrame plant holders on a freestanding wooden rack 180cm tall, potted tropical plants (monstera, fern) in woven baskets, battery-powered string lights draped loosely on the rack. Relaxed layered eclectic atmosphere.",
  },

  minimaliste_urbain: {
    id: "minimaliste_urbain",
    label: "Minimaliste Urbain",
    emoji: "⬜",
    description: "Béton poli, bains de soleil teck, herbe ornementale",
    surfacePrompt:
      "Minimalist urban outdoor: smooth polished concrete floor with millimetric joints in light grey, preserve all existing guard rails walls and facades unchanged, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Minimalist urban outdoor furniture: two teak sun loungers 190cm with clean straight lines and light grey cushions, low rectangular concrete-fibre coffee table 80x40cm, one tall concrete planter 90cm with single ornamental grass (Miscanthus), no decorative objects, no textiles beyond cushions. Strict geometric arrangement, generous empty floor space.",
  },

  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    emoji: "🌆",
    description: "Lames IPE argentées, banquette, parasol, vue ville",
    surfacePrompt:
      "Rooftop outdoor: IPE wood deck planks silver-grey patina 140mm wide, preserve existing parapet walls guard rails and skyline exactly as in the input, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Rooftop furniture: modular weatherproof banquette 200cm in charcoal grey with deep seat cushions, large parasol 3m deported on weighted base in matte black, rectangular dining table 160cm in powder-coated dark steel with 4 stacking outdoor chairs, two floor lanterns 40cm with LED candles, single potted bamboo 150cm in dark grey fibrecite planter. Urban lounge atmosphere, preserve city view.",
  },

  cosy_balcon: {
    id: "cosy_balcon",
    label: "Cosy Balcon",
    emoji: "🌸",
    description: "Bois composite chaud, table bistrot, guirlande LED",
    surfacePrompt:
      "Cosy balcony outdoor: warm wood composite deck planks 120mm in honey tone, preserve existing guard rails and balcony structure unchanged, no ceiling — open sky preserved as-is",
    furniturePrompt:
      "Cosy balcony furniture — COMPACT items only: round zinc bistro table 60cm, two folding metal chairs in matte black with small seat cushions in cream, one tall narrow planter 70cm with trailing ivy or string of pearls, battery LED string lights draped along the guard rail (not attached to wall), small ceramic lantern with candle on the table. Intimate minimal setup suited to a small balcony.",
  },
};

/** Ordered list for UI display */
export const OUTDOOR_STYLE_LIST: OutdoorStyle[] = [
  OUTDOOR_STYLES.contemporain_outdoor,
  OUTDOOR_STYLES.mediterraneen_outdoor,
  OUTDOOR_STYLES.boheme_garden,
  OUTDOOR_STYLES.minimaliste_urbain,
  OUTDOOR_STYLES.rooftop,
  OUTDOOR_STYLES.cosy_balcon,
];
