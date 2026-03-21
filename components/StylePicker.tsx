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
      "Scandinavian minimalist style with light wood furniture, neutral tones, white and beige textiles, simple clean lines, natural materials",
  },
  {
    id: "contemporary",
    name: "Contemporain",
    description: "Lignes nettes, palette sobre, modernité",
    emoji: "◻️",
    prompt:
      "Contemporary modern style with clean lines, neutral color palette, elegant minimalist furniture, subtle luxury touches, sophisticated simplicity",
  },
  {
    id: "industrial",
    name: "Industriel",
    description: "Métal, béton, volumes bruts sublimés",
    emoji: "⚙️",
    prompt:
      "Industrial loft style with metal and dark wood furniture, exposed materials aesthetic, vintage leather, Edison bulbs, raw elegant look",
  },
  {
    id: "japandi",
    name: "Japandi",
    description: "Minimalisme japonais, chaleur scandinave",
    emoji: "🎋",
    prompt:
      "Japandi style combining Japanese minimalism with Scandinavian warmth, low furniture, natural wood, muted earth tones, wabi-sabi imperfections, zen simplicity, organic textures",
  },
  {
    id: "art-deco",
    name: "Art Déco",
    description: "Géométrie dorée, velours, luxe années 20",
    emoji: "✨",
    prompt:
      "Art Deco style with geometric patterns, gold and brass accents, velvet furniture in deep jewel tones, marble surfaces, glamorous 1920s luxury, statement lighting",
  },
  {
    id: "mid-century",
    name: "Mid-Century",
    description: "Lignes organiques, bois chaud, vintage chic",
    emoji: "🪑",
    prompt:
      "Mid-Century Modern style with organic curved furniture, warm walnut wood, iconic design pieces, mustard and teal accents, tapered legs, retro-modern elegance",
  },
  {
    id: "bohemian",
    name: "Bohème",
    description: "Textiles ethniques, plantes, chaleur nomade",
    emoji: "🌿",
    prompt:
      "Bohemian boho style with layered textiles, macramé, abundant plants, rattan and wicker furniture, warm earthy tones, persian rugs, eclectic collected-over-time aesthetic",
  },
  {
    id: "haussmannian",
    name: "Haussmannien",
    description: "Moulures, parquet, élégance parisienne",
    emoji: "🏛️",
    prompt:
      "Modern Haussmannian Parisian style with elegant moldings, herringbone parquet, mix of classic and contemporary furniture, marble fireplace, muted sophisticated palette, French art de vivre",
  },
  {
    id: "mediterranean",
    name: "Méditerranéen",
    description: "Terre cuite, lin blanc, lumière du sud",
    emoji: "☀️",
    prompt:
      "Mediterranean style with terracotta tiles, white linen, olive and warm stone tones, wrought iron accents, arched doorways feel, natural light, rustic refined elegance",
  },
  {
    id: "cosy",
    name: "Cosy Moderne",
    description: "Textures douces, tons chauds, cocooning",
    emoji: "🛋️",
    prompt:
      "Modern cozy style with soft boucle textures, warm neutral tones, plush oversized sofa, layered cushions, warm lighting, sheepskin throws, intimate welcoming atmosphere",
  },
  {
    id: "wabi-sabi",
    name: "Wabi-Sabi",
    description: "Imperfection noble, matières brutes, sérénité",
    emoji: "🏺",
    prompt:
      "Wabi-sabi style embracing imperfection, handmade ceramics, raw natural materials, muted earth palette, aged wood, organic shapes, serene meditative atmosphere, less is more",
  },
  {
    id: "maximalist",
    name: "Maximaliste",
    description: "Couleurs vives, motifs audacieux, personnalité",
    emoji: "🎨",
    prompt:
      "Maximalist eclectic style with bold colors, mixed patterns, gallery wall, statement furniture, rich fabrics, layered textures, curated abundance, vibrant personality-filled space",
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
