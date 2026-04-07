/**
 * G5 — Iteration prompt builders — lib/iteration-prompt.ts
 *
 * Snapshot-style assertions on the 4 builders : indoor/outdoor × adjust/restyle.
 *
 * Coverage: U-IT-001 to U-IT-008 + Section 8 BR-3/BR-4 indirect (Camera LOCKED, EXACT same count)
 */
import { describe, it, expect } from "vitest";
import {
  buildIterationFurnitureResponsesPrompt,
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildAdjustResponsesPrompt,
  buildAdjustOutdoorResponsesPrompt,
} from "@/lib/iteration-prompt";

describe("G5 — buildIterationFurnitureResponsesPrompt (restyle indoor)", () => {
  it("U-IT-001: snapshot Scandinave adjust contient 'Freestanding objects only'", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "scandinave furniture",
      ["add a plant"],
      { width: 2048, height: 1536, roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/Freestanding objects only/);
  });

  it("U-IT-002: kitchen → 'Built-in cabinetry and countertops expected'", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "test",
      ["add a coffee machine"],
      { roomType: "kitchen" },
    );
    expect(prompt).toMatch(/Built-in cabinetry and countertops expected/);
  });

  it("U-IT-003: allowWallMounted=true → 'Wall-mounted items allowed'", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "test",
      ["add shelves"],
      { allowWallMounted: true, roomType: null },
    );
    expect(prompt).toMatch(/Wall-mounted items allowed/);
  });

  it("U-IT-003b: allowWallMounted=false → 'Freestanding objects only'", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "test",
      ["add a sofa"],
      { allowWallMounted: false, roomType: null },
    );
    expect(prompt).toMatch(/Freestanding objects only/);
  });

  it("U-IT-004: aucun mot 'curtains' / 'drapes' (règle absolue)", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "test",
      ["change something"],
      { roomType: null },
    );
    expect(prompt).not.toMatch(/\bcurtains?\b/i);
    expect(prompt).not.toMatch(/\bdrapes?\b/i);
  });

  it("U-IT-005: 'EXACT same count' (anti-hallucination fenêtre session 33)", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "test",
      ["modify"],
      { roomType: null },
    );
    expect(prompt).toMatch(/EXACT same count/i);
  });

  it("U-IT-008: 'Same camera angle, height, tilt' (Camera LOCKED session 30)", () => {
    const prompt = buildIterationFurnitureResponsesPrompt("t", ["x"], { roomType: null });
    expect(prompt).toMatch(/Same camera angle/i);
    expect(prompt).toMatch(/height/);
    expect(prompt).toMatch(/tilt/);
  });

  it("preserve radiator count + position (session 33 fix BR equipment)", () => {
    const prompt = buildIterationFurnitureResponsesPrompt("t", ["x"], { roomType: null });
    expect(prompt).toMatch(/radiator/i);
    expect(prompt).toMatch(/Do not place furniture in front/i);
  });

  it("modifications listées avec versions v2, v3...", () => {
    const prompt = buildIterationFurnitureResponsesPrompt(
      "t",
      ["add plant", "remove lamp", "add chair"],
      { roomType: null },
    );
    expect(prompt).toMatch(/v2:/);
    expect(prompt).toMatch(/v3:/);
    expect(prompt).toMatch(/v4 \(current\)/);
  });
});

describe("G5 — buildIterationOutdoorFurnitureResponsesPrompt", () => {
  it("U-IT-006: pas de 'radiator' ni 'ceiling' (mutex F3/F2)", () => {
    const prompt = buildIterationOutdoorFurnitureResponsesPrompt("teak chairs", ["add umbrella"]);
    expect(prompt).not.toMatch(/radiator/i);
    expect(prompt).not.toMatch(/\bceiling\b/i);
  });

  it("U-IT-007: 'Sky stays as-is' présent", () => {
    const prompt = buildIterationOutdoorFurnitureResponsesPrompt("t", ["x"]);
    expect(prompt).toMatch(/Sky stays as-is/);
  });

  it("Camera LOCKED appliqué aussi en outdoor", () => {
    const prompt = buildIterationOutdoorFurnitureResponsesPrompt("t", ["x"]);
    expect(prompt).toMatch(/Same camera angle/i);
  });
});

describe("G5 — buildAdjustResponsesPrompt (SURGICAL EDIT indoor)", () => {
  it("contient 'mentally list every visible object' (session 34 fix)", () => {
    const prompt = buildAdjustResponsesPrompt("ajoute une plante", "add a green plant", {
      roomType: null,
    });
    expect(prompt).toMatch(/mentally list every visible object/i);
  });

  it("Camera LOCKED présent", () => {
    const prompt = buildAdjustResponsesPrompt("c", "ec", { roomType: null });
    expect(prompt).toMatch(/Same camera angle.*tilt.*field of view/);
  });

  it("aucun 'curtains' ni 'drapes'", () => {
    const prompt = buildAdjustResponsesPrompt("c", "ec", { roomType: null });
    expect(prompt).not.toMatch(/\bcurtains?\b/i);
  });

  it("kitchen → 'Keep all built-in cabinetry'", () => {
    const prompt = buildAdjustResponsesPrompt("c", "ec", { roomType: "kitchen" });
    expect(prompt).toMatch(/Keep all built-in cabinetry/);
  });

  it("EXACT same count of windows and doors", () => {
    const prompt = buildAdjustResponsesPrompt("c", "ec", { roomType: null });
    expect(prompt).toMatch(/EXACT same count/i);
  });

  it("'If removing an object' fill-in directive (anti-replacement session 34)", () => {
    const prompt = buildAdjustResponsesPrompt("c", "ec", { roomType: null });
    expect(prompt).toMatch(/If removing an object/);
  });
});

describe("G5 — buildAdjustOutdoorResponsesPrompt", () => {
  it("pas de 'ceiling', 'radiator', 'walls, floor, ceiling'", () => {
    const prompt = buildAdjustOutdoorResponsesPrompt("c", "ec");
    expect(prompt).not.toMatch(/\bceiling\b/i);
    expect(prompt).not.toMatch(/radiator/i);
  });

  it("'sky stays as-is'", () => {
    const prompt = buildAdjustOutdoorResponsesPrompt("c", "ec");
    expect(prompt).toMatch(/sky stays as-is/i);
  });

  it("Camera LOCKED présent (fix @qa Sprint 24)", () => {
    const prompt = buildAdjustOutdoorResponsesPrompt("c", "ec");
    expect(prompt).toMatch(/Same camera angle/i);
  });
});
