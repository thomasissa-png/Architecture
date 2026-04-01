/**
 * F2 — Room type definitions for prompt enrichment.
 *
 * Each room type provides:
 * - roomSurfaceOverride: concatenated to the style's surfacePrompt (pass 1)
 * - roomFurnitureOverride: MERGES with the style's furniturePrompt (pass 2) — except when empty
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
    description: "Mobilier adapté : canape, table basse, tapis",
    roomSurfaceOverride: "",
    roomFurnitureOverride: "",
    roomNegativeOverride: "",
  },

  bedroom_adults: {
    id: "bedroom_adults",
    label: "Chambre adultes",
    emoji: "🛏️",
    description: "Mobilier adapte : lit double, chevets, armoire",
    roomSurfaceOverride:
      "Additionally for this adult bedroom: warm-toned flooring suitable for bare feet.",
    roomFurnitureOverride:
      "Adult bedroom furniture: upholstered double bed 160cm wide with padded headboard and fitted bedlinen in neutral tones, two matching bedside tables 45cm wide with table lamps, a soft area rug 160x230cm beside the bed, a bench or ottoman at the foot of the bed, a tall wardrobe or dresser as background anchor. One accent chair or reading nook if space allows. Intentional calm — no clutter, no work-related objects.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, dining table, office desk, crib, bunk bed, toy",
  },

  bedroom_children: {
    id: "bedroom_children",
    label: "Chambre enfants",
    emoji: "🧒",
    description: "Mobilier adapte : lit enfant, rangements, espace jeu",
    roomSurfaceOverride:
      "Additionally for this children bedroom: warm-toned flooring suitable for bare feet, durable and easy to clean.",
    roomFurnitureOverride:
      "Children bedroom furniture: single bed 90cm wide with simple headboard and colorful bedlinen, one bedside table 40cm wide with small lamp, a soft play rug 120x170cm beside the bed, low open shelving unit 100cm wide for books and toys, small desk 80cm wide with child-sized chair for homework if space allows, woven storage basket on the floor for toys. Playful but tidy — age-appropriate, no adult furniture, no fragile objects.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, dining table, office desk, double bed, king bed",
  },

  bathroom: {
    id: "bathroom",
    label: "Salle de bain",
    emoji: "🚿",
    description: "Mobilier adapté : vasque, miroir, rangements",
    // FALLBACK ONLY — surface directives are handled by the dedicated builder in route.ts.
    // This override is used only if the dedicated builder is removed or bypassed.
    roomSurfaceOverride:
      "Additionally for this bathroom: floor-to-ceiling ceramic wall tiles in the shower zone and behind the vanity area — waterproof and seamless. Water-resistant floor — ceramic or stone floor tiles with matte non-slip finish. No wood flooring in wet areas. Recessed IP44-rated ceiling spotlights for even bathroom illumination.",
    roomFurnitureOverride:
      "Bathroom fixtures and accessories: frameless glass walk-in shower enclosure 80-90cm wide with chrome rain showerhead 25cm diameter and handheld fixture mounted on the wall, wall-mounted vanity unit 80cm wide 45cm deep with integrated basin and chrome mixer tap, rectangular backlit mirror 70cm wide 90cm tall centered above the basin, wall-mounted towel ladder 45cm wide 150cm tall in chrome or matte black with folded towels in neutral tones, small teak stool 30cm diameter 45cm tall with soap dispenser and candle, one potted fern 25cm pot diameter on the floor near the shower, woven basket 30cm diameter on the floor for storage. If room appears large (deep or double-width), add a freestanding soaking tub 170x75cm as well. Clean and spa-like atmosphere. No armchairs, no floor lamps, no decorative furniture.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp, armchair, lounge chair, bouclé chair, tripod lamp, arc lamp",
  },

  kitchen: {
    id: "kitchen",
    label: "Cuisine",
    emoji: "🍳",
    description: "Mobilier adapté : plan de travail, caissons, tabourets",
    // FALLBACK ONLY — surface directives are handled by the dedicated builder in route.ts.
    // This override is used only if the dedicated builder is removed or bypassed.
    roomSurfaceOverride:
      "Additionally for this kitchen: ceramic or natural stone floor tiles suited for a kitchen. IMPORTANT OVERRIDE: the floor MUST be ceramic tiles or natural stone — NOT wood, NOT parquet, NOT herringbone wood. Subway tile or smooth splashback on the wall behind the work area.",
    roomFurnitureOverride:
      "Kitchen furnishing: countertop work surface 60cm deep with integrated sink, upper cabinetry 70cm tall mounted at 140cm from floor in neutral finish, lower cabinetry 85cm tall in matching finish, built-in oven 60cm wide and cooktop 60cm wide, two or three bar stools 75cm seat height at an island or peninsula if space allows, pendant light 30cm diameter above the work area, cutting board and ceramic jar 15cm with utensils on the counter, small herb pots 12cm (basil, rosemary) on a shelf or windowsill, fruit bowl 25cm on the counter. Functional and organized layout. No armchairs, no lounge chairs, no floor lamps.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, floor lamp, arc lamp, area rug, armchair, lounge chair",
  },

  office: {
    id: "office",
    label: "Bureau",
    emoji: "💼",
    description: "Mobilier adapté : bureau, fauteuil, bibliotheque",
    roomSurfaceOverride: "",
    roomFurnitureOverride:
      "Home office furniture: desk 140cm wide 70cm deep 75cm tall with clean lines, ergonomic desk chair 65cm wide 45cm seat height with padded seat, desk lamp 45cm tall with adjustable arm, open bookshelf 80cm wide or storage unit as background anchor 160cm tall, small plant 20cm on the desk, organized desk accessories (pen holder, notebook, monitor or laptop), comfortable reading chair 70cm wide in a corner if space allows, area rug 160x230cm under the desk area. Productive but inviting atmosphere — not a corporate office.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table",
  },

  entryway: {
    id: "entryway",
    label: "Entrée",
    emoji: "🚪",
    description: "Mobilier adapté : console, miroir, portemanteau",
    roomSurfaceOverride:
      "Additionally for this entryway: durable floor finish suitable for an entrance — ceramic tiles, natural stone, or hard-wearing wood.",
    roomFurnitureOverride:
      "Entryway furniture: console table 100cm wide against the available wall with a decorative object and small tray for keys, wall-leaning framed mirror propped on the console, freestanding coat rack, small bench or ottoman for putting on shoes, area rug or runner 80x150cm, potted plant in ceramic planter, small table lamp on the console. Minimal and welcoming — do not overcrowd this small space.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk",
  },

  dining_room: {
    id: "dining_room",
    label: "Salle à manger",
    emoji: "🍽️",
    description: "Mobilier adapté : table, chaises, buffet",
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
    description: "Équipement adapté : machine à laver, rangements",
    roomSurfaceOverride:
      "Additionally for this laundry room: waterproof and easy-to-clean floor — white or light grey ceramic tiles with matte finish. Walls in washable matte white paint.",
    roomFurnitureOverride:
      "Laundry room equipment and storage: front-loading washing machine 60cm wide, tall narrow storage cabinet 40cm wide for cleaning supplies, wall-mounted or freestanding drying rack, woven laundry basket, small folding table or countertop above the washing machine if space allows, single overhead utility light. Functional and tidy — no decorative objects, no luxury items.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk, chandelier, area rug, potted plant",
  },

  cellar: {
    id: "cellar",
    label: "Cave",
    emoji: "🍷",
    description: "Amenagement adapte : rangements, etageres, eclairage",
    roomSurfaceOverride:
      "Additionally for this cellar: concrete or natural stone floor kept as-is or with simple sealant. Walls in clean matte white or light grey paint over existing masonry.",
    roomFurnitureOverride:
      "Cellar furnishing: sturdy metal or wooden storage shelving unit 180cm tall against the back wall, a few labeled storage boxes or wicker baskets on the shelves, simple overhead utility light fixture, wall-mounted wine rack 100cm wide if space allows, rubber floor mat near the entrance. Functional storage space — clean and organized, no luxury furniture, no decorative objects.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk, chandelier, area rug, potted plant, curtains",
  },

  wc: {
    id: "wc",
    label: "WC",
    emoji: "🚽",
    description: "Amenagement adapte : toilettes, lave-mains, rangement",
    roomSurfaceOverride:
      "Additionally for this WC/toilet room: waterproof floor — small-format ceramic tiles or vinyl in neutral tone. Walls in washable matte paint or ceramic tiles on the lower half.",
    roomFurnitureOverride:
      "WC room fixtures: wall-hung or floor-standing toilet, compact wall-mounted hand basin 40cm wide with small mirror above, small shelf or wall-mounted cabinet for storage, toilet brush holder, single pendant or wall sconce for lighting. Minimal and hygienic — this is a very small space, do not overcrowd, no luxury items, no large furniture.",
    roomNegativeOverride:
      "sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk, chandelier, area rug, bathtub, shower",
  },
};

/** Ordered list for UI display */
export const ROOM_TYPE_LIST: RoomType[] = [
  ROOM_TYPES.living_room,
  ROOM_TYPES.dining_room,
  ROOM_TYPES.kitchen,
  ROOM_TYPES.bedroom_adults,
  ROOM_TYPES.bedroom_children,
  ROOM_TYPES.bathroom,
  ROOM_TYPES.wc,
  ROOM_TYPES.office,
  ROOM_TYPES.entryway,
  ROOM_TYPES.laundry,
  ROOM_TYPES.cellar,
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
    // MERGE room type furniture with style furniture — room type provides the functional
    // furniture list, style provides materials/textures/colors/references.
    // Without this merge, all 12 styles produce the same generic room.
    effectiveFurniturePrompt: rt.roomFurnitureOverride
      ? `${rt.roomFurnitureOverride} Use the following style for materials, textures, colors, and design references: ${furniturePrompt}`
      : furniturePrompt,
    roomNegativeOverride: rt.roomNegativeOverride || "",
  };
}
