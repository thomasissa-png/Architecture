"use client";

import { useState } from "react";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  prompt: string;
  emoji: string;
}

const STYLES: StyleOption[] = [
  {
    id: "scandinavian",
    name: "Scandinave",
    description: "Bois clair, tons neutres, épure absolue",
    emoji: "🪵",
    prompt:
      "Scandinavian minimalist interior with pale oak furniture, soft white linen sofa, light birch coffee table, sheepskin throw draped over an armchair, white ceramic vases, taper candles in simple holders, sheer linen curtains filtering soft diffused Nordic daylight, palette of warm greige off-white and pale oak with matte black accents, woven wool rug in cream tones, potted monstera and trailing ivy, stacked books on the table, clean functional elegance with hygge warmth",
  },
  {
    id: "contemporary",
    name: "Contemporain",
    description: "Lignes nettes, palette sobre, modernité",
    emoji: "◻️",
    prompt:
      "Contemporary modern interior with low-profile modular sofa in premium grey fabric, smoked glass or Carrara marble coffee table, sculptural arc floor lamp in brushed brass, monochromatic palette of charcoal warm grey and off-white with one muted accent tone, no ornamentation, large abstract artwork on the wall, thick wool area rug in heathered grey, architectural coffee table books, single sculptural object on a pedestal, floor-to-ceiling sheer curtains, cool balanced natural light with warm accent lighting, editorial interior photography aesthetic",
  },
  {
    id: "industrial",
    name: "Industriel",
    description: "Métal, béton, volumes bruts sublimés",
    emoji: "⚙️",
    prompt:
      "Industrial loft interior with aged leather Chesterfield sofa, reclaimed wood and black steel coffee table, metal factory-style pendant lights with Edison filament bulbs casting warm amber glow, vintage cognac leather armchair, raw steel bookshelf with books and aged objects, dark wood and matte black palette with cognac leather accents, concrete-look accessories, no curtains with raw window frames, worn Persian rug on the floor, exposed metal side table, warm tungsten accent lighting contrasting with cool daylight",
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Minimalisme japonais, chaleur scandinave",
    emoji: "🎋",
    prompt:
      "Japandi interior combining Japanese minimalism with Scandinavian warmth, low platform sofa with clean lines in natural linen, light ash wood furniture with rounded edges, single ikebana flower arrangement in handmade ceramic vase, floor-level seating cushion in muted earth tone, washi paper pendant lamp diffusing soft warm light, palette of warm sand soft grey pale wood and charcoal, linen curtains in undyed natural tone, tatami-inspired woven rug, intentional negative space with only 30 percent of room furnished, serene meditative atmosphere",
  },
  {
    id: "art-deco",
    name: "Art Déco",
    description: "Géométrie dorée, velours, luxe années 20",
    emoji: "✨",
    prompt:
      "Art Deco interior with channel-tufted velvet sofa in deep emerald or sapphire, polished brass and gold geometric accents, sunburst mirror on the wall, fluted cabinet in dark lacquer with brass handles, marble-top side table, dramatic accent lighting with gold reflections on metallic surfaces, heavy velvet drapes in deep jewel tones, geometric patterned rug in black gold and cream, crystal or brass table lamp, decorative tray with perfume bottles and gold objects, palette of emerald sapphire gold black and cream, opulent 1920s glamour with curated restraint",
  },
  {
    id: "mid-century",
    name: "Mid-Century",
    description: "Lignes organiques, bois chaud, vintage chic",
    emoji: "🪑",
    prompt:
      "Mid-Century Modern interior with Eames-style molded lounge chair and ottoman in black leather, Noguchi-inspired sculptural coffee table, warm walnut wood credenza with tapered legs, organic curved sofa in mustard or burnt orange fabric, teak wood side table, Sputnik-style chandelier or arc floor lamp, palette of warm walnut mustard teal burnt orange and cream, geometric area rug with retro pattern, potted fiddle leaf fig, stacked vintage design books, light linen curtains, warm natural afternoon light with brass accent lamps, optimistic retro-modern elegance",
  },
  {
    id: "bohemian",
    name: "Bohème",
    description: "Textiles ethniques, plantes, chaleur nomade",
    emoji: "🌿",
    prompt:
      "Bohemian boho interior with low linen sofa covered in layered kilim and mudcloth cushions, macrame wall hanging, abundant trailing plants in terracotta and woven basket pots, rattan peacock chair, vintage Persian rug layered over jute rug, brass Moroccan lantern casting warm patterned light, wooden tray with candles and dried flowers, floor poufs in woven leather, palette of terracotta rust ochre sage cream and indigo, beaded curtains or light cotton drapes, warm golden ambient lighting, eclectic collected-over-time aesthetic with intentional curation not clutter",
  },
  {
    id: "haussmannian",
    name: "Haussmannien",
    description: "Moulures, parquet, élégance parisienne",
    emoji: "🏛️",
    prompt:
      "Modern Haussmannian Parisian interior with elegant plaster moldings and ceiling rosette, herringbone oak parquet floor, marble fireplace mantel with art and brass candlesticks, velvet sofa in muted sage or dusty blue, mix of Louis XV bergere chair with contemporary coffee table, oversized gilded mirror, heavy linen or velvet drapes in muted tones, sculptural contemporary pendant light, palette of soft grey warm white dusty blue sage and antique gold, stacked art books and ceramic objects, refined warm natural light from tall French windows, French art de vivre sophistication",
  },
  {
    id: "mediterranean",
    name: "Méditerranéen",
    description: "Terre cuite, lin blanc, lumière du sud",
    emoji: "☀️",
    prompt:
      "Mediterranean interior with natural linen sofa with loose slipcover, terracotta and warm stone accessories, olive branches in a rustic ceramic jar, wrought iron side table, handwoven rush-seat chairs, whitewashed wood furniture, palette of terracotta warm sand olive white and sun-bleached blue, sheer white linen curtains billowing with warm golden afternoon light from the south, woven esparto rug, glazed ceramic bowls and plates as decor, dried lavender bunch, warm golden hour sunlight flooding the space with long soft shadows, rustic refined coastal elegance",
  },
  {
    id: "cosy",
    name: "Cosy Moderne",
    description: "Textures douces, tons chauds, cocooning",
    emoji: "🛋️",
    prompt:
      "Modern cozy interior with oversized deep boucle sofa in warm cream, chunky knit throw blanket draped over the armrest, layered cushions in cream camel and soft blush, sheepskin rug beside the sofa, round oak coffee table with candles and a book, soft fabric table lamp with warm 2700K glow casting intimate shadows, heavy linen curtains in warm oatmeal, palette of warm cream camel soft blush oatmeal and muted terracotta, trailing potted plant on a side table, cashmere throw on a reading chair, warm amber toned ambient lighting throughout, enveloping cocoon atmosphere",
  },
  {
    id: "wabi-sabi",
    name: "Wabi-Sabi",
    description: "Imperfection noble, matières brutes, sérénité",
    emoji: "🏺",
    prompt:
      "Wabi-sabi interior embracing noble imperfection, handmade irregular ceramic vase with single dried branch, aged reclaimed wood bench with visible patina, raw linen sofa with natural wrinkles, hand-thrown pottery bowl on a weathered oak table, palette of raw plaster warm grey aged wood and muted earth tones, no curtains with bare windows letting in soft diffused natural light, room only 30 percent furnished with intentional emptiness, rough textured wool rug in undyed natural fiber, single stone sculpture, walls that echo raw plaster or lime wash texture, serene meditative atmosphere celebrating the beauty of impermanence",
  },
  {
    id: "maximalist",
    name: "Maximaliste",
    description: "Couleurs vives, motifs audacieux, personnalité",
    emoji: "🎨",
    prompt:
      "Maximalist eclectic interior with bold jewel-toned velvet sofa in fuchsia or cobalt, floor-to-ceiling gallery wall with mixed frames and art styles, patterned wallpaper accent with botanical or geometric motif, layered rugs mixing Persian and contemporary graphic patterns, brass and marble side table overflowing with books and curated objects, dramatic pendant light in sculptural form, heavy printed curtains in contrasting pattern, palette of fuchsia cobalt emerald gold saffron and deep plum, room 80 percent furnished with curated abundance, mixed throw pillows in clashing patterns that somehow harmonize, warm dramatic accent lighting with colored shadows, personality-filled space inspired by Kelly Wearstler",
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
