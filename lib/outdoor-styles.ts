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
 * - All textiles outdoor-rated (Sunbrella-type / waterproof polyester)
 * - All vegetation outdoor-appropriate (no monstera, no string of pearls, no fiddle-leaf fig)
 * - Lighting fixtures present but UNLIT in daylight scenes
 *
 * Audit Camille Verdier — 25 mars 2026 — corrections applied.
 * See docs/reviews/outdoor-prompt-audit-camille.md for full rationale.
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
    emoji: "\uD83C\uDFE2",
    description: "Dalles b\u00E9ton gris, mobilier modulaire anthracite",
    surfacePrompt:
      "Contemporary outdoor: large-format grey concrete pavers 60x60cm laid in linear bond with 4mm grey grouted joints, narrow stainless steel expansion joint every 3m, preserve all existing guard rails and exterior walls unchanged, open sky preserved as-is.",
    furniturePrompt:
      "Contemporary outdoor furniture: modular low-profile L-shaped outdoor sofa 240cm in graphite grey Sunbrella-type fabric with powder-coated matt black aluminium frame, rectangular concrete-fibre side table 90x45cm, two cast-concrete rectangular planters 100x30cm with single Stipa tenuissima grass clump each, one tall fibrecite planter 70cm with Calamagrostis Karl Foerster 120cm tall, four stainless steel recessed ground uplights 12cm diameter flush with floor surface (unlit daytime). No clutter, generous empty floor space between furniture and guard rail.",
  },

  mediterraneen_outdoor: {
    id: "mediterraneen_outdoor",
    label: "M\u00E9diterran\u00E9en",
    emoji: "\uD83E\uDED2",
    description: "Tomettes terre cuite, table fer forg\u00E9, oliviers",
    surfacePrompt:
      "Mediterranean outdoor: reclaimed Proven\u00E7al terracotta tiles 30x30cm with natural irregular patina and slightly raised grout joints in light ochre mortar, low dry-stone rendered wall coping in warm limestone, preserve all existing walls facades and guard rails unchanged, open sky preserved as-is.",
    furniturePrompt:
      "Mediterranean outdoor furniture: round wrought-iron table 120cm in aged antique white finish with 4 matching bistro armchairs with woven rush seats, two glazed terracotta planters 90cm diameter with standard-trained olive trees 150cm overall height, three smaller terracotta pots 25-30cm with rosemary and lavender along the wall base, ceramic lanterns 25cm tall on table surface with unlit pillar candles, linen table runner 40x120cm in natural ecru with fringe edge. Warm convivial atmosphere.",
  },

  boheme_garden: {
    id: "boheme_garden",
    label: "Boh\u00E8me Garden",
    emoji: "\uD83C\uDF3F",
    description: "Dalles irr\u00E9guli\u00E8res, poufs, macram\u00E9, guirlandes",
    surfacePrompt:
      "Bohemian garden outdoor: reclaimed irregular sandstone pavers 20-40cm variable size with moss-filled joints and raked white marble gravel borders 30cm wide, preserve all existing fences hedges and background trees unchanged, open sky preserved as-is.",
    furniturePrompt:
      "Bohemian garden furniture: two round weatherproof floor cushions 55cm in terracotta and mustard outdoor polyester fabric, low reclaimed-wood pallet coffee table 90x60cm aged grey finish, outdoor flat-weave polypropylene rug 160x230cm in warm earthy tones, freestanding bamboo rack 180cm with three hanging macrame plant holders, potted Heuchera 'Palace Purple' 40cm tall in woven sea-grass basket, potted Dryopteris filix-mas (male fern) and Rudbeckia mix in terracotta pots 30cm, battery string lights 2200K warm white draped loosely on the bamboo rack (unlit daytime). Layered informal atmosphere.",
  },

  minimaliste_urbain: {
    id: "minimaliste_urbain",
    label: "Minimaliste Urbain",
    emoji: "\u2B1C",
    description: "B\u00E9ton bross\u00E9, bains de soleil teck, herbe ornementale",
    surfacePrompt:
      "Minimalist urban outdoor: brushed light grey concrete floor 90x90cm large slabs with 6mm charcoal grouted joints, immaculate smooth finish free of stains, preserve all existing guard rails walls and facades unchanged, open sky preserved as-is.",
    furniturePrompt:
      "Minimalist urban outdoor furniture: two teak sun loungers 195cm with clean straight slatted frame and light stone-grey waterproof cushions, low rectangular fibrecite side table 80x40cm in light grey, one tall square concrete planter 90cm with single Stipa gigantea 120cm grass plume, four recessed stainless steel ground-level uplights 12cm diameter flush with floor surface (unlit daytime), small round polished concrete tray 30cm with three white river stones on the side table. Strict geometry, large empty floor zone preserved between items.",
  },

  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    emoji: "\uD83C\uDF06",
    description: "Lames IP\u00C9 argent\u00E9es, banquette, parasol, vue ville",
    surfacePrompt:
      "Rooftop outdoor: IPE hardwood deck planks 140mm wide silver-grey naturally weathered patina with stainless steel hidden fixings, deck laid parallel to the building facade, preserve existing parapet walls guard rails and city skyline exactly as in the input, open sky preserved as-is.",
    furniturePrompt:
      "Rooftop furniture: L-shaped modular weatherproof sofa 220cm x 180cm in anthracite grey Sunbrella-type fabric with dark aluminium frame, large offset parasol 3m on weighted telescopic base in matt black, rectangular dining table 160x80cm in matt dark grey powder-coated steel with 4 stacking polypropylene outdoor chairs in charcoal, two floor lanterns 45cm in dark metal with LED pillar candles (unlit daytime), two fibrecite rectangular planters 100x40cm with Stipa tenuissima grass 80cm tall, string lights 2200K on two freestanding stainless steel posts 2m tall along the parapet (unlit daytime). Preserve city view \u2014 no furniture blocking the skyline.",
  },

  cosy_balcon: {
    id: "cosy_balcon",
    label: "Cosy Balcon",
    emoji: "\uD83C\uDF38",
    description: "Bois composite chaud, table bistrot, guirlande LED",
    surfacePrompt:
      "Cosy balcony outdoor: warm honey-toned wood composite deck planks 120mm wide with concealed aluminium fixings, clean matte finish, preserve existing guard rails and balcony structure and floor edges unchanged, open sky preserved as-is.",
    furniturePrompt:
      "Cosy balcony furniture \u2014 COMPACT items only, suited to a narrow balcony: round zinc-top bistro table 60cm diameter, two folding metal chairs in matt black with small cream waterproof seat pads, one tall narrow planter 25x25x70cm with Trachelospermum jasminoides (star jasmine) trailing 40cm, one narrow planter 60x15cm along the guard rail with trailing Hedera helix (ivy), battery-powered warm white LED string lights 2200K draped along the guard rail inner edge (unlit daytime), small ceramic lantern 15cm with unlit pillar candle on the table surface. Intimate, slightly lived-in atmosphere. Leave 60cm clear passage width.",
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
