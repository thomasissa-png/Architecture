/**
 * F2 — Room type definitions for prompt enrichment.
 *
 * Each room type provides:
 * - roomSurfaceOverride: concatenated to the style's surfacePrompt (pass 1)
 * - roomFurnitureOverride: MERGES with the style's furniturePrompt (pass 2) — except when empty
 * - roomNegativeOverride: added to the Flux negative prompt
 *
 * Decision: roomFurnitureOverride MERGES with the style furniturePrompt — it provides
 * room-specific furniture while the style prompt provides materials, textures, colors,
 * and design references. This ensures bedroom furniture follows the chosen style.
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
    // v59 (Sprint audit v58 P0-1 patch Lucas #234) — PRESERVATION-FIRST + GEOMETRY-GATED.
    // v58 laissait les "ADD vanity ONLY if no vanity already" conditionnels qui etaient
    // ignores par gpt-image-1.5 (le modele lit "ADD vanity" et l'ajoute meme dans un couloir
    // de 60cm de large — cas #234 : bathroom hallway elargi a ~2m, vanity hallucinee sur mur
    // sans plomberie, convecteur supprime). v59 fix : hierarchie STEP 1/2/3 conditionnelle
    // a la largeur REELLE du couloir. STEP 1 (couloir etroit <1.5m) : accessoires floor-only,
    // ZERO wall-mounted. STEP 2 (bathroom standard >=1.5m) : possibilite d'AJOUTER vanity/
    // mirror SI ET SEULEMENT SI aucun n'est visible dans l'input. STEP 3 : preservation
    // obligatoire de TOUS les fixtures existants. Les negations d'interdiction (no vanity,
    // no mirror) sont remplacees par des listes d'AUTORISATION explicites ("ADD only").
    roomFurnitureOverride:
      "PRESERVATION-FIRST BATHROOM EDIT. Step 1 — check room width: if the usable floor area is a narrow corridor (walls closer than about 1.5m apart, passage 80cm or less), ADD ONLY 1-2 small freestanding floor accessories (a small teak or stoneware stool 30cm diameter with a candle and a rolled towel on top, a woven basket 25-30cm in a corner, one potted fern 25cm in a ceramic pot). In a narrow corridor ADD nothing on the walls — no vanity, no mirror, no towel ladder, no shelving, no wall cabinet. Step 2 — standard bathroom (more than 1.5m wide): ADD the floor accessories above PLUS one wall-mounted vanity unit 60cm wide with integrated basin and mixer tap on the longest empty wall ONLY if no vanity or sink basin exists in the input, a rectangular mirror above that vanity ONLY if no mirror exists in the input, a wall-mounted towel ladder 45cm wide 150cm tall in chrome or matte black with folded towels ONLY if the widest empty wall is longer than 1m. Step 3 — preserve all existing sanitary fixtures (bathtub, shower, shower enclosure, sink, basin, toilet, bidet) exactly as they appear: same position, same size, same shape, same finish. Never replace, never relocate, never duplicate. Never add a second bathtub, second shower, or freestanding tub. Clean and spa-like atmosphere. No armchairs, no floor lamps, no decorative furniture beyond the listed accessories.",
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
    // v58 (Sprint audit v57 P0-B, run #2) — PRESERVATION-FIRST (same pattern as bathroom P0-1).
    // Ancienne formulation prescrivait literalement "countertop work surface 60cm deep with
    // integrated sink, upper cabinetry 70cm tall, built-in oven 60cm wide and cooktop 60cm
    // wide" — sur une cuisine qui a deja four + plaque + sink, le modele gpt-image-1.5
    // DUPLIQUAIT les equipements (double four, double plaque, plans de travail additionnels).
    // gpt-image-1.5 obeit aux instructions explicites avant input_fidelity. Nouvelle
    // formulation : preservation explicite des built-ins existants, accessoires
    // freestanding/decoration UNIQUEMENT, instructions conditionnelles "ONLY if no X already
    // exists" pour les rares elements qui pourraient manquer (table, tabourets de bar,
    // suspension au-dessus d'un ilot). Les mots-cles countertop/cabinetry/cooktop/sink sont
    // conserves dans la clause de preservation pour satisfaire U-RT-002 + G-PROMPT-C06.
    roomFurnitureOverride:
      "Kitchen accessories and freestanding elements ONLY — preserve all existing kitchen built-in cabinetry (upper and lower cabinets), appliances (oven, cooktop, hob, range, fridge, dishwasher, microwave, hood, extractor fan), countertops, sink, faucet, and backsplash exactly as they appear in the input photo: same position, same size, same finish, same layout. Do NOT replace them, do NOT relocate them, do NOT add a second oven, a second cooktop, a second sink, or new cabinetry. ADD only freestanding and decorative accessories: a small cutting board 30cm on the countertop, a ceramic utensil jar 15cm with wooden spoons, a fruit bowl 25cm with seasonal fruit, a folded tea towel in a neutral tone, a small potted herb 12cm in a terracotta pot ONLY if a windowsill or free shelf is visible, a cookbook stand 20cm with an open cookbook ONLY if counter space allows. If — and only if — the input clearly shows a visible island or peninsula with no stools in front of it, add two or three bar stools 75cm seat height matching the style materials. If — and only if — the input clearly shows a dedicated dining zone within the kitchen (open floor area away from work zones) with no table visible, add a small dining table 100cm wide with 4 chairs matching the style. If — and only if — the input shows a visible island or peninsula with no pendant light above it, add one or two pendant lights 30-40cm matching the style — otherwise the ceiling light from pass 1 stays as the only overhead fixture. Functional and organized atmosphere — counters kept mostly clear, no clutter, no armchairs, no lounge chairs, no floor lamps, no area rug on the work zone.",
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
      "Home office furniture: desk 140cm wide 70cm deep 75cm tall with clean lines, ergonomic desk chair 65cm wide 45cm seat height with padded seat, desk lamp 45cm tall with adjustable arm. If office appears compact (≤3m wide): skip bookshelf, skip reading chair, skip area rug, keep desk accessories to pen holder + laptop only. If office appears medium or large: open bookshelf 80cm wide or storage unit as background anchor 160cm tall, comfortable reading chair 70cm wide in a corner if space allows, area rug 160x230cm under the desk area. Always: small plant 20cm on the desk, organized desk accessories (pen holder, notebook, monitor or laptop). Productive but inviting atmosphere — not a corporate office.",
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
      "Dining room furniture: If dining room appears compact (≤3m wide): round table 120cm diameter with 4 chairs, skip sideboard, use smaller rug 160x230cm, max 1 decorative accessory on the table. If dining room appears medium or large: rectangular dining table 180cm long with matching set of 6 chairs, sideboard or buffet 160cm wide as background anchor with decorative objects and candles, area rug 200x300cm under the table. Always: pendant light or chandelier centered above the table, table setting with ceramic plates and glassware for 4 place settings, linen table runner, potted plant or vase with fresh branches as centerpiece. Convivial and elegant atmosphere.",
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

/**
 * Rich material/texture/color hints per style — used when dedicated builders
 * (kitchen, bathroom, etc.) need to know the aesthetic without receiving the
 * full living-room furniturePrompt. 20-30 words per style.
 */
export const STYLE_MATERIAL_HINTS: Record<string, string> = {
  scandinavian:
    "Light birch and ash wood, oatmeal boucle fabric, whitewashed finishes, cream wool, matte black metal accents, muted blue and warm grey tones, minimal clean lines.",
  contemporary:
    "Brushed steel and chrome, charcoal boucle, smoked glass, engineered stone, matte black and brass accents, neutral grey palette with warm beige.",
  industrial:
    "Raw steel with visible welds, warm cognac leather with patina, reclaimed wood, matte black metal, aged brass, exposed rivets, muted red and navy accents.",
  japandi:
    "Light ash wood, natural undyed linen in ecru, unglazed ceramics, warm sand and clay tones, matte finishes throughout, washi paper, minimal ornamentation.",
  "art-deco":
    "Polished brass, deep emerald velvet, smoked glass, dark lacquer, geometric patterns in black gold and cream, crystal accents, pleated silk.",
  "mid-century":
    "Warm walnut wood, mustard and teal woven fabrics, brass and black metal, natural linen, tapered legs, organic curves, terracotta planters.",
  bohemian:
    "Natural rattan and wicker, kilim and mudcloth textiles in terracotta rust and indigo, reclaimed wood, sheepskin, jute, aged brass Moroccan accents.",
  mediterranean:
    "White lime plaster, natural linen in off-white, olive wood, wrought iron with aged patina, terracotta and turquoise glazed ceramics, esparto grass.",
  cosy:
    "Cream and camel boucle, chunky knit wool, light oak wood, warm cognac velvet, linen and sheepskin layers, ceramic stoneware, pillar candles.",
  "wabi-sabi":
    "Weathered reclaimed wood, raw undyed linen flax, unglazed ceramics with crackle glaze, natural stone, warm grey and charcoal tones, kintsugi-inspired.",
  maximalist:
    "Deep cobalt velvet, polished brass, lacquered coral, bold graphic patterns, mixed vintage Persian with contemporary prints, colored glass, animal print.",
  haussmannian:
    "Dark walnut wood, dove grey linen, aged brass with patina, cream leather, marble, dusty rose and sage velvet, crystal drops, gilt bronze accents.",
};

/**
 * Returns a rich style hint for dedicated builders.
 * Falls back to a basic hint if styleId is not in the map.
 */
export function getStyleMaterialHint(styleId: string | null | undefined): string {
  if (!styleId) return "Match the contemporary design style for all materials, finishes, and color palette.";
  const hint = STYLE_MATERIAL_HINTS[styleId];
  if (hint) {
    return `Design style: ${styleId.replace(/-/g, " ")}. Materials and palette: ${hint}`;
  }
  return `Match the ${styleId.replace(/-/g, " ")} design style for all materials, finishes, and color palette.`;
}

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
