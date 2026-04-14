/**
 * Shared constants used across multiple pages and components.
 * Single source of truth — avoids duplication.
 */

export const STYLE_LABELS: Record<string, string> = {
  scandinavian: "Scandinave",
  contemporary: "Contemporain",
  industrial: "Industriel",
  japandi: "Japandi",
  art_deco: "Art Déco",
  mid_century: "Mid-Century",
  bohemian: "Bohème",
  mediterranean: "Méditerranéen",
  cozy: "Cosy",
  wabi_sabi: "Wabi-Sabi",
  maximalist: "Maximaliste",
  haussmannian: "Haussmannien",
  custom: "Personnalisé",
};

export const ROOM_TYPE_LABELS: Record<string, string> = {
  // English keys (from B2C + legacy extraction)
  living_room: "Salon",
  bedroom: "Chambre",
  bedroom_adults: "Chambre",
  bedroom_children: "Chambre enfant",
  kitchen: "Cuisine",
  bathroom: "Salle de bain",
  office: "Bureau",
  dining_room: "Salle à manger",
  hallway: "Entrée",
  entryway: "Entrée",
  terrace: "Terrasse",
  balcony: "Balcon",
  garden: "Jardin",
  wc: "WC",
  laundry: "Buanderie",
  cellar: "Cave",
  other: "Autre",
  // French keys (from pro extraction inferRoomType)
  salon: "Salon",
  cuisine: "Cuisine",
  chambre: "Chambre",
  sdb: "Salle de bain",
  bureau: "Bureau",
  couloir: "Couloir / Entrée",
  cave: "Cave / Rangement",
  autre: "Autre",
};

/**
 * Translate a room label: if it matches a known English room_type key,
 * return the French label. Otherwise return the original string.
 */
export function translateRoomLabel(label: string | null | undefined, fallback?: string): string {
  if (!label) return fallback || "Photo";
  // If the label matches a known room_type key, translate it
  if (ROOM_TYPE_LABELS[label]) return ROOM_TYPE_LABELS[label];
  // Otherwise it's already a user-provided French label
  return label;
}

/**
 * Get a French label for a room_type key.
 * Works with both English keys (living_room) and French keys (salon).
 * Returns the key itself if no match found.
 */
export function roomTypeLabel(roomType: string): string {
  return ROOM_TYPE_LABELS[roomType] || roomType;
}

/**
 * Human-readable floor label.
 * Used across extraction, decoupe, and validation pages.
 */
export function floorLabel(floorIndex: number): string {
  if (floorIndex === 0) return "Rez-de-chaussée";
  if (floorIndex === 1) return "Étage 1";
  return `Étage ${floorIndex}`;
}

/**
 * Derive completed steps from project status for the ProStepper.
 * Used across all step pages to show accurate progress.
 */
export function getCompletedSteps(status: string): number[] {
  switch (status) {
    case "plan_uploaded": return [1];
    case "lots_defined": return [1, 2];
    case "extraction_done": return [1, 2, 3];
    case "extraction_failed": return [1, 2];
    case "validated": return [1, 2, 3, 4];
    case "qualified": return [1, 2, 3, 4, 5];
    case "plan_final": return [1, 2, 3, 4, 5, 6];
    case "generating": return [1, 2, 3, 4, 5, 6];
    case "visuals_done": return [1, 2, 3, 4, 5, 6, 7];
    case "delivered": return [1, 2, 3, 4, 5, 6, 7, 8];
    default: return [1];
  }
}

export const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  loft: "Loft",
  studio: "Studio",
  duplex: "Duplex",
  bureau: "Bureau commercial",
};
