/**
 * Prompt Regression Gates — Catégorie C (room type override).
 *
 * Spec : docs/ia/prompt-regression-gates-spec.md (Catégorie C — 6 gates)
 * Owner : @qa (Partie 2 — gates complexes, integration)
 *
 * Ces tests verrouillent le fix v55 P0-A (session 35, Pipeline B audit #196) :
 * dining_room / office recevaient le variant living_room concaténé et
 * produisaient un salon au lieu d'une salle à manger / d'un bureau.
 *
 * Principe : reproduire la logique EXACTE du caller de route.ts / pipeline.ts
 * pour simuler la chaîne `applyRoomTypeOverrides → if (rt.roomFurnitureOverride)`
 * et vérifier que le prompt final de pass 2 ne contient pas de leak
 * vocabulaire "living room".
 */
import { describe, it, expect } from "vitest";

import {
  ROOM_TYPES,
  applyRoomTypeOverrides,
  getStyleMaterialHint,
} from "@/lib/room-types";
import { STYLES } from "@/components/StylePicker";

// Liste des 12 styles indoor (hors "custom")
const INDOOR_STYLES = STYLES.filter((s) => s.id !== "custom");

/**
 * Reproduit la logique EXACTE du caller (route.ts:719-724 et pipeline.ts:922-927) :
 * ```
 * const rt = roomType ? ROOM_TYPES[roomType] : null;
 * if (rt?.roomFurnitureOverride) {
 *   trimmedFurniture = `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
 * } else {
 *   trimmedFurniture = effectiveFurniturePrompt;
 * }
 * ```
 */
function computeEffectiveFurniturePrompt(
  styleId: string,
  roomTypeId: string,
): string {
  const style = STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error(`Unknown style ${styleId}`);

  const { effectiveFurniturePrompt } = applyRoomTypeOverrides(
    style.surfacePrompt.trim(),
    style.furniturePrompt.trim(),
    roomTypeId,
  );
  const rt = ROOM_TYPES[roomTypeId];
  if (rt?.roomFurnitureOverride) {
    return `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
  }
  return effectiveFurniturePrompt;
}

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C01 — dining_room ne leak pas "sofa" ni "coffee table"
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C01 — dining_room never contains 'sofa' or 'coffee table' (v55 P0-A)", () => {
  INDOOR_STYLES.forEach((style) => {
    it(`dining_room × ${style.id}: no 'sofa' nor 'coffee table' leak from living_room variant`, () => {
      const effective = computeEffectiveFurniturePrompt(style.id, "dining_room");
      // Vérification insensible à la casse, mot entier uniquement (évite "sofa-inspired")
      expect(effective).not.toMatch(/\bsofa\b/i);
      expect(effective).not.toMatch(/\bcoffee table\b/i);
      // Doit en revanche contenir du vocabulaire dining_room
      expect(effective.toLowerCase()).toContain("dining");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C02 — office ne leak pas "sofa" ni "dining table"
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C02 — office never contains 'sofa' or 'dining table' (v55 P0-A)", () => {
  INDOOR_STYLES.forEach((style) => {
    it(`office × ${style.id}: no 'sofa' nor 'dining table' leak`, () => {
      const effective = computeEffectiveFurniturePrompt(style.id, "office");
      expect(effective).not.toMatch(/\bsofa\b/i);
      expect(effective).not.toMatch(/\bdining table\b/i);
      // Doit en revanche contenir "desk" (vocabulaire office)
      expect(effective.toLowerCase()).toContain("desk");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C03 — living_room est le SEUL indoor room avec
// roomFurnitureOverride === "" (reçoit le style variant verbatim)
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C03 — living_room is the ONLY room with empty roomFurnitureOverride (v55 P0-A)", () => {
  it("living_room has empty roomFurnitureOverride", () => {
    expect(ROOM_TYPES.living_room.roomFurnitureOverride).toBe("");
  });

  it("all other indoor room types have non-empty roomFurnitureOverride", () => {
    const otherRoomIds = Object.keys(ROOM_TYPES).filter(
      (id) => id !== "living_room",
    );
    expect(otherRoomIds.length).toBeGreaterThanOrEqual(10);
    otherRoomIds.forEach((id) => {
      const override = ROOM_TYPES[id].roomFurnitureOverride;
      expect(
        override.length,
        `${id} must have a non-empty roomFurnitureOverride (found "${override}")`,
      ).toBeGreaterThan(0);
    });
  });

  it("living_room × every style: effective furniture prompt is the style variant verbatim", () => {
    INDOOR_STYLES.forEach((style) => {
      const effective = computeEffectiveFurniturePrompt(style.id, "living_room");
      // Le style variant contient le mot "FOREGROUND" (convention Sprint 14) — doit survivre
      expect(
        effective,
        `living_room × ${style.id} lost FOREGROUND marker`,
      ).toContain("FOREGROUND");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C04 — getStyleMaterialHint utilisé quand roomFurnitureOverride non vide
// Verification cross-handler : route.ts ET generation-pipeline.ts
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C04 — getStyleMaterialHint used when roomFurnitureOverride non-empty (cross-handler)", () => {
  // Verification runtime : la chaîne produite contient le résultat de getStyleMaterialHint
  INDOOR_STYLES.forEach((style) => {
    it(`dining_room × ${style.id}: output contains getStyleMaterialHint output`, () => {
      const effective = computeEffectiveFurniturePrompt(style.id, "dining_room");
      const hint = getStyleMaterialHint(style.id);
      // P2-G2 round 3 garde : empêche le faux positif si getStyleMaterialHint
      // retourne "" en cas dégradé (toute string contient ""). Le hint doit être
      // non-vide ET de longueur significative pour valider la propagation.
      expect(hint.length).toBeGreaterThan(10);
      expect(effective).toContain(hint);
    });
  });

  it("office × every style: output contains getStyleMaterialHint output", () => {
    INDOOR_STYLES.forEach((style) => {
      const effective = computeEffectiveFurniturePrompt(style.id, "office");
      const hint = getStyleMaterialHint(style.id);
      // P2-G2 round 3 garde (cf. dining_room ci-dessus)
      expect(hint.length).toBeGreaterThan(10);
      expect(effective).toContain(hint);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C05 — bedroom_* roomNegativeOverride contient "sofa"
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C05 — bedroom_* roomNegativeOverride contains 'sofa'", () => {
  it("bedroom_adults.roomNegativeOverride contains 'sofa'", () => {
    expect(ROOM_TYPES.bedroom_adults.roomNegativeOverride.toLowerCase()).toContain("sofa");
  });

  it("bedroom_children.roomNegativeOverride contains 'sofa'", () => {
    expect(ROOM_TYPES.bedroom_children.roomNegativeOverride.toLowerCase()).toContain("sofa");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-C06 — kitchen roomNegativeOverride contient "sofa" + "coffee table"
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-C06 — kitchen roomNegativeOverride contains 'sofa' and 'coffee table'", () => {
  it("kitchen.roomNegativeOverride contains 'sofa'", () => {
    expect(ROOM_TYPES.kitchen.roomNegativeOverride.toLowerCase()).toContain("sofa");
  });

  it("kitchen.roomNegativeOverride contains 'coffee table'", () => {
    expect(ROOM_TYPES.kitchen.roomNegativeOverride.toLowerCase()).toContain("coffee table");
  });
});
