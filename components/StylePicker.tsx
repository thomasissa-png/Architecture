"use client";

import { useState } from "react";

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const STYLES: StyleOption[] = [
  {
    id: "scandinavian",
    name: "Scandinave",
    description: "Bois clair, tons neutres, épure absolue",
    prompt:
      "Scandinavian minimalist style with light wood furniture, neutral tones, white and beige textiles, simple clean lines, natural materials",
  },
  {
    id: "industrial",
    name: "Industriel",
    description: "Métal, béton, volumes bruts sublimés",
    prompt:
      "Industrial loft style with metal and dark wood furniture, exposed materials aesthetic, vintage leather, Edison bulbs, raw elegant look",
  },
  {
    id: "contemporary",
    name: "Contemporain",
    description: "Lignes nettes, palette sobre, modernité",
    prompt:
      "Contemporary modern style with clean lines, neutral color palette, elegant minimalist furniture, subtle luxury touches, sophisticated simplicity",
  },
];

/* Flat SVG icons — monochrome, architecture-grade */
function IconScandinave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      {/* Simple chair silhouette */}
      <rect x="8" y="6" width="16" height="2" rx="1" />
      <line x1="10" y1="8" x2="10" y2="26" />
      <line x1="22" y1="8" x2="22" y2="26" />
      <line x1="10" y1="16" x2="22" y2="16" />
    </svg>
  );
}

function IconIndustrial({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      {/* Industrial beam / structure */}
      <polyline points="4,26 4,8 12,14 12,8 20,14 20,8 28,14 28,26" />
      <line x1="4" y1="26" x2="28" y2="26" />
    </svg>
  );
}

function IconContemporary({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      {/* Clean geometric shapes */}
      <rect x="6" y="10" width="20" height="14" rx="1" />
      <line x1="16" y1="10" x2="16" y2="24" />
      <line x1="6" y1="17" x2="26" y2="17" />
    </svg>
  );
}

function IconCustom({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
      {/* Pen / customize */}
      <path d="M20 6l6 6-14 14H6v-6L20 6z" />
      <line x1="16" y1="10" x2="22" y2="16" />
    </svg>
  );
}

const ICONS = [IconScandinave, IconIndustrial, IconContemporary];

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STYLES.map((style, index) => {
          const Icon = ICONS[index];
          const isSelected = selectedStyle?.id === style.id && !isCustom;
          return (
            <button
              key={style.id}
              onClick={() => handleStyleClick(style)}
              className={`group text-left p-6 rounded-2xl border transition-all duration-300 hover:shadow-sm ${
                isSelected
                  ? "border-foreground bg-foreground/[0.02]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon
                className={`w-7 h-7 mb-4 transition-colors duration-300 ${
                  isSelected ? "text-foreground" : "text-gray-300 group-hover:text-muted"
                }`}
              />
              <h4 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
                {style.name}
              </h4>
              <p className="text-xs text-muted font-light leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}

        <button
          onClick={handleCustomClick}
          className={`group text-left p-6 rounded-2xl border transition-all duration-300 hover:shadow-sm ${
            isCustom
              ? "border-foreground bg-foreground/[0.02]"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <IconCustom
            className={`w-7 h-7 mb-4 transition-colors duration-300 ${
              isCustom ? "text-foreground" : "text-gray-300 group-hover:text-muted"
            }`}
          />
          <h4 className="text-sm font-semibold text-foreground mb-1 tracking-tight">
            Personnalisé
          </h4>
          <p className="text-xs text-muted font-light leading-relaxed">
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
            className="w-full p-5 border border-gray-200 rounded-2xl focus:border-foreground focus:outline-none resize-none h-28 text-sm font-light transition-colors placeholder:text-gray-300"
          />
        </div>
      )}
    </div>
  );
}
