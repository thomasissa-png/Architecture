/**
 * G8 — Room types & outdoor — lib/room-types.ts + lib/outdoor-subtypes.ts
 *
 * Coverage: U-RT-001 to U-RT-003 + U-OD-001 to U-OD-002
 */
import { describe, it, expect } from "vitest";
import { ROOM_TYPES, applyRoomTypeOverrides } from "@/lib/room-types";
import { OUTDOOR_SUBTYPES, applyOutdoorSubtypeOverrides } from "@/lib/outdoor-subtypes";

describe("G8 — applyRoomTypeOverrides", () => {
  it("U-RT-001: living_room → style inchangé (pas d'override)", () => {
    const r = applyRoomTypeOverrides("white walls", "cream sofa", "living_room");
    expect(r.effectiveSurfacePrompt).toBe("white walls");
    expect(r.effectiveFurniturePrompt).toBe("cream sofa");
    expect(r.roomNegativeOverride).toBe("");
  });

  it("roomTypeId=null → pas d'override", () => {
    const r = applyRoomTypeOverrides("walls", "sofa", null);
    expect(r.effectiveSurfacePrompt).toBe("walls");
  });

  it("roomTypeId inconnu → pas d'override", () => {
    const r = applyRoomTypeOverrides("walls", "sofa", "inexistant");
    expect(r.effectiveSurfacePrompt).toBe("walls");
  });

  it("U-RT-002: kitchen → roomFurnitureOverride contient éléments cuisine", () => {
    const r = applyRoomTypeOverrides("white walls", "scandinave sofa style", "kitchen");
    expect(r.effectiveFurniturePrompt).toMatch(/countertop|cabinetry|cooktop|sink/i);
    // Le style scandinave est mergé en référence matériau, pas écrasé
    expect(r.effectiveFurniturePrompt).toMatch(/scandinave/);
    // Negative override empêche le canapé
    expect(r.roomNegativeOverride).toMatch(/sofa/);
  });

  it("U-RT-002b: bedroom_adults → bed-related furniture, négatif=sofa", () => {
    const r = applyRoomTypeOverrides("walls", "style", "bedroom_adults");
    expect(r.effectiveFurniturePrompt).toMatch(/bed|bedside/i);
    expect(r.roomNegativeOverride).toMatch(/sofa/);
  });

  it("bathroom → fixtures vasque/miroir, négatif=sofa", () => {
    const r = applyRoomTypeOverrides("walls", "style", "bathroom");
    expect(r.effectiveFurniturePrompt).toMatch(/vanity|basin|shower/i);
    expect(r.roomNegativeOverride).toMatch(/sofa/);
  });

  it("U-RT-003: tous les room types non-living_room ont un roomFurnitureOverride non-vide", () => {
    for (const id of Object.keys(ROOM_TYPES)) {
      const rt = ROOM_TYPES[id];
      if (id === "living_room") continue;
      expect(rt.roomFurnitureOverride.length, `roomType=${id}`).toBeGreaterThan(0);
    }
  });

  it("ROOM_TYPES contient au moins 8 entrées", () => {
    expect(Object.keys(ROOM_TYPES).length).toBeGreaterThanOrEqual(8);
  });
});

describe("G8 — applyOutdoorSubtypeOverrides", () => {
  it("U-OD-001: terrasse → subtypeSurfaceOverride concaténé", () => {
    const r = applyOutdoorSubtypeOverrides("travertine paving", "lounge chairs", "terrasse");
    expect(r.effectiveSurfacePrompt).toMatch(/travertine paving/);
    expect(r.effectiveSurfacePrompt).toMatch(/terrace|facade/i);
  });

  it("balcon → contraintes compactes (no large garden set)", () => {
    const r = applyOutdoorSubtypeOverrides("paving", "chairs", "balcon");
    expect(r.effectiveFurniturePrompt).toMatch(/Compact|bistro|folding/i);
    expect(r.subtypeNegativeOverride).toMatch(/large/i);
  });

  it("subtypeId=null → pas d'override", () => {
    const r = applyOutdoorSubtypeOverrides("paving", "chairs", null);
    expect(r.effectiveSurfacePrompt).toBe("paving");
  });

  it("U-OD-002: 5 sous-types — terrasse, balcon, patio, jardin, rooftop", () => {
    const expected = ["terrasse", "balcon", "patio", "jardin", "rooftop"];
    for (const id of expected) {
      expect(OUTDOOR_SUBTYPES[id], `subtype=${id}`).toBeDefined();
    }
    expect(Object.keys(OUTDOOR_SUBTYPES).length).toBe(5);
  });

  it("rooftop → preserve skyline + parapet", () => {
    const r = applyOutdoorSubtypeOverrides("paving", "chairs", "rooftop");
    expect(r.effectiveSurfacePrompt).toMatch(/skyline|parapet|guard rail/i);
  });
});
