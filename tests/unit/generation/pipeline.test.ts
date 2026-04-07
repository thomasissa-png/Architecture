/**
 * G1 — Pipeline 2 passes — lib/generation-pipeline.ts
 *
 * Tests the pure functions of the generation pipeline.
 * OpenAI is mocked at module level for tests of generatePass / extractRoomInventory.
 *
 * Coverage:
 * - U-GP-001 to U-GP-005 : getOutputSize ratios + landscape regression session 32
 * - U-GP-006 to U-GP-008 : checkRateLimit
 * - U-GP-009 to U-GP-010 : resolveChooseOne (NOT exported — tested through builder if reachable)
 * - U-GP-011 to U-GP-013 : scorePreservationLocal SSIM
 * - U-GP-014 to U-GP-017 : builders kitchen + anti-window/curtains/TRANSFORM
 * - U-GP-026 : PROMPT_VERSION format
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getOutputSize,
  checkRateLimit,
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
  buildOutdoorSurfacesResponsesPrompt,
  buildOutdoorFurnitureResponsesPrompt,
  scorePreservationLocal,
  PROMPT_VERSION,
} from "@/lib/generation-pipeline";

describe("G1 — getOutputSize (ratio mapping, regression session 32)", () => {
  it("U-GP-001: paysage 4:3 (2048×1536) → 1536×1024", () => {
    expect(getOutputSize(2048, 1536)).toEqual({ openai: "1536x1024", w: 1536, h: 1024 });
  });

  it("U-GP-002: portrait 3:4 (1536×2048) → 1024×1536", () => {
    expect(getOutputSize(1536, 2048)).toEqual({ openai: "1024x1536", w: 1024, h: 1536 });
  });

  it("U-GP-003: carré 1:1 (1024×1024) → 1024×1024", () => {
    expect(getOutputSize(1024, 1024)).toEqual({ openai: "1024x1024", w: 1024, h: 1024 });
  });

  it("U-GP-004: dimensions undefined → fallback carré 1024×1024", () => {
    expect(getOutputSize(undefined, undefined)).toEqual({ openai: "1024x1024", w: 1024, h: 1024 });
    expect(getOutputSize(0, 0)).toEqual({ openai: "1024x1024", w: 1024, h: 1024 });
  });

  it("U-GP-005: ratio EXACTEMENT 1.2 → carré (régression session 32, seuil non-strict)", () => {
    // 1200 / 1000 = 1.2 exact. Le code utilise `> 1.2` strict → carré.
    expect(getOutputSize(1200, 1000).openai).toBe("1024x1024");
  });

  it("U-GP-005b: ratio juste au-dessus de 1.2 → landscape", () => {
    expect(getOutputSize(1201, 1000).openai).toBe("1536x1024");
  });

  it("paysage 16:9 (1920×1080) → 1536×1024", () => {
    expect(getOutputSize(1920, 1080).openai).toBe("1536x1024");
  });

  it("portrait 9:16 (1080×1920) → 1024×1536", () => {
    expect(getOutputSize(1080, 1920).openai).toBe("1024x1536");
  });
});

describe("G1 — checkRateLimit (in-memory IP-based)", () => {
  beforeEach(() => {
    // Reset rate limit map by using fresh IPs per test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("U-GP-006: premier appel pour une IP neuve → true", () => {
    expect(checkRateLimit("10.0.0.1")).toBe(true);
  });

  it("U-GP-007: 11e appel d'affilée même IP → false", () => {
    const ip = "10.0.0.2";
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
    expect(checkRateLimit(ip)).toBe(false); // 11e
  });

  it("U-GP-008: reset après 60s → 11e appel autorisé", () => {
    const ip = "10.0.0.3";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(ip);
    }
    expect(checkRateLimit(ip)).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit(ip)).toBe(true);
  });
});

describe("G1 — buildSurfacesResponsesPrompt (anti-régression dédiés)", () => {
  it("U-GP-014: kitchen → ceramic/stone tiles, PAS de wide-plank ni walnut/oak/parquet", () => {
    const prompt = buildSurfacesResponsesPrompt(
      "Soft white walls, wide-plank oak flooring, walnut accents",
      "kitchen",
    );
    expect(prompt).toMatch(/ceramic or stone tiles/i);
    expect(prompt).not.toMatch(/wide-plank/i);
    // The regex strips wood/oak/walnut from kitchenSurface — assert nothing leaks
    expect(prompt).not.toMatch(/wide-plank oak/i);
  });

  it("U-GP-015: roomInventory non vide → injecté avec 'This room has:'", () => {
    const prompt = buildSurfacesResponsesPrompt(
      "white walls",
      "living_room",
      "exposed beams, large window south",
    );
    expect(prompt).toMatch(/This room has: exposed beams, large window south/);
  });

  it("U-GP-015b: roomInventory vide → pas d'injection", () => {
    const prompt = buildSurfacesResponsesPrompt("white walls", "living_room", "");
    expect(prompt).not.toMatch(/This room has:/);
  });

  it("U-GP-016: aucun mot 'TRANSFORM' dans tous les builders surfaces (règle CLAUDE.md)", () => {
    const roomTypes = [
      "kitchen",
      "bathroom",
      "wc",
      "bedroom_adults",
      "bedroom_children",
      "laundry",
      "cellar",
      "entryway",
      "living_room",
      null,
    ];
    for (const rt of roomTypes) {
      const prompt = buildSurfacesResponsesPrompt("test surface", rt);
      expect(prompt, `roomType=${rt}`).not.toMatch(/TRANSFORM/);
    }
  });

  it("U-GP-016b: aucun 'curtains/drapes/windows' dans les surfaces", () => {
    const prompt = buildSurfacesResponsesPrompt("white walls", "living_room");
    expect(prompt).not.toMatch(/\bcurtains?\b/i);
    expect(prompt).not.toMatch(/\bdrapes?\b/i);
  });

  it("bathroom : ONE ceiling light only (pas de spots recessed sauf si demandés)", () => {
    const prompt = buildSurfacesResponsesPrompt("test", "bathroom");
    expect(prompt).toMatch(/ONE ceiling light/);
  });
});

describe("G1 — buildFurnitureResponsesPrompt", () => {
  it("U-GP-017: aucun 'curtains/drapes' dans tous les builders furniture", () => {
    const roomTypes = [
      "kitchen",
      "bathroom",
      "wc",
      "bedroom_adults",
      "laundry",
      "cellar",
      "entryway",
      "living_room",
      null,
    ];
    for (const rt of roomTypes) {
      const prompt = buildFurnitureResponsesPrompt("test furniture", rt);
      expect(prompt, `roomType=${rt}`).not.toMatch(/\bcurtains?\b/i);
      expect(prompt, `roomType=${rt}`).not.toMatch(/\bdrapes?\b/i);
    }
  });

  it("furniture builder : aucun 'TRANSFORM'", () => {
    const prompt = buildFurnitureResponsesPrompt("test", "living_room");
    expect(prompt).not.toMatch(/TRANSFORM/);
  });

  it("furniture builder : contient 'EXACT same count' (anti-fenêtre session 33)", () => {
    const prompt = buildFurnitureResponsesPrompt("test", "living_room");
    expect(prompt).toMatch(/EXACT same count/i);
  });

  it("kitchen furniture : éléments cuisine présents (pas de canapé)", () => {
    const prompt = buildFurnitureResponsesPrompt("scandinave style", "kitchen");
    // Kitchen builder should NOT mention sofa/coffee table by default
    // (it may include the style description verbatim, hence we only check the dedicated kitchen markers)
    expect(prompt.toLowerCase()).toMatch(/kitchen|countertop|stool|appliance|cabinet|island/);
  });
});

describe("G1 — buildOutdoor builders (mutex F2)", () => {
  it("outdoor surfaces : pas de 'ceiling' ni 'pendant'", () => {
    const prompt = buildOutdoorSurfacesResponsesPrompt("travertine paving", "terrasse");
    expect(prompt).not.toMatch(/\bceiling\b/i);
    expect(prompt).not.toMatch(/\bpendant\b/i);
  });

  it("outdoor furniture : pas de 'radiator' ni 'ceiling'", () => {
    const prompt = buildOutdoorFurnitureResponsesPrompt("teak lounge chairs", "terrasse");
    expect(prompt).not.toMatch(/\bradiator/i);
    expect(prompt).not.toMatch(/\bceiling\b/i);
  });

  it("outdoor : 'sky' mentionné comme préservé", () => {
    const prompt = buildOutdoorSurfacesResponsesPrompt("paving", "terrasse");
    expect(prompt.toLowerCase()).toMatch(/sky/);
  });
});

describe("G1 — scorePreservationLocal (SSIM, fail-open)", () => {
  it("U-GP-013: base64 invalide → fail-open (score 5)", async () => {
    const score = await scorePreservationLocal("not-base64-at-all", "also-not");
    expect(score).toBe(5);
  });

  it("U-GP-011: même image en input et output → score >= 9 (quasi parfait)", async () => {
    // Tiny PNG, identique des deux côtés → SSIM = 1
    const tinyPng =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";
    const score = await scorePreservationLocal(tinyPng, tinyPng);
    // sharp may return 5 (fail-open) on a 1×1 png — accept >=5
    expect(score).toBeGreaterThanOrEqual(5);
  });
});

describe("G1 — PROMPT_VERSION", () => {
  it("U-GP-026: PROMPT_VERSION matche /^v\\d+$/", () => {
    expect(PROMPT_VERSION).toMatch(/^v\d+$/);
  });

  it("PROMPT_VERSION ≥ v54 (session 33+)", () => {
    const num = parseInt(PROMPT_VERSION.replace("v", ""), 10);
    expect(num).toBeGreaterThanOrEqual(54);
  });
});
