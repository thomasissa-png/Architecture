"use client";

/**
 * RoomNav — Horizontal scrollable pill navigation for room anchors.
 * Used on /dossier/[uuid] to jump between room sections.
 */

interface RoomNavProps {
  rooms: { id: string; label: string }[];
}

export default function RoomNav({ rooms }: RoomNavProps) {
  if (rooms.length <= 1) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="sticky top-[49px] sm:top-[57px] z-40 bg-background/80 backdrop-blur-md border-b border-foreground/5 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2.5"
      aria-label="Navigation par pièce"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => handleClick(room.id)}
            className="flex-shrink-0 text-xs bg-foreground/5 text-foreground/70 px-3 py-1.5 rounded-full font-light hover:bg-foreground/10 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 whitespace-nowrap"
          >
            {room.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
