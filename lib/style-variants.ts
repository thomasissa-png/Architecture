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

  "art-deco": {
    furnitureVariants: [
      // v1 — current: emerald velvet sofa, brass sunburst mirror, lacquer drinks cabinet
      "An opulent salon with geometric precision and theatrical glamour — every surface gleams. FOREGROUND: channel-tufted velvet sofa in deep emerald green with polished brass legs 230cm wide centered, round polished brass coffee table with smoked glass top 90cm diameter, geometric patterned area rug in black gold and cream 200x300cm. LATERAL: marble-top brass side table with crystal decanter and gold-rimmed glasses, tall brass floor lamp with pleated cream silk shade. BACKGROUND: fluted dark lacquer drinks cabinet with brass handles 120cm tall, brass sunburst mirror leaning against wall resting on cabinet as signature piece, matching pair of brass table lamps flanking the sofa. ACCENTS: potted areca palm in polished brass planter beside cabinet, velvet cushions in sapphire and gold with geometric patterns on sofa",
      // v2 — sapphire velvet curved sofa + marble pedestal table + fan scallop accents
      "A glamorous 1920s-inspired salon dripping with geometry and jewel tones. FOREGROUND: curved three-seat sofa in deep sapphire blue velvet with scalloped channel tufting and gilded legs 230cm wide facing center, octagonal smoked mirror coffee table on brass geometric base 100cm, art deco geometric area rug in ivory black and gold chevron 200x300cm. LATERAL: polished brass etagere 50cm wide with crystal glassware and a single gold-framed photo, brass torchiere floor lamp with frosted glass uplighter shade beside etagere. BACKGROUND: round marble pedestal bar cart in white Carrara with brass rail and smoked glass shelf, potted birds of paradise in gold-leafed ceramic planter. ACCENTS: emerald and gold geometric velvet cushions on sofa, brass cigarette box and crystal ashtray on coffee table",
      // v3 — blush pink velvet sofa + black lacquer table + peacock motif
      "A theatrical deco interior where blush meets noir and gold binds them. FOREGROUND: three-seat sofa in dusty blush pink velvet with deep button tufting and dark lacquered legs 230cm wide facing center, rectangular black lacquer coffee table with brass inlay trim 120cm, plush ivory and black geometric area rug with fan motif 200x300cm. LATERAL: dark lacquer side table with brass peacock-feather bookends and stacked gold-edged hardcovers, tall matte black floor lamp with gold-lined drum shade. BACKGROUND: fluted black lacquer vitrine cabinet with brass handles and glass doors 110cm tall displaying crystal decanters, potted majesty palm in black ceramic planter with brass stand. ACCENTS: sapphire and gold with geometric patterns cushions on sofa, brass desk clock on the side table",
    ],
    accentPalettes: [
      "sapphire and gold with geometric patterns",
      "emerald and polished brass",
      "blush pink and black lacquer",
    ],
  },

  "mid-century": {
    furnitureVariants: [
      // v1 — current: mustard curved sofa, walnut biomorphic table, tripod floor lamp
      "A sunlit retro living room with optimistic colors and iconic design pieces — everything has legs and light passes beneath. FOREGROUND: curved organic sofa in mustard woven fabric with walnut tapered legs 220cm wide facing center, sculptural free-form walnut coffee table with biomorphic shape 120cm, warm-toned geometric area rug in cream mustard and teal 200x300cm. LATERAL: black leather and walnut bentwood lounge chair with matching ottoman angled toward sofa, walnut and brass tripod floor lamp with natural linen cone shade (60s-style). BACKGROUND: walnut credenza with sliding doors and brass pulls 160cm wide as anchor, stacked vintage design books and small brass starburst clock on credenza, potted fiddle leaf fig in warm terracotta planter beside credenza. ACCENTS: two cushions in teal and burnt orange on sofa",
      // v2 — olive tweed sofa + egg chair + arc lamp + teak sideboard
      "A confident mid-century interior with warm optimism and collector spirit. FOREGROUND: straight three-seat sofa in olive green tweed with slim teak arms and tapered brass-capped legs 230cm wide facing center, round teak coffee table with lower magazine shelf 100cm diameter, shag area rug in cream with orange and brown abstract circles 200x300cm. LATERAL: high-back egg-shaped swivel chair in burnt orange wool on polished chrome base (Egg-style) angled toward sofa, slim brass arc floor lamp with white glass globe shade 180cm tall. BACKGROUND: long teak sideboard with louvered doors and brass handles 180cm wide, ceramic table lamp with teal glaze and white fabric shade on sideboard, trailing spider plant in hanging macrame planter near sideboard. ACCENTS: two cushions in teal and burnt orange on sofa, teak fruit bowl with decorative wooden spheres on coffee table",
      // v3 — rust bouclette sofa + womb chair + nelson bench
      "A playful yet refined mid-century space with sculptural furniture and warm earth tones. FOREGROUND: curved two-seat sofa in rust bouclette with walnut peg legs 200cm wide facing center, kidney-shaped walnut coffee table with brass sabots 110cm, flat-weave area rug in cream with thin mustard and charcoal lines 200x300cm. LATERAL: deep womb-style armchair in cream boucle on polished chrome cradle base angled toward sofa, walnut and white enamel tripod side table 40cm with ceramic ashtray-style catchall. BACKGROUND: walnut slatted bench 150cm wide with orange seat pad (Nelson-style) as anchor along back wall, tall potted rubber plant in matte white ceramic planter beside bench, single vintage travel poster leaning against baseboard. ACCENTS: two cushions in teal and burnt orange on sofa, brass mobile sculpture on the slatted bench",
    ],
    accentPalettes: [
      "teal and burnt orange",
      "olive green and warm brass",
      "rust and cream",
    ],
  },

  bohemian: {
    furnitureVariants: [
      // v1 — current: ecru linen sofa, peacock rattan chair, vintage Persian rug
      "A warm nomadic retreat layered with textiles, plants, and worldly treasures — relaxed and deeply personal. FOREGROUND: deep relaxed linen sofa with slouchy cushions in natural ecru with layered kilim and mudcloth cushions in terracotta rust and indigo 220cm wide, round reclaimed wood coffee table with organic edge 90cm diameter, faded vintage Persian rug layered over natural jute rug 200x300cm. LATERAL: rattan peacock chair with sheepskin throw draped over, round kilim-upholstered pouf 50cm as signature floor seat beside chair. BACKGROUND: tall freestanding natural wood tripod plant stand with trailing pothos, one monstera in a woven basket, small brass Moroccan-style pierced lantern on floor. ACCENTS: two trailing pothos in terracotta pots, wooden tray with pillar candles and dried pampas grass on the table",
      // v2 — rust velvet sofa + cane armchair + macrame + floor cushions
      "A layered bohemian den rich in global textiles and earthy warmth. FOREGROUND: deep three-seat sofa in washed rust velvet with slouchy seat and fringe-trimmed throw pillows 220cm wide facing center, round carved Indian wood coffee table with brass studs 90cm diameter, vintage Turkish kilim rug in faded coral and indigo layered over sisal 200x300cm. LATERAL: cane-back armchair with cream linen seat cushion angled toward sofa, large round leather Moroccan floor pouf in tan beside armchair. BACKGROUND: tall rattan bookshelf 60cm wide with woven baskets, stacked travel books, and a hand-carved wooden mask, hanging dried flower bundles from top shelf, monstera in terracotta pot on floor beside shelf. ACCENTS: terracotta rust and indigo cushions on sofa, brass incense holder and ceramic bowl of dried seed pods on coffee table",
      // v3 — natural linen daybed + wicker chair + Berber layers
      "A sunlit nomadic sanctuary with desert tones and artisan textures. FOREGROUND: low daybed in natural undyed linen with wooden frame and bolster rolls 200cm wide facing center, low round hammered brass tray table on folding legs 70cm diameter, layered Berber wool rug in cream with charcoal diamond pattern over jute 200x300cm. LATERAL: oversized wicker papasan chair with cream cotton cushion angled toward daybed, terracotta oil lamp on floor beside chair. BACKGROUND: wooden blanket ladder 180cm tall draped with a woven throw and a mudcloth runner, potted prickly pear cactus in large terracotta pot on floor, small stack of vintage suitcases as side surface. ACCENTS: terracotta rust and indigo cushions on daybed, wooden bead garland draped over blanket ladder",
    ],
    accentPalettes: [
      "terracotta rust and indigo",
      "saffron and deep plum",
      "burnt sienna and sage",
    ],
  },

  mediterranean: {
    furnitureVariants: [
      // v1 — current: natural linen sofa, olive wood table, amphora jar
      "A sun-drenched southern interior where time slows down — natural materials, artisan textures, and quiet elegance. FOREGROUND: deep generous three-seat natural linen sofa with loose slipcover in off-white 230cm wide facing center, rustic olive wood coffee table with natural live edge 110cm, woven esparto grass rug in natural tone 200x300cm. LATERAL: handwoven rush-seat wooden chair as accent piece angled toward sofa, patinated wrought iron side table with curved legs and glazed turquoise ceramic bowl. BACKGROUND: large olive branches in a rustic terracotta amphora jar 80cm tall, potted rosemary and trailing jasmine in terracotta pots. ACCENTS: glazed ceramic plates and bowls in cobalt and terracotta on the table, linen cushions in warm sand and sun-bleached blue on sofa",
      // v2 — stone-colored linen sofa + carved wood chair + blue ceramic accents
      "A coastal Mediterranean room with whitewashed calm and artisan ceramics. FOREGROUND: three-seat sofa in stone-colored washed linen with deep seat and low arms 230cm wide facing center, round travertine coffee table on pedestal base 90cm diameter, hand-loomed cotton flat-weave rug in cream with thin blue stripes 200x300cm. LATERAL: carved dark wood armchair with woven rush seat and arched back angled toward sofa, wrought iron floor candelabra with three cream pillar candles 120cm tall beside chair. BACKGROUND: rustic reclaimed wood console 140cm with stacked terracotta plates, a glazed blue ceramic pitcher, and a small potted lemon tree in aged terracotta pot. ACCENTS: warm sand and sun-bleached blue linen cushions on sofa, single terracotta oil lamp on the travertine table",
      // v3 — cream cotton daybed + woven stool + dried lavender
      "A Provençal-inspired interior bathed in warmth and rustic simplicity. FOREGROUND: wide daybed sofa in heavy cream cotton with deep tufted mattress and rolled bolster 220cm wide facing center, low rectangular reclaimed pine coffee table with iron nail details 120cm, natural sisal area rug 200x300cm. LATERAL: round woven seagrass stool 45cm as accent seat, tall wrought iron lantern with aged glass panels on floor beside stool. BACKGROUND: weathered blue-grey wooden storage bench 130cm with folded linen blankets and a basket of dried lavender bundles, potted bougainvillea cutting in wide terracotta pot. ACCENTS: warm sand and sun-bleached blue cushions on daybed, small ceramic bowl of dried figs on coffee table",
    ],
    accentPalettes: [
      "warm sand and sun-bleached blue",
      "cobalt and terracotta",
      "olive green and cream",
    ],
  },

  cosy: {
    furnitureVariants: [
      // v1 — current: cream boucle sofa, chunky knit throw, pillar candles
      "A cocooning nest where warmth is layered — soft throws, candlelight, and textures you want to sink into. FOREGROUND: generously proportioned three-seat boucle sofa in warm cream 260cm wide with chunky knit throw in cream wool draped over arm and soft sheepskin draped over seat, round light oak coffee table 100cm diameter with cluster of 3 pillar candles on wooden tray and stack of hardcover books. LATERAL: camel boucle armchair angled toward sofa with velvet cognac cushion. BACKGROUND: oak side table with warm ceramic table lamp with linen pleated drum shade, string of pearls in cream ribbed ceramic planter on floor. FLOOR: cream wool area rug 200x300cm. ACCENTS: layered cushions in mixed textures velvet linen and boucle in cream camel and warm cognac across sofa and chair",
      // v2 — teddy bear sofa + reading nook chair + woven basket accents
      "A warm hibernation den built for evenings in — layered softness and amber glow. FOREGROUND: deep three-seat sofa in warm oat teddy-bear fabric with rounded arms and low oak legs 240cm wide facing center, oval light oak coffee table with lower woven basket shelf 110cm, thick hand-tufted wool area rug in cream with subtle tone-on-tone abstract pattern 200x300cm. LATERAL: high-back reading armchair in mushroom velvet with matching footstool angled toward sofa, brass swing-arm reading lamp on slim stand beside chair. BACKGROUND: low oak bookshelf 120cm with woven storage baskets and stacked hardcovers, ceramic diffuser and three amber glass votives on the shelf, potted trailing philodendron in cream ceramic on floor. ACCENTS: cream camel and warm cognac cushions on sofa, chunky cable-knit blanket folded on armchair",
      // v3 — corduroy sofa + papasan-style chair + floor lanterns
      "A candlelit retreat where every surface invites touch. FOREGROUND: three-seat sofa in wide-wale corduroy in warm camel with deep cushions and round oak legs 230cm wide facing center, round walnut coffee table with turned legs 90cm diameter, plush cream shag area rug 200x300cm. LATERAL: oversized round papasan-style chair with thick cream linen cushion angled toward sofa, small oak stump side table 35cm with mug and stacked coasters. BACKGROUND: tall woven rattan floor lantern 70cm with LED pillar candle inside, smaller matching lantern 50cm beside it, trailing string of pearls in terracotta pot on floor between lanterns. ACCENTS: cream camel and warm cognac cushions on sofa, faux fur throw in cream draped over papasan chair",
    ],
    accentPalettes: [
      "cream camel and warm cognac",
      "dusty rose and oat",
      "warm amber and ivory",
    ],
  },

  "wabi-sabi": {
    furnitureVariants: [
      // v1 — current: raw linen sofa, weathered oak table, kintsugi tea bowl
      "A quiet room where objects show their age — rough surfaces, visible wear, and the beauty of less. FOREGROUND: raw linen sofa visibly wrinkled in undyed flax tone with low dark weathered reclaimed wood frame 200cm wide, weathered oak rectangular coffee table with visible wood grain and worn edges 120cm, rough textured wool rug in undyed natural fiber 180x250cm. LATERAL: aged reclaimed wood bench with visible wear marks 100cm placed asymmetrically. BACKGROUND: handmade asymmetric ceramic vase with single dried branch on floor, smooth river stone as sculptural object. ACCENTS: single dark charcoal tea bowl with crackle glaze on table as signature kintsugi-inspired piece. Intentional negative space — at least 60 percent of floor visible",
      // v2 — stone-colored hemp sofa + driftwood stool + eroded pottery
      "A meditative space where decay is decoration and silence fills the room. FOREGROUND: low two-seat sofa in heavy stone-grey hemp with visible weave and dark iron frame 190cm wide facing center, round dark oak table with ring stains and unfinished edge 80cm diameter, hand-woven jute area rug in uneven natural tone 180x250cm. LATERAL: driftwood stool with flat-sawn seat and natural silver-grey patina 45cm tall placed off-center. BACKGROUND: single large eroded stoneware jar 50cm tall on floor with dried wild grasses, small chipped terracotta dish with a single smooth black stone. ACCENTS: folded raw linen cloth in pale ash draped on one sofa arm. Intentional negative space — at least 60 percent of floor visible",
      // v3 — undyed wool sofa + salvaged wood slab table + single dried stem
      "A room of noble imperfection where each object carries a story of time. FOREGROUND: deep low sofa in undyed dark wool with visible irregularities and weathered walnut plank base 200cm wide facing center, salvaged thick wood slab coffee table with live edge and visible knots on short black iron legs 110cm, worn flat-weave cotton rug in faded mushroom tone 180x250cm. LATERAL: low round iron stool with hammered concave seat and oxidized patina 40cm placed asymmetrically. BACKGROUND: single tall dried teasel stem in a narrow neck stoneware bottle on floor, one cracked ceramic bowl resting directly on the floor. ACCENTS: single linen cushion in washed charcoal on sofa. Intentional negative space — at least 60 percent of floor visible",
    ],
    accentPalettes: [
      "charcoal and undyed flax",
      "ash grey and faded mushroom",
      "dark clay and weathered bone",
    ],
  },

  maximalist: {
    furnitureVariants: [
      // v1 — current: cobalt velvet sofa, coral lacquered table, layered rugs
      "A bold, personality-filled room where more is more — vibrant colors, mixed patterns, and curated eclecticism. FOREGROUND: bold jewel-toned velvet sofa in deep cobalt blue with curved sculptural back and brass legs 230cm wide, round lacquered coral coffee table on brass circular frame 100cm, layered rugs mixing faded vintage Persian and contemporary bold graphic patterns 200x300cm. LATERAL: sculptural brass floor lamp with oversized colored shade, brass and marble side table with stacked art books and ornate vintage brass candlestick holder. BACKGROUND: two framed art prints propped on floor against baseboard, large potted monstera in colorful glazed ceramic pot. ACCENTS: vintage brass tray with pillar candles on the coffee table, one cushion in animal print velvet and one in bold geometric stripe on sofa",
      // v2 — magenta velvet sofa + leopard armchair + chinoiserie accents
      "An audacious maximalist salon bursting with pattern and collectible energy. FOREGROUND: three-seat sofa in magenta velvet with bullion fringe trim and dark wood legs 230cm wide facing center, large round lacquered black coffee table with brass gallery edge 100cm diameter, stacked Persian and Suzani-inspired rugs in red orange and navy 200x300cm. LATERAL: accent armchair in leopard-print cotton velvet with dark mahogany frame angled toward sofa, tall ceramic chinoiserie table lamp on slim brass pedestal beside chair. BACKGROUND: dark lacquered bar cabinet with mirrored interior 100cm tall, collection of green and blue glass bottles on top, large potted banana plant in glazed emerald ceramic pot beside cabinet. ACCENTS: animal print velvet and bold geometric stripe cushions on sofa, stack of oversized coffee table books with an ornate brass paperweight on table",
      // v3 — forest green velvet sofa + tufted ottoman + eclectic gallery floor display
      "A collector's paradise where fearless color meets layered opulence. FOREGROUND: curved three-seat sofa in deep forest green velvet with rolled arms and brass castors 240cm wide facing center, round tufted ottoman in burnt orange velvet as coffee table 80cm diameter, oversized hand-knotted rug in jewel-toned geometric pattern with teal navy and gold 200x300cm. LATERAL: tall hammered brass floor lamp with pleated teal silk shade beside sofa end, small lacquered red side table with stack of vintage hardcovers and brass telescope. BACKGROUND: three mismatched framed prints propped on floor at different heights against baseboard, large potted bird of paradise in hand-painted ceramic pot. ACCENTS: animal print velvet and bold geometric stripe cushions on sofa, ornate brass incense burner on ottoman",
    ],
    accentPalettes: [
      "animal print velvet and bold geometric stripe",
      "magenta and emerald",
      "burnt orange and deep teal",
    ],
  },

  haussmannian: {
    furnitureVariants: [
      // v1 — current: dove grey linen sofa, French bergere chair, brass pharmacy lamp
      "A refined Parisian apartment where classic elegance meets understated comfort — timeless proportions and quiet luxury. FOREGROUND: elegant three-seat sofa in soft dove grey linen with low rolled arms and dark walnut turned legs 230cm wide facing center, warm-toned Persian-inspired area rug in muted rose ivory and navy 200x300cm. LATERAL: classic French bergere armchair in cream linen with dark walnut frame angled toward sofa, round marble-top gueridon side table with dark patinated brass legs 50cm, classic brass pharmacy floor lamp with cream shade. BACKGROUND: tall dark walnut bookcase with brass gallery rail 180cm as anchor with leather-bound books and small brass objects, white marble mantel clock and brass candlesticks on bookcase, potted white orchid in aged brass cachepot. ACCENTS: two cushions in dusty rose and soft sage velvet on sofa",
      // v2 — ivory linen sofa + Louis XV armchair + marble console
      "A luminous Parisian interior with classical restraint and gilded details. FOREGROUND: three-seat sofa in ivory linen with gentle cabriole legs in dark walnut 230cm wide facing center, oval dark walnut coffee table with marble top and fluted legs 110cm, Aubusson-inspired area rug in faded blue ivory and pale rose 200x300cm. LATERAL: Louis XV-style fauteuil in pale blue velvet with carved gilded frame angled toward sofa, tall crystal and brass table lamp with ivory silk gathered shade on gueridon beside chair. BACKGROUND: dark walnut marble-top console demi-lune 120cm with gilt-framed oval mirror leaning against wall above, pair of silver candlesticks and porcelain vase with white peonies on console. ACCENTS: dusty rose and soft sage velvet cushions on sofa, small leather-bound book and brass magnifying glass on coffee table",
      // v3 — sage green velvet sofa + caned chair + brass gallery elements
      "An intimate Parisian salon with literary charm and velvet warmth. FOREGROUND: three-seat sofa in soft sage green velvet with dark walnut fluted legs 220cm wide facing center, rectangular dark walnut coffee table with brass corner caps and inlaid leather top 120cm, vintage Savonnerie-style area rug in cream gold and muted green 200x300cm. LATERAL: caned-back dark walnut armchair with cream linen cushion angled toward sofa, brass bouillotte table lamp with dark green tole shade 45cm on a small round pedestal table. BACKGROUND: tall dark walnut secretaire desk with brass drop-front 110cm displaying stacked leather journals and an inkwell, potted trailing ivy in aged stone urn on floor beside secretaire. ACCENTS: dusty rose and soft sage velvet cushions on sofa, small brass letter opener and crystal paperweight on coffee table",
    ],
    accentPalettes: [
      "dusty rose and soft sage velvet",
      "pale blue and gilded cream",
      "muted green and warm brass",
    ],
  },
};

/** Select variant deterministically based on image hash + style */
export function selectVariant(
  imageHash: string,
  styleId: string
): { furniturePrompt: string; accentPalette: string } {
  const variants = STYLE_VARIANTS[styleId];
  if (!variants)
    return { furniturePrompt: "", accentPalette: "" };

  // Simple hash function for deterministic selection
  let hash = 0;
  const key = imageHash + styleId;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash);

  return {
    furniturePrompt:
      variants.furnitureVariants[idx % variants.furnitureVariants.length],
    accentPalette:
      variants.accentPalettes[idx % variants.accentPalettes.length],
  };
}

/** Get all variant options for a style (for UI preview or manual selection) */
export function getStyleVariants(styleId: string): StyleVariants | null {
  return STYLE_VARIANTS[styleId] ?? null;
}

/** List all style IDs that have variants defined */
export function getAvailableStyleIds(): string[] {
  return Object.keys(STYLE_VARIANTS);
}
