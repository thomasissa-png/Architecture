"use client";

import { useState } from "react";

export interface StyleOption {
  id: string;
  icon: string;
  name: string;
  description: string;
  prompt: string;
}

const STYLES: StyleOption[] = [
  {
    id: "scandinavian",
    icon: "🪵",
    name: "Scandinave / Minimaliste",
    description: "Bois clair, tons neutres, épure absolue",
    prompt:
      "Scandinavian minimalist style with light wood furniture, neutral tones, white and beige textiles, simple clean lines, natural materials",
  },
  {
    id: "industrial",
    icon: "🏗️",
    name: "Industriel / Loft",
    description: "Métal, béton, volumes bruts sublimés",
    prompt:
      "Industrial loft style with metal and dark wood furniture, exposed materials aesthetic, vintage leather, Edison bulbs, raw elegant look",
  },
  {
    id: "contemporary",
    icon: "✨",
    name: "Contemporain / Épuré",
    description: "Lignes nettes, palette sobre, modernité",
    prompt:
      "Contemporary modern style with clean lines, neutral color palette, elegant minimalist furniture, subtle luxury touches, sophisticated simplicity",
  },
];

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
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    onStyleSelect(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleClick(style)}
            className={`group text-left p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
              selectedStyle?.id === style.id && !isCustom
                ? "border-sage bg-sage/5 shadow-md"
                : "border-gray-200 hover:border-sage/50"
            }`}
          >
            <div className="text-3xl mb-3">{style.icon}</div>
            <h4 className="font-semibold text-foreground mb-1">{style.name}</h4>
            <p className="text-sm text-gray-500">{style.description}</p>
          </button>
        ))}

        <button
          onClick={handleCustomClick}
          className={`group text-left p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
            isCustom
              ? "border-sage bg-sage/5 shadow-md"
              : "border-gray-200 hover:border-sage/50"
          }`}
        >
          <div className="text-3xl mb-3">🎨</div>
          <h4 className="font-semibold text-foreground mb-1">
            Autre / Personnalisé
          </h4>
          <p className="text-sm text-gray-500">
            Décrivez votre style idéal librement
          </p>
        </button>
      </div>

      {isCustom && (
        <div className="mt-4">
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Décrivez le style souhaité... Ex : style Art Déco avec mobilier doré, tapis persans et éclairage chaleureux"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-sage focus:outline-none resize-none h-28 text-sm transition-colors placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );
}
