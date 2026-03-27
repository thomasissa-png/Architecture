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
    description: "Dalles béton gris, mobilier modulaire anthracite",
    surfacePrompt:
      "Contemporary outdoor: large-format grey concrete pavers 60x60cm laid in linear bond with 4mm grey grouted joints, narrow stainless steel expansion joint every 3m, preserve all existing guard rails and exterior walls unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A sleek outdoor living room where clean lines meet open sky — everything is deliberate, nothing is decorative. Contemporary outdoor furniture: modular low-profile L-shaped outdoor sofa 240cm in graphite grey Sunbrella-type fabric with powder-coated matt black aluminium frame, rectangular concrete-fibre side table 90x45cm, two cast-concrete rectangular planters 100x30cm with single Stipa tenuissima grass clump each, one tall fibrecite planter 70cm with Calamagrostis Karl Foerster (tall narrow upright feathery grass plume, straw-gold tone) 120cm tall, four stainless steel recessed ground uplights 12cm diameter flush with floor surface (unlit daytime). No clutter, generous empty floor space between furniture and guard rail.",
  },

  mediterraneen_outdoor: {
    id: "mediterraneen_outdoor",
    label: "Méditerranéen",
    emoji: "\uD83E\uDED2",
    description: "Tomettes terre cuite, table fer forgé, oliviers",
    surfacePrompt:
      "Mediterranean outdoor: reclaimed Provençal terracotta tiles 30x30cm with natural irregular patina and slightly raised grout joints in light ochre mortar, low dry-stone rendered wall coping in warm limestone, preserve all existing walls facades and guard rails unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A sun-warmed courtyard where wrought iron and terracotta age together under olive branches. Mediterranean outdoor furniture: round wrought-iron table 120cm in aged antique white finish with visible dark oxidized metal showing through paint wear on edges, 4 matching bistro armchairs with woven rush seats, two glazed terracotta planters 90cm diameter with standard-trained olive trees 150cm overall height, three smaller terracotta pots 25-30cm with rosemary and lavender along the wall base, ceramic lanterns 25cm tall on table surface with unlit pillar candles, outdoor-rated woven polypropylene table runner 40x120cm in natural ecru with fringe edge. Warm convivial atmosphere.",
  },

  boheme_garden: {
    id: "boheme_garden",
    label: "Bohème Garden",
    emoji: "\uD83C\uDF3F",
    description: "Dalles irrégulières, poufs, macramé, guirlandes",
    surfacePrompt:
      "Bohemian garden outdoor: reclaimed irregular sandstone pavers 20-40cm variable size with moss-filled joints and raked white marble gravel borders 30cm wide, preserve all existing fences hedges and background trees unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A free-spirited garden corner where mismatched textures and trailing greenery blur the line between wild and curated. Bohemian garden furniture: two round weatherproof floor cushions 55cm in terracotta and mustard outdoor polyester fabric, low reclaimed-wood pallet coffee table 90x60cm aged grey finish, outdoor flat-weave polypropylene rug 160x230cm in warm earthy tones, freestanding bamboo rack 180cm with three hanging macrame plant holders, potted Heuchera 'Palace Purple' (low mounding plant with dark burgundy-purple scalloped leaves) 40cm tall in woven sea-grass basket, potted Dryopteris filix-mas (male fern with arching bright green fronds) and Rudbeckia (upright daisy-like golden yellow flowers with dark brown center cone) mix in terracotta pots 30cm, battery string lights 2200K warm white draped loosely on the bamboo rack (unlit daytime). Layered informal atmosphere.",
  },

  provencal: {
    id: "provencal",
    label: "Provençal",
    emoji: "\uD83C\uDFE1",
    description: "Pierre calcaire, fer forgé, lavande, cyprès",
    surfacePrompt:
      "Provençal outdoor: warm aged limestone walls with natural patina and subtle weathering, terracotta floor tiles with irregular edges and warm tones laid in traditional staggered bond, open sky preserved as-is.",
    furniturePrompt:
      "A timeless Provençal terrace bathed in dry heat — stone, iron, and lavender, nothing more. Provençal outdoor furniture: wrought iron table 120cm with glass top, 4 wrought iron chairs with cream seat cushions (outdoor-rated), large terracotta pot 90cm with Italian cypress 180cm, lavender rows in weathered stone troughs 60cm, freestanding stone fountain basin 50cm on low plinth with copper spout (dry in daylight), Provençal blue ceramic vase 30cm on table, olive branch arrangement in rustic ceramic pitcher, outdoor flat-weave polypropylene rug 200x300cm in warm ochre.",
  },

  industriel_urbain: {
    id: "industriel_urbain",
    label: "Industriel Urbain",
    emoji: "\uD83C\uDFD7\uFE0F",
    description: "Béton brut, acier galvanisé, plantes graphiques",
    surfacePrompt:
      "Industrial urban outdoor: raw concrete walls keeping existing texture and color unchanged, smooth grey concrete floor, open sky preserved as-is.",
    furniturePrompt:
      "A reclaimed urban courtyard where raw concrete and galvanized steel frame tough, graphic plantings. Industrial urban outdoor furniture: galvanized steel planter boxes 80x40cm with Stipa tenuissima (fine wispy ornamental grass) and Sedum acre (low creeping succulent mat with tiny bright green star-shaped leaves), concrete bench 180cm with black steel frame, industrial steel side table 50cm, succulent arrangement in rusted corten steel container 40cm (deep orange-brown patina with rough granular oxidized surface), Equisetum hyemale (horsetail) in tall narrow steel planter 100cm, black steel and wood slatted privacy screen 180cm, industrial pendant light on steel arm (unlit daytime), outdoor flat-weave polypropylene rug 160x230cm in charcoal grey.",
  },

  minimaliste_urbain: {
    id: "minimaliste_urbain",
    label: "Minimaliste Urbain",
    emoji: "\u2B1C",
    description: "Béton brossé, bains de soleil teck, herbe ornementale",
    surfacePrompt:
      "Minimalist urban outdoor: brushed light grey concrete floor 90x90cm large slabs with 6mm charcoal grouted joints, immaculate smooth finish free of stains, preserve all existing guard rails walls and facades unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A contemplative outdoor platform where negative space is the main material. Minimalist urban outdoor furniture: two teak sun loungers 195cm with clean straight slatted frame and light stone-grey waterproof cushions, low rectangular fibrecite side table 80x40cm in light grey, one tall square concrete planter 90cm with single Stipa gigantea 120cm grass plume, four recessed stainless steel ground-level uplights 12cm diameter flush with floor surface (unlit daytime), small round polished concrete tray 30cm with three white river stones on the side table. Strict geometry, large empty floor zone preserved between items.",
  },

  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    emoji: "\uD83C\uDF06",
    description: "Lames IPÉ argentées, banquette, parasol, vue ville",
    surfacePrompt:
      "Rooftop outdoor: IPE hardwood deck planks 140mm wide silver-grey naturally weathered patina with stainless steel hidden fixings, deck laid parallel to the building facade, preserve existing parapet walls guard rails and city skyline exactly as in the input, open sky preserved as-is.",
    furniturePrompt:
      "A sky-level retreat where the city panorama is the backdrop and the furniture stays low to preserve the view. Rooftop furniture: L-shaped modular weatherproof sofa 220cm x 180cm in anthracite grey Sunbrella-type fabric with dark powder-coated aluminium frame (matte charcoal, no shine), large offset parasol 3m on weighted telescopic base in matt black, rectangular dining table 160x80cm in matt dark grey powder-coated steel with 4 stacking polypropylene outdoor chairs in charcoal, two floor lanterns 45cm in dark metal with LED pillar candles (unlit daytime), two fibrecite rectangular planters 100x40cm with Stipa tenuissima grass 80cm tall, string lights 2200K on two freestanding stainless steel posts 2m tall along the parapet (unlit daytime). Preserve city view \u2014 no furniture blocking the skyline.",
  },

  cosy_balcon: {
    id: "cosy_balcon",
    label: "Cosy Balcon",
    emoji: "\uD83C\uDF38",
    description: "Bois composite chaud, table bistrot, guirlande LED",
    surfacePrompt:
      "Cosy balcony outdoor: warm honey-toned wood composite deck planks 120mm wide with concealed aluminium fixings, clean matte finish, preserve existing guard rails and balcony structure and floor edges unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A tiny open-air nook that feels like an extension of the living room — intimate, warm, slightly overgrown. Cosy balcony furniture \u2014 COMPACT items only, suited to a narrow balcony: round zinc-top bistro table 60cm diameter, two folding metal chairs in matt black with small cream waterproof seat pads, one tall narrow planter 25x25x70cm with Trachelospermum jasminoides (star jasmine) trailing 40cm, one narrow planter 60x15cm along the guard rail with trailing Hedera helix (ivy), battery-powered warm white LED string lights 2200K draped along the guard rail inner edge (unlit daytime), small ceramic lantern 15cm with unlit pillar candle on the table surface. Intimate, slightly lived-in atmosphere. Leave 60cm clear passage width.",
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
  OUTDOOR_STYLES.provencal,
  OUTDOOR_STYLES.industriel_urbain,
];
