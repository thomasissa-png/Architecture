"use client";

import { ROOM_TYPE_LIST, type RoomType } from "@/lib/room-types";

interface RoomTypePickerProps {
  selectedRoomType: string | null;
  onSelect: (roomTypeId: string | null) => void;
}

export default function RoomTypePicker({
  selectedRoomType,
  onSelect,
}: RoomTypePickerProps) {
  const handleClick = (rt: RoomType) => {
    // Toggle: click again to deselect
    if (selectedRoomType === rt.id) {
      onSelect(null);
    } else {
      onSelect(rt.id);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground tracking-tight">
          Type de piece
        </p>
        <span className="text-xs text-muted/60 font-light">(optionnel)</span>
      </div>

      <div
        role="radiogroup"
        aria-label="Choix du type de piece"
        className="flex flex-wrap gap-2"
      >
        {ROOM_TYPE_LIST.map((rt) => {
          const isSelected = selectedRoomType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => handleClick(rt)}
              role="radio"
              aria-checked={isSelected}
              aria-label={rt.label}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                isSelected
                  ? "bg-sage text-white shadow-sm"
                  : "bg-gray-100 text-muted hover:bg-gray-200 hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {rt.emoji}
              </span>
              <span>{rt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected type description */}
      {selectedRoomType && (
        <p className="text-xs text-muted/70 font-light flex items-center gap-1.5 mt-1">
          <svg
            className="w-3.5 h-3.5 shrink-0 text-sage"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {ROOM_TYPE_LIST.find((rt) => rt.id === selectedRoomType)?.description ||
            ""}
        </p>
      )}
    </div>
  );
}
