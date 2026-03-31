"use client";

import { OUTDOOR_STYLE_LIST } from "@/lib/outdoor-styles";

interface OutdoorStylePickerProps {
  selectedStyle: string | null;
  onSelect: (styleId: string) => void;
}

export default function OutdoorStylePicker({
  selectedStyle,
  onSelect,
}: OutdoorStylePickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground tracking-tight">
        Ambiance ext&eacute;rieure
      </p>

      <div
        role="radiogroup"
        aria-label="Choix du style extérieur"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {OUTDOOR_STYLE_LIST.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              role="radio"
              aria-checked={isSelected}
              className={`group text-left p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-foreground bg-foreground/[0.02] shadow-sm scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span
                className="text-lg sm:text-xl mb-2 sm:mb-3 block"
                aria-hidden="true"
              >
                {style.emoji}
              </span>
              <h4 className="text-sm font-semibold text-foreground mb-0.5 sm:mb-1 tracking-tight">
                {style.label}
              </h4>
              <p className="text-xs sm:text-[11px] text-muted font-light leading-relaxed">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
