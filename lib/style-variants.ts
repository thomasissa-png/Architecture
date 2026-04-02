/**
 * Style Variants — 3 furniture compositions + 3 accent palettes per style.
 * v1 = current StylePicker.tsx prompt, v2/v3 = alternative compositions with different hero pieces.
 * Used for deterministic variety: same image + same style = same variant (via hash).
 */

export interface StyleVariants {
  furnitureVariants: string[]; // 3 variantes
  accentPalettes: string[];   // 3 palettes
}

export const STYLE_VARIANTS: Record<string, StyleVariants> = {
  scandinavian: {
    furnitureVariants: [
      // v1 — current: oatmeal boucle sofa, Wegner chair, AJ lamp
      "A serene Nordic living space. FOREGROUND: large straight three-seat sofa in oatmeal boucle with low squared arms and birch legs 230cm wide facing center, light birch rectangular coffee table with slim tapered legs 120cm in front of sofa, cream wool loop-pile area rug 200x300cm under the grouping. LATERAL: light ash lounge chair with woven paper cord seat and curved back (Wegner-style) angled toward sofa. BACKGROUND: small round birch side table with stacked design books and white ceramic ribbed vases, potted trailing pothos in light grey stoneware planter, dried birch branches in a tall cylindrical stoneware vase. ACCENTS: slim matte black asymmetric floor lamp with ultra-slim stem 2cm diameter and angled cone shade (AJ-style) beside the chair, sheepskin throw draped over one sofa arm, taper candles on the coffee table, two woven wool cushions in muted blue and warm grey",
      // v2 — daybed + shell chair + Arco-style lamp
      "A light-filled Nordic retreat with sculptural simplicity. FOREGROUND: wide daybed sofa in pale grey wool with slim white oak frame and bolster cushions 210cm wide facing center, oval white oak coffee table with splayed legs 110cm, flat-weave Berber-style rug in off-white with thin grey stripes 200x300cm. LATERAL: molded shell lounge chair in white with birch dowel legs angled toward daybed, tall matte white ceramic floor vase with dried eucalyptus beside chair. BACKGROUND: white oak console 140cm with single row of stacked linen-bound books and handmade stoneware bowl, small trailing string-of-hearts in a matte white pot. ACCENTS: slim white steel arc floor lamp with linen drum shade beside daybed, light grey cashmere throw folded on daybed, two cushions in muted blue and warm grey",
      // v3 — modular low sofa + Papa Bear-style chair + mushroom lamp
      "A quiet Nordic sanctuary grounded in soft textures. FOREGROUND: low modular two-piece sofa in undyed natural linen with white oak base 240cm wide facing center, round white marble coffee table on slim birch pedestal 90cm diameter, hand-knotted wool rug in ivory with subtle raised grid pattern 200x300cm. LATERAL: high-back wingback lounge chair in light grey wool with birch legs (Papa Bear-style) angled toward sofa. BACKGROUND: birch ladder shelf 60cm wide with ceramic jars and a single potted fern, smooth river stone as sculptural object on floor. ACCENTS: white mushroom-shaped table lamp on the ladder shelf, folded oatmeal waffle-knit throw on sofa arm, two cushions in muted blue and warm grey",
    ],
    accentPalettes: [
      "muted blue and warm grey",
      "dusty rose and sage green",
      "ochre and charcoal",
    ],
  },

  contemporary: {
    furnitureVariants: [
      // v1 — current: L-shaped charcoal boucle sectional, Flos IC lamp, smoked glass table
      "A refined editorial interior with sculptural accents and restrained luxury. FOREGROUND: large low-profile L-shaped sectional sofa in charcoal premium boucle with slim brushed steel legs 280cm facing center, sculptural smoked glass coffee table on brushed brass pedestal base 110cm, heathered grey thick wool area rug 250x350cm under the grouping. LATERAL: brushed brass floor lamp with asymmetric flat disc shade 30cm (Flos IC-style) beside the sofa end. BACKGROUND: tall matte white sculptural ceramic object on a slim black metal pedestal, potted architectural snake plant in matte black cylinder planter, single large abstract canvas sitting on the floor leaning against the baseboard. ACCENTS: architectural coffee table books in a neat stack on the table, two charcoal and cream geometric cushions on the sofa",
      // v2 — straight sofa + swivel chair + totem floor lamp
      "A gallery-like living space with precise material contrasts. FOREGROUND: straight three-seat sofa in warm taupe bouclette with slim chrome legs 230cm wide facing center, rectangular black marble coffee table with chrome hairpin legs 120cm, silver-grey silk-wool blend area rug 200x300cm. LATERAL: low swivel armchair in ivory leather on polished chrome base angled toward sofa, slim chrome and white glass totem floor lamp 170cm tall. BACKGROUND: matte black metal console 150cm with single oversized ceramic sphere and two hardcover art books, potted ZZ plant in ribbed concrete planter. ACCENTS: one charcoal velvet and one cream linen cushion on sofa, small polished chrome tray with single white candle on coffee table",
      // v3 — curved sofa + cantilever chair + Serge Mouille-style lamp
      "An architect's living room balancing warmth and rigor. FOREGROUND: curved four-seat sofa in dove grey wool felt with matte black metal legs 250cm wide facing center, round fluted travertine coffee table 100cm diameter, textured cream and grey abstract-pattern area rug 200x300cm. LATERAL: black leather cantilever chair on tubular chrome frame (Breuer-style) angled toward sofa, matte black three-arm rotating wall-standing lamp (Serge Mouille-style) 180cm tall. BACKGROUND: slim walnut floating-style credenza on metal legs 160cm with architectural model and stacked monographs, single potted olive tree in matte charcoal ceramic pot. ACCENTS: cream cashmere throw on sofa arm, two cushions in charcoal and cream on sofa",
    ],
    accentPalettes: [
      "charcoal and cream",
      "warm taupe and matte black",
      "steel blue and ivory",
    ],
  },

  industrial: {
    furnitureVariants: [
      // v1 — current: cognac leather sofa, butterfly chair, vintage Persian rug
      "A raw loft space with character — worn materials, generous volumes, and creative confidence. FOREGROUND: large three-seat worn leather sofa in warm cognac with visible patina 230cm wide facing center, reclaimed wood and black welded steel coffee table 130cm, faded vintage Persian rug in muted red and navy 200x300cm under grouping. LATERAL: leather and black steel butterfly chair angled toward sofa, black metal factory stool as side table. BACKGROUND: raw steel open-frame bookshelf with visible welds 180cm tall with books and aged brass objects, oversized vintage industrial clock on top shelf as signature piece, aged brass industrial desk lamp on the bookshelf. ACCENTS: potted large fiddle leaf fig in corrugated metal container beside bookshelf, two weathered leather cushions on sofa",
      // v2 — tufted grey velvet sofa + workshop stool + articulated lamp
      "A converted workshop with creative edge and raw elegance. FOREGROUND: deep tufted three-seat sofa in washed grey canvas with exposed black iron riveted frame 230cm wide facing center, riveted zinc-top rectangular coffee table on cast iron base 120cm, vintage kilim rug in faded indigo and brick 200x300cm. LATERAL: round wooden workshop stool with iron legs 45cm as accent seat, tall articulated black metal floor lamp with enamel cone shade (Jielde-style) beside stool. BACKGROUND: tall industrial metal locker cabinet in aged olive 180cm with open upper shelf displaying stacked books and a vintage camera, large glass apothecary jar on top. ACCENTS: potted Boston fern in galvanized steel bucket, two canvas and leather patchwork cushions on sofa",
      // v3 — dark brown chesterfield + metal armchair + tripod spotlight
      "A foundry-inspired interior with muscular proportions and vintage soul. FOREGROUND: three-seat Chesterfield sofa in dark brown distressed leather with deep button tufting 220cm wide facing center, industrial cart coffee table with iron wheels and reclaimed oak top 130cm, layered cowhide rug in brown and cream 200x280cm. LATERAL: riveted black steel armchair with aged leather seat pad angled toward sofa, vintage black steel tripod spotlight lamp 160cm tall beside chair. BACKGROUND: reclaimed scaffold-board shelving unit on black pipe frame 170cm with glass bottles, iron gear wheels, and vintage hardcovers, trailing devil's ivy in a matte black concrete pot on top shelf. ACCENTS: charcoal wool throw on sofa arm, two cushions in aged tan leather and dark grey herringbone wool on sofa",
    ],
    accentPalettes: [
      "muted red and navy",
      "faded indigo and rust",
      "olive and aged brass",
    ],
  },

  japandi: {
    furnitureVariants: [
      // v1 — current: platform sofa, ikebana branch, tetsubin teapot
      "A meditative room with deliberately sparse furnishing and balanced asymmetry — every empty space is intentional. FOREGROUND: low-profile platform sofa in natural undyed linen warm ecru with exposed light ash wood frame 220cm wide, light ash rectangular coffee table with rounded edges and short legs 100cm, flat-weave natural fiber rug in warm straw tone 200x250cm under grouping. LATERAL: floor cushion in muted clay tone beside the table, single ikebana dried branch in geometric cylindrical ceramic vase on floor. BACKGROUND: minimal round side table in light ash 40cm with black cast iron teapot (tetsubin) as signature piece, potted single-stem orchid in unglazed charcoal pottery. ACCENTS: thin cashmere throw in warm sand draped over one sofa arm. Intentional negative space — at least 60 percent of floor visible",
      // v2 — slatted bench sofa + zabuton + bonsai
      "A contemplative space where restraint is the luxury — every object earns its place. FOREGROUND: slatted dark walnut bench sofa with linen cushion in pale stone grey 200cm wide facing center, black lacquered low rectangular tray table 90cm on the floor, hand-loomed cotton dhurrie rug in off-white and muted charcoal stripe 180x250cm. LATERAL: round zabuton floor cushion in indigo cotton beside the tray table, single tall ceramic sake bottle in matte white on floor. BACKGROUND: slim dark walnut open shelf 50cm wide with two handmade tea bowls and a small bonsai in unglazed terracotta dish as signature piece, smooth pebble trio on the shelf. ACCENTS: folded indigo-dyed linen cloth on one sofa end. Intentional negative space — at least 60 percent of floor visible",
      // v3 — curved low sofa + woven stool + suiban vessel
      "A still, breath-like room where form dissolves into calm. FOREGROUND: curved low sofa in warm oat linen with exposed pale oak curved frame 210cm wide facing center, oval pale oak coffee table with chamfered edges 100cm, sisal area rug in natural sand tone 200x250cm. LATERAL: round woven rush stool 40cm diameter beside the sofa, single tall dried grass stem in a slim dark stoneware bottle on floor. BACKGROUND: pale oak stacking shelf 45cm wide with single ceramic suiban water vessel holding a floating camellia as signature piece, one unglazed charcoal incense holder. ACCENTS: light grey linen throw folded once on sofa. Intentional negative space — at least 60 percent of floor visible",
    ],
    accentPalettes: [
      "warm sand and muted clay",
      "indigo and pale stone",
      "charcoal and warm oat",
    ],
  },
};
