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
  living_room: "Salon",
  bedroom: "Chambre",
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

export const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  loft: "Loft",
  studio: "Studio",
  duplex: "Duplex",
  bureau: "Bureau commercial",
};
