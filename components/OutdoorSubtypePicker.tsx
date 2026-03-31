"use client";

import { OUTDOOR_SUBTYPE_LIST, type OutdoorSubtype } from "@/lib/outdoor-subtypes";

interface OutdoorSubtypePickerProps {
  selectedSubtype: string | null;
  onSelect: (subtypeId: string) => void;
}

export default function OutdoorSubtypePicker({
  selectedSubtype,
  onSelect,
}: OutdoorSubtypePickerProps) {
  const handleClick = (sub: OutdoorSubtype) => {
    onSelect(sub.id);
  };

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-foreground tracking-tight">
        Type d&apos;espace exterieur
      </p>

      <div
        role="radiogroup"
        aria-label="Choix du type d'espace extérieur"
        className="flex flex-wrap gap-2"
      >
        {OUTDOOR_SUBTYPE_LIST.map((sub) => {
          const isSelected = selectedSubtype === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => handleClick(sub)}
              role="radio"
              aria-checked={isSelected}
              aria-label={sub.label}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isSelected
                  ? "bg-sage text-white shadow-sm"
                  : "bg-gray-100 text-muted hover:bg-gray-200 hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {sub.emoji}
              </span>
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
