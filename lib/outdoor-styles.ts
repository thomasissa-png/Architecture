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
      "A sleek outdoor living room — vary furniture and layout each generation. Contemporary outdoor furniture: modular outdoor sofa 240cm (choose one: L-shaped graphite grey Sunbrella on matt black aluminium, straight three-seat in charcoal with dark grey steel frame, U-shaped modular in taupe on anthracite aluminium) — place along wall OR floating. Side table (choose one: rectangular concrete-fibre 90x45cm, round dark grey fibrecite 60cm, square black granite 50cm). Planters with grasses (choose one set: two cast-concrete 100x30cm with Stipa tenuissima + one tall fibrecite 70cm with Calamagrostis Karl Foerster, two corten steel cubes 50cm with Pennisetum + one tall cylinder with Miscanthus, two slate planters with Festuca glauca + one tall dark planter with Molinia). Four recessed ground uplights 12cm (unlit daytime). Generous empty floor space.",
  },

  mediterraneen_outdoor: {
    id: "mediterraneen_outdoor",
    label: "Méditerranéen",
    emoji: "\uD83E\uDED2",
    description: "Tomettes terre cuite, table fer forgé, oliviers",
    surfacePrompt:
      "Mediterranean outdoor: reclaimed Provençal terracotta tiles 30x30cm with natural irregular patina and slightly raised grout joints in light ochre mortar, low dry-stone rendered wall coping in warm limestone, preserve all existing walls facades and guard rails unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A sun-warmed courtyard — vary furniture and plantings each generation. Mediterranean outdoor furniture: table 120cm (choose one: round wrought-iron in aged antique white with oxidized edges, rectangular stone-top on iron legs, oval mosaic tile-top on curved iron base), 4 chairs (choose one: bistro armchairs with woven rush seats, slatted teak with cream cushions, painted metal with woven cord seats). Trees in terracotta planters 90cm (choose one: standard-trained olive trees 150cm, lemon trees with visible fruit, fig trees with broad leaves), herbs along wall base (choose one: rosemary and lavender, thyme and oregano, sage and geraniums) in terracotta pots 25-30cm. Table accent (choose one: ceramic lanterns 25cm with unlit candles, glazed ceramic bowl with lemons, terracotta carafe with dried herbs), polypropylene table runner in natural ecru. Warm convivial atmosphere.",
  },

  boheme_garden: {
    id: "boheme_garden",
    label: "Bohème Garden",
    emoji: "\uD83C\uDF3F",
    description: "Dalles irrégulières, poufs, macramé, guirlandes",
    surfacePrompt:
      "Bohemian garden outdoor: reclaimed irregular sandstone pavers 20-40cm variable size with moss-filled joints and raked white marble gravel borders 30cm wide, preserve all existing fences hedges and background trees unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A free-spirited garden corner — vary textures and plantings each generation. Bohemian garden furniture: floor seating (choose one: two round weatherproof cushions 55cm in terracotta and mustard, two large floor poufs in indigo and ochre, layered outdoor blankets with mixed kilim cushions), low table (choose one: reclaimed-wood pallet 90x60cm aged grey, tree-trunk slice 70cm, painted tile-top on iron legs 80cm). Polypropylene rug 160x230cm in warm earthy tones. Plant display (choose one: bamboo rack 180cm with three macramé hangers, wooden ladder shelf with trailing plants, cluster of mismatched pots on the ground). Potted plants (choose one set: Heuchera Palace Purple + Dryopteris fern + Rudbeckia, Heuchera Lime Rickey + Athyrium + Echinacea, Carex bronze + Polystichum + Salvia). Battery string lights 2200K on rack (unlit daytime). Layered informal atmosphere.",
  },

  provencal: {
    id: "provencal",
    label: "Provençal",
    emoji: "\uD83C\uDFE1",
    description: "Pierre calcaire, fer forgé, lavande, cyprès",
    surfacePrompt:
      "Provençal outdoor: terracotta floor tiles with irregular edges and warm tones laid in traditional staggered bond, preserve all existing walls facades and guard rails unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A timeless Provençal terrace — vary furniture and plantings each generation. Provençal outdoor furniture: table 120cm (choose one: wrought iron with glass top, weathered stone round, reclaimed oak trestle), 4 chairs (choose one: wrought iron with cream cushions, painted wood bistro, rush-seat ladder-back). Feature tree (choose one: Italian cypress 180cm in terracotta pot 90cm, standard olive tree 150cm in stone urn, bay laurel 160cm in aged terracotta). Aromatic plants (choose one: lavender rows in stone troughs 60cm, rosemary and santolina in clay pots, thyme and iris in weathered planters). Table accent (choose one: Provençal blue ceramic vase 30cm with olive branches, ceramic pitcher with dried lavender, glazed bowl with figs). Polypropylene rug 200x300cm in warm ochre. Optional: stone fountain basin 50cm (dry in daylight) OR sundial on low plinth.",
  },

  industriel_urbain: {
    id: "industriel_urbain",
    label: "Industriel Urbain",
    emoji: "\uD83C\uDFD7\uFE0F",
    description: "Béton brut, acier galvanisé, plantes graphiques",
    surfacePrompt:
      "Industrial urban outdoor: smooth grey concrete floor, preserve all existing walls facades and guard rails unchanged keeping their raw texture and color, open sky preserved as-is.",
    furniturePrompt:
      "A reclaimed urban courtyard — vary materials and plantings each generation. Industrial urban outdoor furniture: planter boxes 80x40cm (choose one: galvanized steel with Stipa tenuissima + Sedum acre, corten steel with Festuca glauca + Sempervivum, raw concrete with Carex buchananii + Sedum spectabile). Bench (choose one: concrete 180cm with black steel frame, reclaimed railway sleeper with steel legs, welded steel with perforated seat). Feature planter (choose one: corten steel 40cm with succulent arrangement, concrete cylinder with Equisetum horsetail, galvanized trough with Phormium tenax). Privacy screen (choose one: black steel and wood slatted 180cm, woven wire mesh on steel frame, reclaimed corrugated metal panel). Side table 50cm in industrial steel, pendant on steel arm (unlit daytime), polypropylene rug 160x230cm in charcoal grey.",
  },

  minimaliste_urbain: {
    id: "minimaliste_urbain",
    label: "Minimaliste Urbain",
    emoji: "\u2B1C",
    description: "Béton brossé, bains de soleil teck, herbe ornementale",
    surfacePrompt:
      "Minimalist urban outdoor: brushed light grey concrete floor 90x90cm large slabs with 6mm charcoal grouted joints, immaculate smooth finish free of stains, preserve all existing guard rails walls and facades unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A contemplative outdoor platform — vary furniture and placement each generation. Minimalist urban outdoor furniture: lounging (choose one: two teak sun loungers 195cm with stone-grey cushions, single wide teak daybed 200cm with white cushion, two low concrete benches 160cm with slim grey pads) — place parallel OR at 90-degree angle. Side table (choose one: low rectangular fibrecite 80x40cm in light grey, round concrete 50cm, square black granite 45cm). Feature planter (choose one: tall square concrete 90cm with Stipa gigantea 120cm, cylindrical fibrecite 80cm with single Miscanthus, rectangular stone 100cm with Calamagrostis). Four recessed uplights 12cm (unlit daytime). Table accent (choose one: polished concrete tray with three white river stones, single smooth black stone, small concrete bowl with rain water). Strict geometry, large empty floor zone preserved.",
  },

  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    emoji: "\uD83C\uDF06",
    description: "Lames IPÉ argentées, banquette, parasol, vue ville",
    surfacePrompt:
      "Rooftop outdoor: IPE hardwood deck planks 140mm wide silver-grey naturally weathered patina with stainless steel hidden fixings, deck laid parallel to the building facade, preserve existing parapet walls guard rails and city skyline exactly as in the input, open sky preserved as-is.",
    furniturePrompt:
      "A sky-level retreat — vary furniture and layout each generation, keep low to preserve view. Rooftop furniture: sofa (choose one: L-shaped modular 220x180cm anthracite grey Sunbrella on charcoal aluminium, straight three-seat 200cm in dark grey with black steel frame, curved modular 240cm in taupe on dark aluminium). Parasol (choose one: large offset 3m matt black, square sail shade 2.5m in charcoal, rectangular cantilever 3x2m in dark grey). Dining (choose one: rectangular steel table 160x80cm with 4 charcoal stacking chairs, round concrete table 120cm with 4 black metal chairs, teak slatted table 140x80cm with 4 dark woven chairs). Planters (choose one: two fibrecite 100x40cm with Stipa tenuissima, two corten steel with Pennisetum, two dark concrete with Miscanthus sinensis). Two floor lanterns 45cm dark metal (unlit daytime), string lights on two posts 2m (unlit daytime). Preserve city view — no furniture blocking skyline.",
  },

  cosy_balcon: {
    id: "cosy_balcon",
    label: "Cosy Balcon",
    emoji: "\uD83C\uDF38",
    description: "Bois composite chaud, table bistrot, guirlande LED",
    surfacePrompt:
      "Cosy balcony outdoor: warm honey-toned wood composite deck planks 120mm wide with concealed aluminium fixings, clean matte finish, preserve existing guard rails and balcony structure and floor edges unchanged, open sky preserved as-is.",
    furniturePrompt:
      "A tiny open-air nook — vary furniture and plants each generation. COMPACT items only for narrow balcony. Table (choose one: round zinc-top bistro 60cm, small square teak 50cm, round mosaic tile-top 55cm), seating (choose one: two folding metal chairs matt black with waterproof cream cushions, two rattan bistro chairs with outdoor-rated cushions, one small wooden bench 90cm with weatherproof pad). Tall planter 25x25x70cm (choose one: Trachelospermum jasminoides trailing, Clematis on small trellis, Plumbago with blue flowers). Rail planter 60x15cm (choose one: Hedera helix trailing, Pelargonium in mixed colors, Lobelia cascading). Battery LED string lights 2200K along rail (unlit daytime). Table accent (choose one: small ceramic lantern 15cm with candle, tiny potted herb, beeswax candle in terracotta cup). Intimate atmosphere. Leave 60cm clear passage.",
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
