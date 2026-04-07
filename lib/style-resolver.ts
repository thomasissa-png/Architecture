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
      "A serene Nordic living space centered around a low conversation area with warm textiles and natural light. Scandinavian furniture with clean geometric lines: large straight three-seat sofa in oatmeal boucle with low squared arms and birch legs 230cm wide, light ash lounge chair with woven paper cord seat and curved back (Wegner-style) as accent piece, light birch rectangular coffee table with slim tapered legs 120cm, cream wool loop-pile area rug 200x300cm, slim matte black asymmetric floor lamp with angled cone shade in warm white (AJ-style), sheepskin throw draped over one sofa arm, white ceramic ribbed vases and taper candles on the table, small round birch side table with stacked design books, potted trailing pothos in light grey stoneware planter, dried birch branches in a tall cylindrical stoneware vase, two woven wool cushions with simple geometric Nordic pattern in muted blue and warm grey",
  },
  contemporary: {
    id: "contemporary",
    surfacePrompt:
      "Contemporary modern: walls in light neutral grey that preserves the EXACT warm/cool temperature of the input walls — neutralize saturation only, do not shift hue, light grey engineered stone flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, minimal recessed or flush-mount ceiling light in brushed chrome",
    furniturePrompt:
      "A refined editorial interior with sculptural accents and restrained luxury. Contemporary furniture: large low-profile L-shaped sectional sofa in charcoal premium bouclé with slim brushed steel legs 280cm, sculptural smoked glass coffee table on brushed brass pedestal base 110cm, heathered grey thick wool area rug 250x350cm, brushed brass floor lamp with asymmetric flat disc shade 30cm diameter on slim curved stem (Flos IC-style), single large abstract canvas sitting on the floor leaning against the baseboard NOT hung on the wall, architectural coffee table books in a neat stack, tall matte white sculptural ceramic object on a slim black metal pedestal, potted architectural snake plant in matte black cylinder planter, two charcoal and cream geometric cushions",
  },
  industrial: {
    id: "industrial",
    surfacePrompt:
      "Industrial loft: preserve existing wall finish and texture, keep the same overall brightness as the input photo, smooth grey concrete floor with matte waxed finish. If — and only if — the input shows visible structural beams, IPN, or steel girders, preserve them in their exact position with their raw industrial finish (rust patina, factory paint). Otherwise apply a flat painted ceiling matching the existing ceiling shape. Matte black industrial pendant light with metal shade and visible Edison filament bulb",
    furniturePrompt:
      "A raw loft space with character — worn materials, generous volumes, and creative confidence. Industrial furniture: large three-seat worn leather sofa in cognac with visible patina stitching and riveted seams 230cm wide, reclaimed wood and black welded steel rectangular coffee table 130cm, faded vintage Persian rug in muted red and navy 200x300cm, raw steel open-frame bookshelf with visible welds 180cm tall with books and aged brass objects, oversized vintage industrial clock on the top shelf as signature piece, black metal factory stool as side table, potted large fiddle leaf fig in corrugated metal container, leather and black steel butterfly chair, aged brass industrial desk lamp on the bookshelf, two weathered leather cushions",
  },
  japandi: {
    id: "japandi",
    surfacePrompt:
      "Japandi: soft off-white walls with very very subtle warm-neutral undertone keeping the same overall brightness as the input photo, light ash wide-plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, round washi paper pendant light in natural off-white",
    furniturePrompt:
      "A meditative room with deliberately sparse furnishing and balanced asymmetry — every empty space is intentional. Japandi furniture with precise geometric lines and balanced asymmetry: low-profile platform sofa with clean lines in natural undyed linen in ecru with exposed light ash wood frame 220cm wide, light ash rectangular coffee table with rounded edges and short legs 100cm, flat-weave natural fiber rug in straw tone 200x250cm, single ikebana dried branch arrangement in geometric cylindrical ceramic vase, floor cushion in muted clay tone beside the table, minimal round side table in light ash 40cm with black cast iron teapot (tetsubin) as signature piece, potted single-stem orchid in unglazed charcoal pottery, thin cashmere throw in sand tone draped over one sofa arm, intentional negative space with only 30 percent of room furnished",
  },
  "art-deco": {
    id: "art-deco",
    surfacePrompt:
      "Art Deco: off-white walls with smooth finish keeping the same overall brightness as the input photo, dark stained herringbone parquet flooring, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, brass and frosted glass geometric pendant chandelier",
    furniturePrompt:
      "An opulent salon with geometric precision and theatrical glamour — every surface gleams. Art Deco furniture: channel-tufted velvet sofa in deep emerald green with polished brass legs 230cm wide arranged symmetrically in the room, round polished brass coffee table with smoked glass top on pedestal base 90cm diameter, geometric patterned area rug in black gold and cream 200x300cm, fluted dark lacquer drinks cabinet with brass handles 120cm tall, marble-top brass side table with crystal decanter and gold-rimmed glasses, tall brass floor lamp with pleated cream silk shade, brass sunburst mirror leaning against the wall resting on top of the drinks cabinet as signature piece, potted areca palm in polished brass planter, matching pair of brass table lamps on side tables flanking the sofa, velvet cushions in sapphire and gold with geometric patterns",
  },
  "mid-century": {
    id: "mid-century",
    surfacePrompt:
      "Mid-Century Modern: soft off-white walls with very subtle neutral undertone keeping the same overall brightness as the input photo, medium walnut-toned wood plank flooring with satin finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, Sputnik-style brass and black multi-arm ceiling pendant",
    furniturePrompt:
      "A sunlit retro living room with optimistic colors and iconic design pieces — everything has legs and light passes beneath. Mid-Century Modern furniture, all pieces raised on legs with visible daylight beneath: curved organic sofa in mustard woven fabric with walnut tapered legs 220cm wide, sculptural free-form walnut coffee table with biomorphic shape 120cm, warm-toned geometric area rug in cream mustard and teal 200x300cm, walnut credenza with sliding doors and brass pulls 160cm wide as background anchor, black leather and walnut bentwood lounge chair with matching ottoman, walnut and brass tripod floor lamp with natural linen cone shade (60s-style), potted fiddle leaf fig in warm terracotta planter, stacked vintage design books and small brass starburst clock on the credenza, two cushions in teal and burnt orange",
  },
  bohemian: {
    id: "bohemian",
    surfacePrompt:
      "Bohemian: soft off-white walls keeping the same overall brightness as the input photo, honey-toned wood plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, woven rattan pendant light in natural tone",
    furniturePrompt:
      "A warm nomadic retreat layered with textiles, plants, and worldly treasures — relaxed and deeply personal. Bohemian furniture: deep relaxed linen sofa with slouchy cushions in natural ecru with layered kilim and mudcloth cushions in terracotta rust and indigo 220cm wide, round kilim-upholstered pouf 50cm diameter as signature floor seat, round reclaimed wood coffee table with organic edge 90cm diameter, faded vintage Persian rug layered over natural jute rug 200x300cm, rattan peacock chair with sheepskin throw draped over, two trailing pothos in terracotta pots and one monstera in a woven basket, small brass Moroccan-style pierced lantern on the floor, wooden tray with pillar candles and dried pampas grass on the table, tall freestanding natural wood tripod plant stand with trailing pothos",
  },
  mediterranean: {
    id: "mediterranean",
    surfacePrompt:
      "Mediterranean: white lime-plaster walls with subtle hand-troweled texture keeping the same overall brightness as the input photo, walls must stay close to input brightness and not darken or shift to ochre, pale terracotta or travertine floor tiles with natural veining, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers. If — and only if — the input already shows visible ceiling beams, whitewash them in place without relocating them. Otherwise apply a flat whitewashed ceiling matching the existing ceiling shape. Wrought iron pendant lantern with aged patina",
    furniturePrompt:
      "A sun-drenched southern interior where time slows down — natural materials, artisan textures, and quiet elegance. Mediterranean furniture: deep generous three-seat natural linen sofa with loose slipcover in off-white 230cm wide, rustic olive wood coffee table with natural live edge 110cm, woven esparto grass rug in natural tone 200x300cm, patinated wrought iron side table with curved legs and glazed turquoise ceramic bowl, handwoven rush-seat wooden chair as accent piece, large olive branches in a rustic terracotta amphora jar 80cm tall, glazed ceramic plates and bowls as decor on the table in cobalt and terracotta, linen cushions in sand and sun-bleached blue, potted rosemary and trailing jasmine in terracotta pots",
  },
  cosy: {
    id: "cosy",
    surfacePrompt:
      "Modern cozy: soft off-white walls with very subtle neutral-cream undertone keeping the same overall brightness as the input photo, light oak wide-plank flooring with matte finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, fabric drum pendant light in natural cream tone",
    furniturePrompt:
      "A cocooning nest where warmth is layered — soft throws, candlelight, and textures you want to sink into. Modern cozy furniture densely layered with mixed textures, all rounded organic forms: generously proportioned three-seat boucle sofa in cream 260cm wide with chunky knit throw in cream wool draped over sofa arm and soft sheepskin draped over seat, camel boucle armchair, round light oak coffee table 100cm diameter with cluster of 3 pillar candles on wooden tray and stack of hardcover books with earth-tone covers, layered cushions in mixed textures velvet linen and boucle in cream camel and cognac, cream wool area rug 200x300cm, warm ceramic table lamp with linen drum shade on oak side table, string of pearls in cream ribbed ceramic hanging planter",
  },
  "wabi-sabi": {
    id: "wabi-sabi",
    surfacePrompt:
      "Wabi-sabi: soft matte cool-neutral grey walls keeping the same overall brightness as the input photo, natural stone or aged concrete flooring with subtle worn texture, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, simple ceramic pendant in natural unglazed finish",
    furniturePrompt:
      "A quiet room where objects show their age — rough surfaces, visible wear, and the beauty of less. Wabi-sabi furniture with nothing symmetrical, every object placed with studied asymmetry: raw linen sofa visibly wrinkled and creased in undyed flax tone with low dark weathered reclaimed wood frame 200cm wide, weathered oak rectangular coffee table with visible wood grain and worn edges 120cm, rough textured wool rug in undyed natural fiber 180x250cm, aged reclaimed wood bench with visible wear marks 100cm, single dark charcoal tea bowl with crackle glaze on the table as signature kintsugi-inspired piece, handmade asymmetric ceramic vase with single dried branch, smooth river stone as sculptural object on the floor, leave at least 60 percent of the floor area completely empty for serene intentional space",
  },
  maximalist: {
    id: "maximalist",
    surfacePrompt:
      "Maximalist eclectic: for living rooms, dining rooms, bedrooms, offices, and entryways apply a rich deep teal accent on the largest visible wall with remaining walls in off-white keeping the same overall brightness as the input photo; for bathrooms, kitchens, WC, laundry, and cellars keep all walls in off-white only with no accent wall, polished dark wood flooring, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers, dramatic sculptural pendant light in brass with colored glass elements",
    furniturePrompt:
      "A bold, personality-filled room where more is more — vibrant colors, mixed patterns, and curated eclecticism. Maximalist furniture: bold jewel-toned velvet sofa in deep cobalt blue with curved sculptural back and brass legs 230cm wide, round lacquered coral coffee table on brass circular frame 100cm, layered rugs mixing faded vintage Persian and contemporary bold graphic patterns 200x300cm, two framed art prints propped on the floor against the baseboard, sculptural brass floor lamp with oversized colored shade, one cushion in animal print velvet and one in bold geometric stripe, large potted monstera in colorful glazed ceramic pot, brass and marble side table with stacked art books and two curated objects, vintage brass tray with pillar candles on the coffee table, ornate vintage brass candlestick holder on the side table",
  },
  haussmannian: {
    id: "haussmannian",
    surfacePrompt:
      "Haussmannian Parisian: soft off-white walls keeping the same overall brightness as the input photo, classic light oak herringbone parquet flooring with satin finish, white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers — if existing crown moldings and cornices are visible in the input, preserve them in place, classic French chandelier with crystal drops and gilt bronze arms 60cm diameter",
    furniturePrompt:
      "A refined Parisian apartment where classic elegance meets understated comfort — timeless proportions and quiet luxury. Haussmannian Parisian furniture: elegant three-seat sofa in soft dove grey linen with low rolled arms and dark walnut turned legs 230cm wide, round marble-top gueridon side table with dark patinated brass legs 50cm, classic French bergere armchair in cream linen with dark walnut frame as accent piece, warm-toned Persian-inspired area rug in muted rose ivory and navy 200x300cm, tall dark walnut bookcase with brass gallery rail 180cm as background anchor with leather-bound books and small brass objects, classic brass pharmacy floor lamp with cream shade, white marble mantel clock and brass candlesticks on the bookcase, potted white orchid in aged brass cachepot, two cushions in dusty rose and soft sage velvet",
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
