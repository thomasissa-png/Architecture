/**
 * F2 — Room type definitions for prompt enrichment.
 *
 * Each room type provides:
 * - roomSurfaceOverride: concatenated to the style's surfacePrompt (pass 1)
 * - roomFurnitureOverride: REPLACES the style's furniturePrompt (pass 2) — except when empty
 * - roomNegativeOverride: added to the Flux negative prompt
 *
 * Decision: roomFurnitureOverride replaces (not concatenates) because bedroom furniture
 * has nothing in common with living room furniture. Concatenating would produce
 * "sofa + bed" nonsense.
 *
 * See docs/ia/f2-room-type-prompts.md for full rationale (Yann Duval + Lucas Moreau).
 */

export interface RoomType {
  id: string;
  label: string;
  emoji: string;
  description: string;
  roomSurfaceOverride: string;
  roomFurnitureOverride: string;
  roomNegativeOverride: string;
}

export const ROOM_TYPES: Record<string, RoomType> = {
  living_room: {
    id: "living_room",
    label: "Salon",
    emoji: "🛋️",
    description: "Mobilier adapte : canape, table basse, tapis",
    roomSurfaceOverride: "",
    roomFurnitureOverride: "",
    roomNegativeOverride: "",
  },

  bedroom: {
    id: "bedroom",
    label: "Chambre",
    emoji: "🛏️",
    description: "Mobilier adapte : lit, chevets, armoire",
    roomSurfaceOverride:
      "Additionally for this bedroom: warm-toned flooring suitable for bare feet, soft ambient lighting from the ceiling fixture.",
    roomFurnitureOverride:
      "Bedroom furniture: upholstered double bed 160cm wide with padded headboard and fitted bedlinen in neutral tones, two matching bedside tables 45cm wide with table lamps, a soft area rug 160x230cm beside the bed, a bench or ottoman at the foot of the bed, a tall wardrobe or dresser as background anchor. One accent chair or reading nook if space allows. Intentional calm — no clutter, no work-related objects.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, dining table, office desk",
  },

  bathroom: {
    id: "bathroom",
    label: "Salle de bain",
    emoji: "🚿",
    description: "Mobilier adapte : vasque, miroir, rangements",
    roomSurfaceOverride:
      "Additionally for this bathroom: waterproof wall finish — ceramic wall tiles on the wet zone behind the vanity area. Water-resistant floor — ceramic or stone floor tiles with matte non-slip finish.",
    roomFurnitureOverride:
      "Bathroom fixtures and accessories: wall-mounted vanity unit 80cm wide with integrated basin and framed mirror above, fluffy folded towels in neutral tones on open shelving or towel ladder, a small stool or side table with soap dispenser and candle, potted humidity-loving plant (fern or pothos) in ceramic pot, woven basket for storage on the floor. No freestanding bathtub unless room is large. Clean and spa-like atmosphere.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp",
  },

  kitchen: {
    id: "kitchen",
    label: "Cuisine",
    emoji: "🍳",
    description: "Mobilier adapte : plan de travail, caissons, tabourets",
    roomSurfaceOverride:
      "Additionally for this kitchen: ceramic or natural stone floor tiles suited for a kitchen. Subway tile or smooth splashback on the wall behind the work area.",
    roomFurnitureOverride:
      "Kitchen furnishing: countertop work surface 60cm deep with integrated sink, upper and lower cabinetry in neutral finish, built-in oven and cooktop, two or three bar stools at an island or peninsula if space allows, pendant light above the work area, cutting board and ceramic jar with utensils on the counter, small herb pots (basil, rosemary) on a shelf or windowsill, fruit bowl on the counter. Functional and organized layout.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, floor lamp, area rug",
  },

  office: {
    id: "office",
    label: "Bureau",
    emoji: "💼",
    description: "Mobilier adapte : bureau, fauteuil, bibliotheque",
    roomSurfaceOverride: "",
    roomFurnitureOverride:
      "Home office furniture: desk 140cm wide with clean lines, ergonomic desk chair with padded seat, desk lamp with adjustable arm, open bookshelf or storage unit as background anchor 160cm tall, small plant on the desk, organized desk accessories (pen holder, notebook, monitor or laptop), comfortable reading chair in a corner if space allows, area rug 160x230cm under the desk area. Productive but inviting atmosphere — not a corporate office.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table",
  },

  entryway: {
    id: "entryway",
    label: "Entree",
    emoji: "🚪",
    description: "Mobilier adapte : console, miroir, portemanteau",
    roomSurfaceOverride:
      "Additionally for this entryway: durable floor finish suitable for an entrance — ceramic tiles, natural stone, or hard-wearing wood.",
    roomFurnitureOverride:
      "Entryway furniture: console table 100cm wide against the available wall with a decorative object and small tray for keys, wall-leaning framed mirror propped on the console, freestanding coat rack, small bench or ottoman for putting on shoes, area rug or runner 80x150cm, potted plant in ceramic planter, small table lamp on the console. Minimal and welcoming — do not overcrowd this small space.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk",
  },

  dining_room: {
    id: "dining_room",
    label: "Salle a manger",
    emoji: "🍽️",
    description: "Mobilier adapte : table, chaises, buffet",
    roomSurfaceOverride: "",
    roomFurnitureOverride:
      "Dining room furniture: rectangular dining table 180cm long with matching set of 6 chairs, pendant light or chandelier centered above the table, table setting with ceramic plates and glassware for 4 place settings, linen table runner, sideboard or buffet 160cm wide as background anchor with decorative objects and candles, area rug 200x300cm under the table, potted plant or vase with fresh branches as centerpiece. Convivial and elegant atmosphere.",
    roomNegativeOverride:
      "sofa, TV unit, bed, wardrobe, office desk",
  },

  laundry: {
    id: "laundry",
    label: "Buanderie",
    emoji: "🧺",
    description: "Equipement adapte : machine a laver, rangements",
    roomSurfaceOverride:
      "Additionally for this laundry room: waterproof and easy-to-clean floor — white or light grey ceramic tiles with matte finish. Walls in washable matte white paint.",
    roomFurnitureOverride:
      "Laundry room equipment and storage: front-loading washing machine 60cm wide, tall narrow storage cabinet 40cm wide for cleaning supplies, wall-mounted or freestanding drying rack, woven laundry basket, small folding table or countertop above the washing machine if space allows, single overhead utility light. Functional and tidy — no decorative objects, no luxury items.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk, chandelier, area rug, potted plant",
  },
};

/** Ordered list for UI display */
export const ROOM_TYPE_LIST: RoomType[] = [
  ROOM_TYPES.living_room,
  ROOM_TYPES.bedroom,
  ROOM_TYPES.bathroom,
  ROOM_TYPES.kitchen,
  ROOM_TYPES.office,
  ROOM_TYPES.entryway,
  ROOM_TYPES.dining_room,
  ROOM_TYPES.laundry,
];

/**
 * Apply room type overrides to the style prompts.
 * Returns the effective prompts to use for generation.
 */
export function applyRoomTypeOverrides(
  surfacePrompt: string,
  furniturePrompt: string,
  roomTypeId: string | null
): {
  effectiveSurfacePrompt: string;
  effectiveFurniturePrompt: string;
  roomNegativeOverride: string;
} {
  if (!roomTypeId || !ROOM_TYPES[roomTypeId]) {
    return {
      effectiveSurfacePrompt: surfacePrompt,
      effectiveFurniturePrompt: furniturePrompt,
      roomNegativeOverride: "",
    };
  }

  const rt = ROOM_TYPES[roomTypeId];

  return {
    effectiveSurfacePrompt: rt.roomSurfaceOverride
      ? `${surfacePrompt}. ${rt.roomSurfaceOverride}`
      : surfacePrompt,
    effectiveFurniturePrompt: rt.roomFurnitureOverride
      ? rt.roomFurnitureOverride
      : furniturePrompt,
    roomNegativeOverride: rt.roomNegativeOverride || "",
  };
}
