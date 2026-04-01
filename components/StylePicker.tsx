"use client";

import OutdoorStylePicker from "@/components/OutdoorStylePicker";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  surfacePrompt: string;
  furniturePrompt: string;
  palette: string[];
  preview?: string; // API path or static path to preview image
}

export const STYLES: StyleOption[] = [
  {
    id: "scandinavian",
    name: "Scandinave",
    description: "Bois clair, tons neutres, épure absolue",
    palette: ["#F5F0E8", "#D4C9B0", "#8B7355"],
    preview: "/api/demo?style=scandinavian&image=after",
    surfacePrompt:
      "Scandinavian minimalist: soft white walls keeping the same overall brightness as the input photo, wide-plank whitewashed ash flooring with visible natural grain and knots matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, matte white tiered pendant light with soft diffused glow 45cm diameter (PH5-style layered shade)",
    furniturePrompt:
      "A serene Nordic living space centered around a low conversation area with warm textiles and natural light. Scandinavian furniture with clean geometric lines: large straight three-seat sofa in oatmeal boucle with low squared arms and birch legs 230cm wide, light ash lounge chair with woven paper cord seat and curved back (Wegner-style) as accent piece, light birch rectangular coffee table with slim tapered legs 120cm, cream wool loop-pile area rug 200x300cm, slim matte black asymmetric floor lamp with angled cone shade in warm white (AJ-style), sheepskin throw draped over one sofa arm, white ceramic ribbed vases and taper candles on the table, small round birch side table with stacked design books, potted trailing pothos in light grey stoneware planter, dried birch branches in a tall cylindrical stoneware vase, two woven wool cushions with simple geometric Nordic pattern in muted blue and warm grey",
  },
  {
    id: "contemporary",
    name: "Contemporain",
    description: "Lignes nettes, palette sobre, modernité",
    palette: ["#E8E8E8", "#4A4A4A", "#C0B283"],
    preview: "/api/demo?style=contemporary&image=after",
    surfacePrompt:
      "Contemporary modern: very light neutral grey walls barely tinted from the original keeping the same overall brightness as the input photo, light grey engineered stone flooring with matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, minimal recessed or flush-mount ceiling light in brushed chrome",
    furniturePrompt:
      "A refined editorial interior with sculptural accents and restrained luxury. Contemporary furniture: large low-profile L-shaped sectional sofa in charcoal premium bouclé with slim brushed steel legs 280cm, sculptural smoked glass coffee table on brushed brass pedestal base 110cm, heathered grey thick wool area rug 250x350cm, brushed brass floor lamp with asymmetric flat disc shade 30cm diameter on slim curved stem (Flos IC-style), single large abstract canvas sitting on the floor leaning against the baseboard NOT hung on the wall, architectural coffee table books in a neat stack, tall matte white sculptural ceramic object on a slim black metal pedestal, potted architectural snake plant in matte black cylinder planter, two charcoal and cream geometric cushions",
  },
  {
    id: "industrial",
    name: "Industriel",
    description: "Métal, béton, volumes bruts sublimés",
    palette: ["#8B8680", "#3D3D3D", "#A0522D"],
    preview: "/api/demo?style=industrial&image=after",
    surfacePrompt:
      "Industrial loft: preserve existing wall finish and texture, keep the same overall brightness as the input photo, smooth grey concrete floor with matte waxed finish, ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, matte black industrial pendant light with metal shade and visible Edison filament bulb",
    furniturePrompt:
      "A raw loft space with character — worn materials, generous volumes, and creative confidence. Industrial furniture: large three-seat worn leather sofa in warm cognac with visible patina stitching and riveted seams 230cm wide, reclaimed wood and black welded steel rectangular coffee table 130cm, faded vintage Persian rug in muted red and navy 200x300cm, raw steel open-frame bookshelf with visible welds 180cm tall with books and aged brass objects, oversized vintage industrial clock on the top shelf as signature piece, black metal factory stool as side table, potted large fiddle leaf fig in corrugated metal container, leather and black steel butterfly chair, aged brass industrial desk lamp on the bookshelf, two weathered leather cushions",
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Minimalisme japonais, chaleur scandinave",
    palette: ["#F0EDE5", "#C4B99A", "#6B705C"],
    preview: "/api/demo?style=japandi&image=after",
    surfacePrompt:
      "Japandi: soft off-white walls with very subtle sand undertone keeping the same overall brightness as the input photo, light ash wide-plank flooring with matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, round washi paper pendant light in natural off-white",
    furniturePrompt:
      "A meditative room with deliberately sparse furnishing and balanced asymmetry — every empty space is intentional. Japandi furniture with precise geometric lines and balanced asymmetry: low-profile platform sofa with clean lines in natural undyed linen in warm ecru with exposed light ash wood frame 220cm wide, light ash rectangular coffee table with rounded edges and short legs 100cm, flat-weave natural fiber rug in warm straw tone 200x250cm, single ikebana dried branch arrangement in geometric cylindrical ceramic vase, floor cushion in muted clay tone beside the table, minimal round side table in light ash 40cm with black cast iron teapot (tetsubin) as signature piece, potted single-stem orchid in unglazed charcoal pottery, thin cashmere throw in warm sand tone draped over one sofa arm, intentional negative space with only 30 percent of room furnished",
  },
  {
    id: "art-deco",
    name: "Art Déco",
    description: "Géométrie dorée, velours, luxe années 20",
    palette: ["#1C1C1E", "#C5A55A", "#2D5A3D"],
    preview: "/api/demo?style=art-deco&image=after",
    surfacePrompt:
      "Art Deco: off-white walls with smooth finish keeping the same overall brightness as the input photo, dark stained herringbone parquet flooring, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, brass and frosted glass geometric pendant chandelier",
    furniturePrompt:
      "An opulent salon with geometric precision and theatrical glamour — every surface gleams. Art Deco furniture: channel-tufted velvet sofa in deep emerald green with polished brass legs 230cm wide arranged symmetrically in the room, round polished brass coffee table with smoked glass top on pedestal base 90cm diameter, geometric patterned area rug in black gold and cream 200x300cm, fluted dark lacquer drinks cabinet with brass handles 120cm tall, marble-top brass side table with crystal decanter and gold-rimmed glasses, tall brass floor lamp with pleated cream silk shade, brass sunburst mirror leaning against the wall resting on top of the drinks cabinet as signature piece, potted areca palm in polished brass planter, matching pair of brass table lamps on side tables flanking the sofa, velvet cushions in sapphire and gold with geometric patterns",
  },
  {
    id: "mid-century",
    name: "Mid-Century",
    description: "Lignes organiques, bois chaud, vintage chic",
    palette: ["#D4A03C", "#5B3A29", "#2E8B8B"],
    preview: "/api/demo?style=mid-century&image=after",
    surfacePrompt:
      "Mid-Century Modern: soft off-white walls with subtle ivory undertone keeping the same overall brightness as the input photo, warm walnut-toned wood plank flooring with satin finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, Sputnik-style brass and black multi-arm ceiling pendant",
    furniturePrompt:
      "A sunlit retro living room with optimistic colors and iconic design pieces — everything has legs and light passes beneath. Mid-Century Modern furniture, all pieces raised on legs with visible daylight beneath: curved organic sofa in mustard woven fabric with walnut tapered legs 220cm wide, sculptural free-form walnut coffee table with biomorphic shape 120cm, warm-toned geometric area rug in cream mustard and teal 200x300cm, walnut credenza with sliding doors and brass pulls 160cm wide as background anchor, black leather and walnut bentwood lounge chair with matching ottoman, walnut and brass tripod floor lamp with natural linen cone shade (60s-style), potted fiddle leaf fig in warm terracotta planter, stacked vintage design books and small brass starburst clock on the credenza, two cushions in teal and burnt orange",
  },
  {
    id: "bohemian",
    name: "Bohème",
    description: "Textiles ethniques, plantes, chaleur nomade",
    palette: ["#C17F59", "#6B705C", "#E8D5B7"],
    preview: "/api/demo?style=bohemian&image=after",
    surfacePrompt:
      "Bohemian: soft off-white walls keeping the same overall brightness as the input photo, warm honey-toned wood plank flooring with matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, woven rattan pendant light in natural tone",
    furniturePrompt:
      "A warm nomadic retreat layered with textiles, plants, and worldly treasures — relaxed and deeply personal. Bohemian furniture: deep relaxed linen sofa with slouchy cushions in natural ecru with layered kilim and mudcloth cushions in terracotta rust and indigo 220cm wide, round kilim-upholstered pouf 50cm diameter as signature floor seat, round reclaimed wood coffee table with organic edge 90cm diameter, faded vintage Persian rug layered over natural jute rug 200x300cm, rattan peacock chair with sheepskin throw draped over, two trailing pothos in terracotta pots and one monstera in a woven basket, small brass Moroccan-style pierced lantern on the floor, wooden tray with pillar candles and dried pampas grass on the table, tall freestanding natural wood tripod plant stand with trailing pothos",
  },
  {
    id: "mediterranean",
    name: "Méditerranéen",
    description: "Terre cuite, lin blanc, lumière du sud",
    palette: ["#F5F0E0", "#C17F59", "#2B5B84"],
    preview: "/api/demo?style=mediterranean&image=after",
    surfacePrompt:
      "Mediterranean: white lime-plaster walls with subtle hand-troweled texture keeping the same overall brightness as the input photo, walls must stay close to input brightness and not darken or shift to ochre, pale terracotta or warm travertine floor tiles with natural veining, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs — if beams are visible whitewash them, wrought iron pendant lantern with aged patina",
    furniturePrompt:
      "A sun-drenched southern interior where time slows down — natural materials, artisan textures, and quiet elegance. Mediterranean furniture: deep generous three-seat natural linen sofa with loose slipcover in off-white 230cm wide, rustic olive wood coffee table with natural live edge 110cm, woven esparto grass rug in natural tone 200x300cm, patinated wrought iron side table with curved legs and glazed turquoise ceramic bowl, handwoven rush-seat wooden chair as accent piece, large olive branches in a rustic terracotta amphora jar 80cm tall, glazed ceramic plates and bowls as decor on the table in cobalt and terracotta, linen cushions in warm sand and sun-bleached blue, potted rosemary and trailing jasmine in terracotta pots",
  },
  {
    id: "cosy",
    name: "Cosy Moderne",
    description: "Textures douces, tons chauds, cocooning",
    palette: ["#F5EDE0", "#C9B99A", "#A0522D"],
    preview: "/api/demo?style=cosy&image=after",
    surfacePrompt:
      "Modern cozy: soft off-white walls with subtle cream undertone keeping the same overall brightness as the input photo, light oak wide-plank flooring with matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, warm fabric drum pendant light in cream tone",
    furniturePrompt:
      "A cocooning nest where warmth is layered — soft throws, candlelight, and textures you want to sink into. Modern cozy furniture densely layered with mixed textures, all rounded organic forms: generously proportioned three-seat boucle sofa in warm cream 260cm wide with chunky knit throw in cream wool draped over sofa arm and soft sheepskin draped over seat, camel boucle armchair, round light oak coffee table 100cm diameter with cluster of 3 pillar candles on wooden tray and stack of hardcover books with earth-tone covers, layered cushions in mixed textures velvet linen and boucle in cream camel and warm cognac, cream wool area rug 200x300cm, warm ceramic table lamp with linen drum shade on oak side table, string of pearls in cream ribbed ceramic hanging planter",
  },
  {
    id: "wabi-sabi",
    name: "Wabi-Sabi",
    description: "Imperfection noble, matières brutes, sérénité",
    palette: ["#B8AFA0", "#8B8680", "#5C5550"],
    preview: "/api/demo?style=wabi-sabi&image=after",
    surfacePrompt:
      "Wabi-sabi: soft matte warm grey walls keeping the same overall brightness as the input photo, natural stone or aged concrete flooring with subtle worn texture, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, simple ceramic pendant in natural unglazed finish",
    furniturePrompt:
      "A quiet room where objects show their age — rough surfaces, visible wear, and the beauty of less. Wabi-sabi furniture with nothing symmetrical, every object placed with studied asymmetry: raw linen sofa visibly wrinkled and creased in undyed flax tone with low dark weathered reclaimed wood frame 200cm wide, weathered oak rectangular coffee table with visible wood grain and worn edges 120cm, rough textured wool rug in undyed natural fiber 180x250cm, aged reclaimed wood bench with visible wear marks 100cm, single dark charcoal tea bowl with crackle glaze on the table as signature kintsugi-inspired piece, handmade asymmetric ceramic vase with single dried branch, smooth river stone as sculptural object on the floor, leave at least 60 percent of the floor area completely empty for serene intentional space",
  },
  {
    id: "maximalist",
    name: "Maximaliste",
    description: "Couleurs vives, motifs audacieux, personnalité",
    palette: ["#1B4D6E", "#C5533B", "#C5A55A"],
    preview: "/api/demo?style=maximalist&image=after",
    surfacePrompt:
      "Maximalist eclectic: rich deep teal accent on the largest visible surface with remaining areas in off-white keeping the same overall brightness as the input photo, polished dark wood flooring, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, dramatic sculptural pendant light in brass with colored glass elements",
    furniturePrompt:
      "A bold, personality-filled room where more is more — vibrant colors, mixed patterns, and curated eclecticism. Maximalist furniture: bold jewel-toned velvet sofa in deep cobalt blue with curved sculptural back and brass legs 230cm wide, round lacquered coral coffee table on brass circular frame 100cm, layered rugs mixing faded vintage Persian and contemporary bold graphic patterns 200x300cm, two framed art prints propped on the floor against the baseboard, sculptural brass floor lamp with oversized colored shade, one cushion in animal print velvet and one in bold geometric stripe, large potted monstera in colorful glazed ceramic pot, brass and marble side table with stacked art books and two curated objects, vintage brass tray with pillar candles on the coffee table, ornate vintage brass candlestick holder on the side table",
  },
  {
    id: "haussmannian",
    name: "Haussmannien",
    description: "Moulures, parquet, élégance parisienne",
    palette: ["#F0EBE0", "#8B7355", "#C5A55A"],
    preview: "/api/demo?style=haussmannian&image=after",
    surfacePrompt:
      "Haussmannian Parisian: soft off-white walls keeping the same overall brightness as the input photo, classic light oak herringbone parquet flooring with satin finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs preserving existing crown moldings and cornices, classic French chandelier with crystal drops and gilt bronze arms 60cm diameter",
    furniturePrompt:
      "A refined Parisian apartment where classic elegance meets understated comfort — timeless proportions and quiet luxury. Haussmannian Parisian furniture: elegant three-seat sofa in soft dove grey linen with low rolled arms and dark walnut turned legs 230cm wide, round marble-top gueridon side table with dark patinated brass legs 50cm, classic French bergere armchair in cream linen with dark walnut frame as accent piece, warm-toned Persian-inspired area rug in muted rose ivory and navy 200x300cm, tall dark walnut bookcase with brass gallery rail 180cm as background anchor with leather-bound books and small brass objects, classic brass pharmacy floor lamp with cream shade, white marble mantel clock and brass candlesticks on the bookcase, potted white orchid in aged brass cachepot, two cushions in dusty rose and soft sage velvet",
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
  selectedStyles: string[];
  customPrompt: string;
  onStyleToggle: (styleId: string) => void;
  onCustomPromptChange: (prompt: string) => void;
  isOutdoor: boolean;
  selectedOutdoorStyle: string | null;
  onSelectOutdoorStyle: (styleId: string) => void;
  disabled?: boolean;
}

export default function StylePicker({
  selectedStyles,
  customPrompt,
  onStyleToggle,
  onCustomPromptChange,
  isOutdoor,
  selectedOutdoorStyle,
  onSelectOutdoorStyle,
  disabled = false,
}: StylePickerProps) {
  const isCustomSelected = selectedStyles.includes("custom");

  const handleStyleClick = (style: StyleOption) => {
    if (disabled) return;
    onStyleToggle(style.id);
    // Auto-scroll to generate button after first selection
    if (selectedStyles.length === 0) {
      setTimeout(() => {
        document.getElementById("step-generate")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  };

  const handleCustomClick = () => {
    if (disabled) return;
    onStyleToggle("custom");
  };

  return (
    <div className="space-y-4">
      {/* Outdoor mode: outdoor styles */}
      {isOutdoor && (
        <div className="animate-fade-in-up">
          <OutdoorStylePicker
            selectedStyle={selectedOutdoorStyle}
            onSelect={(id) => {
              onSelectOutdoorStyle(id);
              setTimeout(() => {
                document.getElementById("step-generate")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 150);
            }}
          />
        </div>
      )}

      {/* Indoor mode: 12 styles + custom */}
      {!isOutdoor && (
        <>
      <div role="group" aria-label="Choix du style (sélection multiple)" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {STYLES.map((style) => {
          const isSelected = selectedStyles.includes(style.id);
          const selectionIndex = selectedStyles.indexOf(style.id);
          const isLastSelected = selectedStyles.length === 1 && isSelected;
          return (
            <button
              key={style.id}
              onClick={() => handleStyleClick(style)}
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled || (isLastSelected && !isCustomSelected)}
              title={isLastSelected && !isCustomSelected ? "Au moins 1 style requis" : undefined}
              className={`group relative text-left p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-foreground bg-foreground/5 shadow-sm scale-[1.02]"
                  : "border-foreground/10 hover:border-foreground/15"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${isLastSelected && !isCustomSelected ? "cursor-not-allowed" : ""}`}
            >
              {/* Badge numéroté */}
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-foreground text-background text-[10px] font-semibold rounded-md flex items-center justify-center" aria-label={`Sélection ${selectionIndex + 1}`}>
                  {selectionIndex + 1}
                </span>
              )}
              <span className="flex gap-1.5 mb-2 sm:mb-3" aria-hidden="true">
                {style.palette.map((color, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full ring-1 ring-inset ring-foreground/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <h4 className="text-sm font-semibold text-foreground mb-0.5 sm:mb-1 tracking-tight">
                {style.name}
              </h4>
              <p className="text-xs sm:text-[11px] text-muted font-light leading-relaxed">
                {style.description}
              </p>
              {/* Checkbox indicator */}
              <span className={`absolute bottom-2 right-2 w-4 h-4 rounded border transition-colors ${isSelected ? "bg-foreground border-foreground" : "border-foreground/20 bg-transparent"}`} aria-hidden="true">
                {isSelected && (
                  <svg className="w-4 h-4 text-background" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M3.5 8.5L6.5 11.5L12.5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}

        <button
          onClick={handleCustomClick}
          role="checkbox"
          aria-checked={isCustomSelected}
          disabled={disabled || (selectedStyles.length === 1 && isCustomSelected)}
          className={`group relative text-left p-3.5 sm:p-5 rounded-2xl border border-dashed transition-all duration-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
            isCustomSelected
              ? "border-foreground bg-foreground/5 shadow-sm"
              : "border-foreground/15 hover:border-foreground/20"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isCustomSelected && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-foreground text-background text-[10px] font-semibold rounded-md flex items-center justify-center" aria-label={`Sélection ${selectedStyles.indexOf("custom") + 1}`}>
              {selectedStyles.indexOf("custom") + 1}
            </span>
          )}
          <IconCustom
            className={`w-5 h-5 mb-3 transition-colors duration-300 ${
              isCustomSelected ? "text-foreground" : "text-foreground/30 group-hover:text-muted"
            }`}
          />
          <h4 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
            Personnalisé
          </h4>
          <p className="text-[11px] text-muted font-light leading-relaxed">
            Décrivez votre style idéal
          </p>
          {/* Checkbox indicator */}
          <span className={`absolute bottom-2 right-2 w-4 h-4 rounded border transition-colors ${isCustomSelected ? "bg-foreground border-foreground" : "border-foreground/20 bg-transparent"}`} aria-hidden="true">
            {isCustomSelected && (
              <svg className="w-4 h-4 text-background" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3.5 8.5L6.5 11.5L12.5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Multi-style counter */}
      {selectedStyles.length > 1 && (
        <p className="text-xs text-muted font-light text-center">
          {selectedStyles.length} style{selectedStyles.length > 1 ? "s" : ""} sélectionné{selectedStyles.length > 1 ? "s" : ""} — {selectedStyles.length} crédit{selectedStyles.length > 1 ? "s" : ""} par photo
        </p>
      )}

      {isCustomSelected && (
        <div className="animate-fade-in-up">
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Ex : style Art Déco avec mobilier doré, tapis persans et éclairage chaleureux…"
            className="w-full p-5 border border-foreground/10 rounded-2xl focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 resize-none h-28 text-sm font-light transition-colors placeholder:text-foreground/30"
            disabled={disabled}
          />
        </div>
      )}
        </>
      )}
    </div>
  );
}
