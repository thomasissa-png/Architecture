"use client";

interface Version {
  imageUrl: string;
  comment?: string;
}

interface VersionSelectorProps {
  versions: Version[];
  activeVersion: number;
  onSelect: (index: number) => void;
}

export default function VersionSelector({
  versions,
  activeVersion,
  onSelect,
}: VersionSelectorProps) {
  if (versions.length < 2) return null;

  return (
    <div className="space-y-2">
      {/* Version pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {versions.map((_, index) => {
          const isActive = index === activeVersion;
          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              aria-label={`Version ${index + 1}${index === 0 ? " (originale)" : ""}`}
              aria-pressed={isActive}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-sage text-white shadow-sm"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              v{index + 1}
            </button>
          );
        })}
      </div>

      {/* Active version comment */}
      <p className="text-center text-xs text-muted/70 font-light min-h-[18px]">
        {activeVersion === 0
          ? "Version originale"
          : versions[activeVersion]?.comment || ""}
      </p>
    </div>
  );
}
