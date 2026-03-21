"use client";

import { useState } from "react";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  surfacePrompt: string;
  furniturePrompt: string;
  emoji: string;
}

const STYLES: StyleOption[] = [
  {
    id: "scandinavian",
    name: "Scandinave",
    description: "Bois clair, tons neutres, épure absolue",
    emoji: "🪵",
    surfacePrompt:
      "Scandinavian minimalist: pale matte white walls, light oak hardwood floor in soaped or whitewashed finish with visible grain, smooth white ceiling, simple matte black flush-mount ceiling light",
    furniturePrompt:
      "Scandinavian furniture with clean geometric lines: large straight three-seat sofa in oatmeal boucle with low squared arms and birch legs 230cm wide, light birch rectangular coffee table with slim tapered legs 120cm, cream wool loop-pile area rug 200x300cm, matte black arched floor lamp with rounded matte white dome shade as signature pendant, sheepskin throw draped over one sofa arm, white ceramic ribbed vases and taper candles on the table, small round birch side table with stacked design books, potted trailing pothos in light grey stoneware planter, dried birch branches in a tall cylindrical stoneware vase, two textured linen cushions in dusty blue and warm grey",
  },
  {
    id: "contemporary",
    name: "Contemporain",
    description: "Lignes nettes, palette sobre, modernité",
    emoji: "◻️",
    surfacePrompt:
      "Contemporary modern: warm grey matte walls, large-format light stone tile floor with minimal grout lines, smooth white ceiling, minimal recessed downlights or slim track lighting in matte black",
    furniturePrompt:
      "Contemporary furniture: large low-profile L-shaped sectional sofa in charcoal premium bouclé with slim brushed steel legs 280cm, sculptural smoked glass coffee table on brushed brass pedestal base 110cm, heathered grey thick wool area rug 250x350cm, brushed brass arc floor lamp with frosted globe shade, single large abstract canvas leaning against the wall on the floor, architectural coffee table books in a neat stack, tall matte white sculptural ceramic object on a slim black metal pedestal, potted architectural snake plant in matte black cylinder planter, two charcoal and cream geometric cushions",
  },
  {
    id: "industrial",
    name: "Industriel",
    description: "Métal, béton, volumes bruts sublimés",
    emoji: "⚙️",
    surfacePrompt:
      "Industrial loft: light grey walls with subtle raw concrete texture keeping the same overall brightness as the input photo, smooth grey concrete floor with matte waxed finish, ceiling with original structure preserved, matte black industrial pendant light with metal shade and visible Edison filament bulb",
    furniturePrompt:
      "Industrial furniture: large three-seat worn leather sofa in warm cognac with visible patina stitching and riveted seams 230cm wide, reclaimed wood and black welded steel rectangular coffee table 130cm, faded vintage Persian rug in muted red and navy 200x300cm, raw steel open-frame bookshelf with visible welds 180cm tall with books and aged brass objects, oversized vintage industrial clock on the top shelf as signature piece, black metal factory stool as side table, potted large fiddle leaf fig in corrugated metal container, leather and black steel butterfly chair, aged brass industrial desk lamp on the bookshelf, two weathered leather cushions",
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Minimalisme japonais, chaleur scandinave",
    emoji: "🎋",
    surfacePrompt:
      "Japandi: warm sand-toned limewash walls with subtle plaster texture, light ash wood plank floor with delicate grain, smooth white ceiling, round washi paper pendant light in natural off-white",
    furniturePrompt:
      "Japandi furniture: low-profile platform sofa with clean lines in natural undyed linen with exposed light ash wood frame 220cm wide, light ash rectangular coffee table with rounded edges and short legs 100cm, woven tatami-style rug in natural straw tone 200x250cm, single ikebana dried branch arrangement in hand-thrown irregular ceramic vase, floor cushion in muted clay tone beside the table, minimal round side table in light ash 40cm, single smooth river stone as sculptural object, potted single-stem orchid in unglazed charcoal pottery, intentional negative space with only 30 percent of room furnished",
  },
  {
    id: "art-deco",
    name: "Art Déco",
    description: "Géométrie dorée, velours, luxe années 20",
    emoji: "✨",
    surfacePrompt:
      "Art Deco: warm ivory matte walls with smooth finish keeping the same overall brightness as the input photo, dark stained herringbone parquet refinish on the existing floor, smooth ceiling with clean plaster edge, brass and frosted glass geometric pendant chandelier",
    furniturePrompt:
      "Art Deco furniture: channel-tufted velvet sofa in deep emerald green with polished brass legs 230cm wide arranged symmetrically in the room, round polished brass coffee table with smoked glass top on pedestal base 90cm diameter, geometric patterned area rug in black gold and cream 200x300cm, fluted dark lacquer drinks cabinet with brass handles 120cm tall, marble-top brass side table with crystal decanter and gold-rimmed glasses, tall brass floor lamp with pleated cream silk shade, brass sunburst mirror leaning against the wall on the drinks cabinet as signature piece, potted areca palm in polished brass planter, matching pair of brass table lamps on side tables flanking the sofa, velvet cushions in sapphire and gold with geometric patterns",
  },
  {
    id: "mid-century",
    name: "Mid-Century",
    description: "Lignes organiques, bois chaud, vintage chic",
    emoji: "🪑",
    surfacePrompt:
      "Mid-Century Modern: warm white walls with slight cream undertone, warm walnut-toned wood floor with medium grain, smooth white ceiling, Sputnik-style brass and black multi-arm ceiling light",
    furniturePrompt:
      "Mid-Century Modern furniture: curved organic sofa in mustard woven fabric with walnut tapered legs 220cm wide, sculptural free-form walnut coffee table with biomorphic shape 120cm, warm-toned geometric area rug in cream mustard and teal 200x300cm, walnut credenza with sliding doors and brass pulls 160cm wide against the wall, black leather and walnut bentwood lounge chair with matching ottoman, brass arc floor lamp with white dome shade, potted fiddle leaf fig in warm terracotta planter, stacked vintage design books and small brass starburst clock on the credenza, two cushions in teal and burnt orange",
  },
  {
    id: "bohemian",
    name: "Bohème",
    description: "Textiles ethniques, plantes, chaleur nomade",
    emoji: "🌿",
    surfacePrompt:
      "Bohemian: warm off-white walls with subtle handmade plaster texture, warm natural wood plank floor with visible knots, smooth white ceiling, woven rattan pendant light in natural tone",
    furniturePrompt:
      "Bohemian furniture: deep low linen sofa in natural ecru with layered kilim and mudcloth cushions in terracotta rust and indigo 220cm wide, round reclaimed wood coffee table with organic edge 90cm diameter, layered rugs — faded vintage Persian rug over natural jute rug 200x300cm, rattan peacock chair with sheepskin throw draped over, woven leather floor pouf in cognac, abundant trailing pothos and monstera in terracotta and woven basket pots, brass Moroccan-style pierced lantern on the floor, wooden tray with pillar candles and dried pampas grass on the table, macramé plant hanger suspended from a freestanding wooden tripod",
  },
  {
    id: "haussmannian",
    name: "Haussmannien",
    description: "Moulures, parquet, élégance parisienne",
    emoji: "🏛️",
    surfacePrompt:
      "Haussmannian Parisian: soft warm grey walls with smooth matte finish keeping the same overall brightness as the input photo, light oak herringbone parquet refinish with classic proportions, smooth white ceiling with clean finish, elegant contemporary pendant light in brass and white glass",
    furniturePrompt:
      "Haussmannian furniture: velvet sofa with curved back and turned dark wood legs in muted sage green 220cm wide, contemporary round white marble coffee table with slim brass legs 90cm diameter, elegant wool area rug in soft grey and cream 200x300cm, upholstered Louis XV-style bergère armchair in dusty blue velvet, oversized gilded frame mirror leaning against the wall on the floor 150cm tall, sculptural contemporary brass floor lamp with linen shade, art books and ceramic objects on the table, potted white orchid in simple white ceramic pot, brass candlesticks on a slim marble console table against the wall",
  },
  {
    id: "mediterranean",
    name: "Méditerranéen",
    description: "Terre cuite, lin blanc, lumière du sud",
    emoji: "☀️",
    surfacePrompt:
      "Mediterranean: warm white limewash walls with subtle hand-applied plaster texture, terracotta tile floor with natural color variation, smooth white ceiling, simple wrought iron pendant light with warm-toned shade",
    furniturePrompt:
      "Mediterranean furniture: deep natural linen sofa with loose slipcover in off-white 230cm wide, rustic olive wood coffee table with natural live edge 110cm, woven esparto grass rug in natural tone 200x300cm, wrought iron side table with glazed turquoise ceramic bowl, handwoven rush-seat wooden chair as accent piece, large olive branches in a rustic terracotta amphora jar 80cm tall, glazed ceramic plates and bowls as decor on the table in cobalt and terracotta, dried lavender bunch in a simple glass bottle, linen cushions in warm sand and sun-bleached blue, potted rosemary and trailing jasmine in terracotta pots",
  },
  {
    id: "cosy",
    name: "Cosy Moderne",
    description: "Textures douces, tons chauds, cocooning",
    emoji: "🛋️",
    surfacePrompt:
      "Modern cozy: warm cream matte walls, light oak or warm-toned wood floor with gentle grain, smooth white ceiling, fabric drum pendant light in warm oatmeal tone with soft diffused glow",
    furniturePrompt:
      "Modern cozy furniture with organic rounded forms: oversized deep boucle sofa in warm cream with plump rounded arms and wide cushioned seats 260cm wide, round light oak coffee table with thick turned legs 100cm diameter, layered wool area rug in cream and soft blush 200x300cm, chunky hand-knit throw blanket in cream draped over one armrest, cushions in cream camel and soft blush textures, natural sheepskin rug draped beside the sofa, soft fabric table lamp with warm glow on a round oak side table, camel boucle reading armchair with cashmere throw, pillar candles and stacked linen-bound books on the coffee table, trailing potted plant on the side table",
  },
  {
    id: "wabi-sabi",
    name: "Wabi-Sabi",
    description: "Imperfection noble, matières brutes, sérénité",
    emoji: "🏺",
    surfacePrompt:
      "Wabi-sabi: raw plaster limewash walls in warm grey with subtle imperfect hand-applied texture, aged reclaimed wood plank floor with visible patina and knots, smooth ceiling in muted warm white, simple handmade ceramic bowl-shaped pendant light in earth tone",
    furniturePrompt:
      "Wabi-sabi furniture: raw linen sofa with natural wrinkles in undyed flax tone with low simple reclaimed wood frame 200cm wide, weathered oak rectangular coffee table with visible wood grain and worn edges 120cm, rough textured wool rug in undyed natural fiber 180x250cm, aged reclaimed wood bench with visible wear marks 100cm, single hand-thrown pottery bowl with wabi-sabi irregular glaze on the table, handmade asymmetric ceramic vase with single dried branch, smooth river stone as sculptural object on the floor, room only 30 percent furnished with intentional serene emptiness",
  },
  {
    id: "maximalist",
    name: "Maximaliste",
    description: "Couleurs vives, motifs audacieux, personnalité",
    emoji: "🎨",
    surfacePrompt:
      "Maximalist eclectic: rich deep teal or plum accent on one wall with remaining walls in warm white keeping the same overall brightness as the input photo, polished dark wood refinish on the existing floor, smooth white ceiling, dramatic sculptural pendant light in brass with colored glass elements",
    furniturePrompt:
      "Maximalist furniture: bold jewel-toned velvet sofa in fuchsia or cobalt blue with brass legs 230cm wide, brass and marble side table overflowing with art books and curated objects, layered rugs mixing faded vintage Persian and contemporary bold graphic patterns 200x300cm, sculptural brass floor lamp with oversized colored shade, mixed throw pillows in clashing patterns that harmonize — leopard print velvet and bold geometric, eclectic collection of framed artwork leaning against walls on the floor, large potted monstera in colorful glazed ceramic pot, vintage brass tray with pillar candles and small sculptural objects on the coffee table, ornate round coffee table in lacquered color with brass inlay 100cm, room 70 percent furnished with curated abundance",
  },
];

function IconCustom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6l6 6-14 14H6v-6L20 6z" />
      <line x1="16" y1="10" x2="22" y2="16" />
    </svg>
  );
}

interface StylePickerProps {
  selectedStyle: StyleOption | null;
  customPrompt: string;
  onStyleSelect: (style: StyleOption | null) => void;
  onCustomPromptChange: (prompt: string) => void;
}

export default function StylePicker({
  selectedStyle,
  customPrompt,
  onStyleSelect,
  onCustomPromptChange,
}: StylePickerProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handleStyleClick = (style: StyleOption) => {
    setIsCustom(false);
    onStyleSelect(style);
    onCustomPromptChange("");
    setTimeout(() => {
      document.getElementById("step-generate")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    onStyleSelect(null);
  };

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Choix du style" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {STYLES.map((style) => {
          const isSelected = selectedStyle?.id === style.id && !isCustom;
          return (
            <button
              key={style.id}
              onClick={() => handleStyleClick(style)}
              role="radio"
              aria-checked={isSelected}
              className={`group text-left p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-foreground bg-foreground/[0.02] shadow-sm scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg sm:text-xl mb-2 sm:mb-3 block" aria-hidden="true">
                {style.emoji}
              </span>
              <h4 className="text-sm font-semibold text-foreground mb-0.5 sm:mb-1 tracking-tight">
                {style.name}
              </h4>
              <p className="text-xs sm:text-[11px] text-muted font-light leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}

        <button
          onClick={handleCustomClick}
          role="radio"
          aria-checked={isCustom}
          className={`group text-left p-3.5 sm:p-5 rounded-2xl border border-dashed transition-all duration-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
            isCustom
              ? "border-foreground bg-foreground/[0.02] shadow-sm"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <IconCustom
            className={`w-5 h-5 mb-3 transition-colors duration-300 ${
              isCustom ? "text-foreground" : "text-gray-300 group-hover:text-muted"
            }`}
          />
          <h4 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
            Personnalisé
          </h4>
          <p className="text-[11px] text-muted font-light leading-relaxed">
            Décrivez votre style idéal
          </p>
        </button>
      </div>

      {isCustom && (
        <div className="animate-fade-in-up">
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Ex : style Art Déco avec mobilier doré, tapis persans et éclairage chaleureux…"
            className="w-full p-5 border border-gray-200 rounded-2xl focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 resize-none h-28 text-sm font-light transition-colors placeholder:text-gray-300"
          />
        </div>
      )}
    </div>
  );
}
