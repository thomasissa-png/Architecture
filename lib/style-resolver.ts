/**
 * F4 — Server-side style resolver.
 *
 * Duplicates the style prompt data from StylePicker.tsx and outdoor-styles.ts
 * for use in server-side batch generation (Mode Pro).
 *
 * Why duplicate instead of importing StylePicker? StylePicker is a "use client"
 * component — importing it in a server context causes issues with React hooks
 * and client-only APIs. The style data is stable (changes only on sprint updates)
 * so duplication is acceptable.
 *
 * P0-A v58 (session 37) — the 12 indoor furniturePrompts here MUST stay in sync
 * with `components/StylePicker.tsx`. Both files describe the same 12 styles with
 * Sprint 17+ "vary pieces each generation" + FOREGROUND/LATERAL/BACKGROUND/ACCENTS
 * structure. Any update to a furniturePrompt in StylePicker.tsx must be propagated
 * here ligne par ligne.
 */

import { OUTDOOR_STYLES } from "@/lib/outdoor-styles";
import { selectVariant } from "@/lib/style-variants";

export interface StylePrompts {
  id: string;
  surfacePrompt: string;
  furniturePrompt: string;
}

// ─── Indoor styles (mirror of STYLES in StylePicker.tsx) ─────────────
const INDOOR_STYLES: Record<string, StylePrompts> = {
  scandinavian: {
    id: "scandinavian",
    surfacePrompt:
      "Scandinavian minimalist: soft white walls keeping the same overall brightness as the input photo, wide-plank whitewashed ash flooring with visible natural grain and knots matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, matte white tiered pendant light with soft diffused glow 45cm diameter (PH5-style layered shade)",
    furniturePrompt:
      "A serene Nordic living space — vary furniture placement and pieces each generation. FOREGROUND: large three-seat sofa 230cm wide facing center (choose one: oatmeal bouclé with birch legs, light grey linen with white oak legs, undyed wool with ash legs) — place against longest wall OR floating in room center. Coffee table in front of sofa (choose one: light birch rectangular 120cm with tapered legs, round white oak 90cm on slim pedestal, oval ash 110cm with rounded edges). Cream wool area rug 200x300cm. LATERAL: accent chair angled toward sofa (choose one: Wegner-style ash with paper cord seat, light oak Windsor with spindle back, white laminated shell chair on wood legs). BACKGROUND: small side table with stacked books and ceramic vases, potted plant (choose one: trailing pothos in grey stoneware, small fiddle leaf in white ceramic, eucalyptus branches in tall stoneware vase). ACCENTS: floor lamp beside chair (choose one: AJ-style matte black, white arc lamp with marble base, birch tripod with linen shade), sheepskin throw on one sofa arm, taper candles on table, two woven wool cushions in muted blue and warm grey",
  },
  contemporary: {
    id: "contemporary",
    surfacePrompt:
      "Contemporary modern: walls in light neutral grey that preserves the EXACT warm/cool temperature of the input walls — neutralize saturation only, do not shift hue, light grey engineered stone flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, minimal recessed or flush-mount ceiling light in brushed chrome",
    furniturePrompt:
      "A refined editorial interior with sculptural accents — vary pieces and layout each generation. FOREGROUND: large low-profile sofa 260-280cm facing center (choose one: L-shaped charcoal bouclé with brushed steel legs, straight three-seat slate grey wool with chrome legs, curved modular in greige linen with black metal base) — place against wall OR floating. Coffee table (choose one: sculptural smoked glass on brass pedestal 110cm, matte black stone oval 120cm, white Carrara marble round 90cm). Heathered grey wool rug 250x350cm. LATERAL: floor lamp beside sofa (choose one: Flos IC-style brushed brass, matte black arc with flat disc shade, chrome stem with frosted globe). BACKGROUND: sculptural object on slim pedestal (choose one: matte white ceramic, dark bronze abstract form, smoked glass sphere), potted plant (choose one: snake plant in black cylinder, ZZ plant in grey concrete pot, single olive branch in tall glass vase), one large abstract canvas on floor leaning against baseboard. ACCENTS: coffee table books, two geometric cushions in charcoal and cream",
  },
  industrial: {
    id: "industrial",
    surfacePrompt:
      "Industrial loft: preserve existing wall finish and texture, keep the same overall brightness as the input photo, smooth grey concrete floor with matte waxed finish. If — and only if — the input shows visible structural beams, IPN, or steel girders, preserve them in their exact position with their raw industrial finish (rust patina, factory paint). Otherwise apply a flat painted ceiling matching the existing ceiling shape. Matte black industrial pendant light with metal shade and visible Edison filament bulb",
    furniturePrompt:
      "A raw loft space with character — vary worn materials and layout each generation. FOREGROUND: large three-seat sofa 230cm wide facing center (choose one: worn cognac leather with visible patina, dark olive canvas with riveted arms, distressed charcoal leather with brass studs) — place against wall OR floating in center. Coffee table (choose one: reclaimed wood and black welded steel 130cm, industrial cast iron and salvaged oak 120cm, zinc-top table on riveted steel legs 110cm). Faded vintage rug 200x300cm (choose one: Persian in muted red and navy, Turkish kilim in faded ochre and grey, patchwork leather in brown tones). LATERAL: accent seat (choose one: leather and steel butterfly chair, worn leather club armchair, riveted metal and wood bench 90cm), factory stool as side table. BACKGROUND: raw steel bookshelf 180cm with books and brass objects (choose one: oversized vintage clock, antique maritime brass compass, framed blueprint) as signature piece. ACCENTS: potted plant (choose one: fiddle leaf in corrugated metal, tall cactus in concrete pot, rubber plant in aged brass bucket), two weathered leather cushions on sofa",
  },
  japandi: {
    id: "japandi",
    surfacePrompt:
      "Japandi: soft off-white walls with very very subtle warm-neutral undertone keeping the same overall brightness as the input photo, light ash wide-plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, round washi paper pendant light in natural off-white",
    furniturePrompt:
      "A meditative room with balanced asymmetry — vary pieces and placement each generation. FOREGROUND: low-profile sofa 220cm wide (choose one: platform in undyed linen ecru with ash frame, low futon-style in warm grey cotton with walnut base, minimal daybed in natural hemp with black steel frame) — place off-center OR along longest wall. Coffee table (choose one: light ash rectangular 100cm with rounded edges, dark walnut round 80cm on short legs, raw stone slab on low oak base 90cm). Flat-weave natural fiber rug 200x250cm in straw tone. LATERAL: floor element beside table (choose one: floor cushion in muted clay, zabuton meditation cushion in charcoal, low round rattan stool 35cm), ikebana arrangement (choose one: dried branch in cylindrical ceramic vase, single stem in dark stoneware, wild grass in rough clay pot). BACKGROUND: side table in light ash 40cm with signature piece (choose one: black tetsubin teapot, handmade raku bowl, stacked ceramic cups). ACCENTS: thin cashmere throw in sand on one sofa arm. Intentional negative space — at least 60 percent of floor visible",
  },
  "art-deco": {
    id: "art-deco",
    surfacePrompt:
      "Art Deco: off-white walls with smooth finish keeping the same overall brightness as the input photo, dark stained herringbone parquet flooring, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, brass and frosted glass geometric pendant chandelier",
    furniturePrompt:
      "An opulent salon with geometric precision — vary furniture and layout each generation. FOREGROUND: channel-tufted velvet sofa 230cm wide centered (choose one: deep emerald green with brass legs, midnight navy with gold legs, burgundy wine with chrome legs). Coffee table (choose one: round polished brass with smoked glass 90cm, octagonal black lacquer with gold inlay 100cm, oval mirrored top on brass frame 110cm). Geometric rug 200x300cm in black gold and cream. LATERAL: side table (choose one: marble-top brass, mirrored with chrome frame, onyx round on brass pedestal) with crystal decanter, floor lamp (choose one: tall brass with pleated cream silk shade, Art Deco torchiere in chrome, fluted glass column lamp with brass cap). BACKGROUND: drinks cabinet 120cm (choose one: fluted dark lacquer with brass handles, mirrored with geometric brass frame, high-gloss black with gold trim), signature piece on cabinet (choose one: brass sunburst mirror, geometric crystal sculpture, vintage brass mantel clock). ACCENTS: potted palm (choose one: areca in brass planter, kentia in gold ceramic, fan palm in lacquered pot), velvet cushions in sapphire and gold on sofa",
  },
  "mid-century": {
    id: "mid-century",
    surfacePrompt:
      "Mid-Century Modern: soft off-white walls with very subtle neutral undertone keeping the same overall brightness as the input photo, medium walnut-toned wood plank flooring with satin finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, Sputnik-style brass and black multi-arm ceiling pendant",
    furniturePrompt:
      "A retro living room — everything has legs and light passes beneath. Vary pieces and layout each generation. FOREGROUND: curved organic sofa 220cm facing center (choose one: mustard woven fabric with walnut legs, burnt orange tweed with teak legs, olive green wool with rosewood legs) — place centered OR off-center with open side. Coffee table (choose one: sculptural walnut biomorphic 120cm, round teak with splayed legs 90cm, kidney-shaped glass on brass hairpin legs 110cm). Geometric rug 200x300cm in cream mustard and teal. LATERAL: lounge chair angled toward sofa (choose one: black leather and walnut bentwood with ottoman, molded plywood shell in white with rosewood base, teak-frame with orange cushion), tripod floor lamp (choose one: walnut and brass with linen cone shade, teak with ceramic base 60s-style, black metal with globe shade). BACKGROUND: credenza as anchor (choose one: walnut with sliding doors 160cm, teak with hairpin legs 150cm, rosewood with brass handles 140cm), signature piece on credenza (choose one: brass starburst clock, ceramic sunburst platter, vintage globe). ACCENTS: potted plant (choose one: fiddle leaf in terracotta, rubber plant in mustard ceramic, bird of paradise in teak planter), two cushions in teal and burnt orange",
  },
  bohemian: {
    id: "bohemian",
    surfacePrompt:
      "Bohemian: soft off-white walls keeping the same overall brightness as the input photo, honey-toned wood plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, woven rattan pendant light in natural tone",
    furniturePrompt:
      "A warm nomadic retreat layered with textiles and worldly treasures — vary pieces and layout each generation. FOREGROUND: deep relaxed sofa 220cm wide (choose one: natural ecru linen with slouchy cushions, sun-faded indigo cotton with fringe arms, warm clay-toned canvas with embroidered bolsters) with kilim and mudcloth cushions — place along wall OR at an angle. Coffee table (choose one: round reclaimed wood with organic edge 90cm, carved wooden trunk 100cm, hammered brass tray table 80cm on folding legs). Layered rugs 200x300cm (choose one: faded Persian over jute, vintage kilim over sisal, Moroccan boucherouite over hemp). LATERAL: accent seat (choose one: rattan peacock chair, vintage cane plantation chair, low wooden daybed with cushions), round pouf 50cm (choose one: kilim-upholstered, leather Moroccan, woven jute). BACKGROUND: plant display (choose one: tall wood tripod stand with trailing pothos, cluster of 3 terracotta pots with mixed greenery, macramé hanger with trailing string of hearts), brass lantern on floor. ACCENTS: wooden tray on table with (choose one: pillar candles and dried pampas, incense holder and small brass bells, dried eucalyptus and beeswax candles)",
  },
  mediterranean: {
    id: "mediterranean",
    surfacePrompt:
      "Mediterranean: white lime-plaster walls with subtle hand-troweled texture keeping the same overall brightness as the input photo, walls must stay close to input brightness and not darken or shift to ochre, pale terracotta or travertine floor tiles with natural veining, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers. If — and only if — the input already shows visible ceiling beams, whitewash them in place without relocating them. Otherwise apply a flat whitewashed ceiling matching the existing ceiling shape. Wrought iron pendant lantern with aged patina",
    furniturePrompt:
      "A relaxed southern interior where time slows down — vary pieces and layout each generation. FOREGROUND: deep three-seat sofa 230cm wide facing center (choose one: natural linen loose slipcover in off-white, washed cotton in pale sand, raw hemp in warm ecru) — place against wall OR floating. Coffee table (choose one: rustic olive wood live edge 110cm, round travertine on iron base 90cm, reclaimed pine farmhouse table 120cm). Woven rug 200x300cm (choose one: esparto grass in natural tone, seagrass in warm straw, flat-weave cotton in sun-bleached stripe). LATERAL: accent chair (choose one: handwoven rush-seat wooden chair, painted blue bistro chair, low rattan armchair with linen cushion), wrought iron side table with ceramic bowl (choose one: turquoise glaze, cobalt blue, terracotta with white slip). BACKGROUND: statement vessel (choose one: olive branches in terracotta amphora 80cm, dried lavender in large glazed urn, lemon branches in blue ceramic pitcher), potted herbs (choose one: rosemary and jasmine, thyme and geranium, sage and bougainvillea). ACCENTS: ceramic plates in cobalt and terracotta on table, linen cushions in sand and sun-bleached blue",
  },
  cosy: {
    id: "cosy",
    surfacePrompt:
      "Modern cozy: soft off-white walls with very subtle neutral-cream undertone keeping the same overall brightness as the input photo, light oak wide-plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, fabric drum pendant light in natural cream tone",
    furniturePrompt:
      "A cocooning nest where warmth is layered — vary textures and layout each generation. FOREGROUND: generously proportioned three-seat sofa 260cm wide (choose one: cream bouclé, warm oatmeal teddy fabric, soft camel velvet) with chunky knit throw and sheepskin — place against wall OR at angle creating a nook. Coffee table (choose one: round light oak 100cm, oval walnut 110cm, round travertine 90cm) with cluster of pillar candles on tray and hardcover books. LATERAL: armchair angled toward sofa (choose one: camel bouclé, cream shearling, warm grey chenille) with sheepskin on seat. BACKGROUND: side table with table lamp (choose one: ceramic with linen drum shade on cream stoneware, amber glass with linen shade, turned wood with cream shade), plant (choose one: string of pearls in ribbed ceramic, trailing ivy in woven basket, small olive tree in cream pot). FLOOR: wool area rug 200x300cm (choose one: cream loop-pile, warm sand flat-weave, heathered oatmeal). ACCENTS: 3 layered cushions on sofa (choose one set: velvet cognac + linen + bouclé cream, dusty rose + cream wool + camel, terracotta + sand + cream knit), pillar candles, chunky throw on arm",
  },
  "wabi-sabi": {
    id: "wabi-sabi",
    surfacePrompt:
      "Wabi-sabi: soft matte cool-neutral grey walls keeping the same overall brightness as the input photo, natural stone or aged concrete flooring with subtle worn texture, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, simple ceramic pendant in natural unglazed finish",
    furniturePrompt:
      "A quiet room where objects show their age — vary pieces and placement each generation. FOREGROUND: sofa 200cm wide (choose one: raw wrinkled linen in undyed flax with weathered wood frame, rough hemp in warm grey with dark reclaimed timber base, aged cotton canvas in stone tone with blackened steel frame) — place off-center asymmetrically. Coffee table (choose one: weathered oak rectangular 120cm with worn edges, raw stone slab on driftwood base 100cm, aged elm round with visible cracks 80cm). Rough textured wool rug 180x250cm in undyed natural fiber. LATERAL: accent piece placed asymmetrically (choose one: aged reclaimed wood bench 100cm, weathered concrete block as seat 60cm, dark elm low stool with patina). BACKGROUND: floor object (choose one: handmade asymmetric ceramic vase with single dried branch, rough unglazed pottery with wild grass, tall driftwood piece standing alone), sculptural element (choose one: smooth river stone, worn wooden sphere, stacked flat stones). ACCENTS: signature piece on table (choose one: dark charcoal tea bowl with crackle glaze kintsugi-inspired, rough clay cup with gold repair line, hand-shaped ceramic dish). At least 60 percent of floor visible",
  },
  maximalist: {
    id: "maximalist",
    surfacePrompt:
      "Maximalist eclectic: for living rooms, dining rooms, bedrooms, offices, and entryways apply a rich deep teal accent on the largest visible wall with remaining walls in off-white keeping the same overall brightness as the input photo; for bathrooms, kitchens, WC, laundry, and cellars keep all walls in off-white only with no accent wall, polished dark wood flooring, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, dramatic sculptural pendant light in brass with colored glass elements",
    furniturePrompt:
      "A bold personality-filled room where more is more — vary colors and pieces each generation. FOREGROUND: bold velvet sofa 230cm wide with curved back and brass legs (choose one: deep cobalt blue, rich magenta, emerald with gold piping) — place centered OR at dramatic angle. Coffee table (choose one: round lacquered coral on brass frame 100cm, oval high-gloss black with gold legs 110cm, round mirrored top on sculptural brass base 90cm). Layered rugs 200x300cm mixing vintage Persian and bold graphic patterns. LATERAL: floor lamp (choose one: sculptural brass with oversized colored shade, ceramic in bold pattern with silk shade, twisted brass with jewel-tone glass globe), side table with art books and (choose one: ornate brass candlestick, colorful ceramic sculpture, vintage brass clock). BACKGROUND: art on floor against baseboard (choose one: two bold framed prints, one oversized abstract canvas, three mixed-size frames), potted plant (choose one: monstera in colorful glazed pot, tall banana leaf in cobalt planter, large fern in patterned ceramic). ACCENTS: vintage brass tray with candles on table, two cushions on sofa (choose one set: animal print + geometric stripe, ikat + bold floral, velvet color-block + embroidered ethnic)",
  },
  haussmannian: {
    id: "haussmannian",
    surfacePrompt:
      "Haussmannian Parisian: soft off-white walls keeping the same overall brightness as the input photo, classic light oak herringbone parquet flooring with satin finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers — if existing crown moldings and cornices are visible in the input, preserve them in place, classic French chandelier with crystal drops and gilt bronze arms 60cm diameter",
    furniturePrompt:
      "A refined Parisian apartment with timeless proportions — vary pieces and layout each generation. FOREGROUND: elegant three-seat sofa 230cm wide facing center (choose one: soft dove grey linen with rolled arms and walnut legs, cream cotton with channel-tufted back and dark wood feet, pale sage velvet with slim brass legs) — place facing fireplace OR centered in room. Rug 200x300cm (choose one: warm Persian-inspired in muted rose ivory and navy, Aubusson-style in faded blue and cream, classic French medallion in soft gold and ivory). LATERAL: armchair angled toward sofa (choose one: French bergère in cream linen with walnut frame, Louis XV-style in pale grey velvet, cane-back fauteuil with linen cushion), guéridon side table (choose one: round marble-top with brass legs 50cm, oval dark walnut with gallery edge, round gilt wood with marble inset), floor lamp (choose one: brass pharmacy with cream shade, gilt bronze candlestick style, slim brass with pleated silk shade). BACKGROUND: tall bookcase 180cm as anchor (choose one: dark walnut with brass gallery rail, painted grey with crown molding detail, black with gilt trim), signature piece on bookcase (choose one: white marble mantel clock, pair of brass candlesticks, small classical bust). ACCENTS: potted orchid (choose one: white in aged brass cachepot, pink in white porcelain, white in grey stone pot), two cushions in dusty rose and soft sage velvet",
  },
};

// ─── Public API ──────────────────────────────────────────────────────

export function getStyleById(
  styleId: string,
  isOutdoor: boolean = false,
  imageHash?: string
): StylePrompts | null {
  if (isOutdoor) {
    const style = OUTDOOR_STYLES[styleId];
    if (!style) return null;
    return {
      id: style.id,
      surfacePrompt: style.surfacePrompt,
      furniturePrompt: style.furniturePrompt,
    };
  }

  const style = INDOOR_STYLES[styleId];
  if (!style) return null;

  // Use style variant if available and imageHash provided
  if (imageHash) {
    const variant = selectVariant(imageHash, styleId);
    if (variant.furniturePrompt) {
      return {
        ...style,
        furniturePrompt: variant.furniturePrompt,
      };
    }
  }

  return style;
}

export function getAllIndoorStyles(): StylePrompts[] {
  return Object.values(INDOOR_STYLES);
}

export function getAllOutdoorStyles(): StylePrompts[] {
  return Object.values(OUTDOOR_STYLES).map((s) => ({
    id: s.id,
    surfacePrompt: s.surfacePrompt,
    furniturePrompt: s.furniturePrompt,
  }));
}
