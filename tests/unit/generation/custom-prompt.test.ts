/**
 * G2 — Pre-processing custom prompt — lib/custom-prompt.ts
 *
 * Coverage: U-CP-001 to U-CP-015.
 *
 * Tests the 3 exported functions:
 * - preprocessCustomPrompt (U-CP-001 to U-CP-007)
 * - classifyIterationIntent (U-CP-008 to U-CP-010)
 * - preprocessIterationComment (U-CP-011 to U-CP-015)
 *
 * OpenAI is mocked at module level. We control what JSON the mock returns
 * and assert the function parses it correctly + handles edge cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted — we cannot reference outer variables.
// Instead, we use vi.hoisted to share state.
const { chatCreateMock } = vi.hoisted(() => ({
  chatCreateMock: vi.fn(),
}));

vi.mock("openai", () => {
  // NOTE: must be a real class (not arrow fn) so `new OpenAI()` works.
  // vitest warning "did not use 'function' or 'class'" flags this otherwise.
  class OpenAI {
    chat = { completions: { create: chatCreateMock } };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts?: unknown) {}
  }
  return { default: OpenAI };
});

beforeEach(() => {
  chatCreateMock.mockReset();
  process.env.OPENAI_API_KEY = "sk-test-fake";
});

function mockJsonResponse(json: unknown) {
  chatCreateMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

describe("G2 — preprocessCustomPrompt", () => {
  it("U-CP-001: FR → EN traduction (mock retourne anglais)", async () => {
    mockJsonResponse({
      surfacePrompt: "Soft white walls, light oak flooring",
      furniturePrompt: "Cream boucle sofa 230cm, oak coffee table",
      warnings: [],
    });
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("salon cosy avec textures");
    expect(r.surfacePrompt).toMatch(/walls/i);
    expect(r.furniturePrompt).toMatch(/sofa/i);
    expect(r.surfacePrompt).not.toMatch(/[éèàç]/);
  });

  it("U-CP-002: split surface ≠ furniture", async () => {
    mockJsonResponse({
      surfacePrompt: "white walls oak floor",
      furniturePrompt: "cream sofa, walnut table",
      warnings: [],
    });
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("test");
    expect(r.surfacePrompt).not.toBe(r.furniturePrompt);
    expect(r.surfacePrompt).not.toMatch(/sofa/i);
  });

  it("U-CP-003: 'rideaux' → warning FR sans 'curtain' dans les prompts", async () => {
    mockJsonResponse({
      surfacePrompt: "white walls oak floor",
      furniturePrompt: "cream sofa",
      warnings: ["Les rideaux sont exclus car ils risquent de créer des fenêtres hallucinées par l'IA."],
    });
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("salon avec rideaux blancs");
    expect(r.warnings.length).toBeGreaterThanOrEqual(1);
    expect(r.warnings.some((w) => /rideaux/i.test(w))).toBe(true);
    expect(r.surfacePrompt).not.toMatch(/curtain/i);
    expect(r.furniturePrompt).not.toMatch(/curtain/i);
  });

  it("U-CP-004: 'cuisine équipée' → warning built-in", async () => {
    mockJsonResponse({
      surfacePrompt: "white walls",
      furniturePrompt: "stools and table",
      warnings: ["Les équipements de cuisine intégrés ne sont pas supportés en mode home staging."],
    });
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("cuisine équipée blanche");
    expect(r.warnings.some((w) => /équip|cuisine|intégr/i.test(w))).toBe(true);
  });

  it("U-CP-005: pas de OPENAI_API_KEY → fail-open (prompt brut)", async () => {
    process.env.OPENAI_API_KEY = "";
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("salon zen");
    expect(r.surfacePrompt).toBe("salon zen");
    expect(r.furniturePrompt).toBe("salon zen");
    expect(r.warnings).toEqual([]);
    expect(chatCreateMock).not.toHaveBeenCalled();
  });

  it("U-CP-007: réponse non-JSON → fallback raw prompt", async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: "this is not json at all {{{" } }],
    });
    const { preprocessCustomPrompt } = await import("@/lib/custom-prompt");
    const r = await preprocessCustomPrompt("test prompt raw");
    expect(r.surfacePrompt).toBe("test prompt raw");
    expect(r.furniturePrompt).toBe("test prompt raw");
  });
});

describe("G2 — classifyIterationIntent", () => {
  it("U-CP-008: 'change to scandinavian style' → 'restyle'", async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: "restyle" } }],
    });
    const { classifyIterationIntent } = await import("@/lib/custom-prompt");
    expect(await classifyIterationIntent("change to scandinavian style")).toBe("restyle");
  });

  it("U-CP-009: 'add a plant' → 'adjust'", async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: "adjust" } }],
    });
    const { classifyIterationIntent } = await import("@/lib/custom-prompt");
    expect(await classifyIterationIntent("add a plant")).toBe("adjust");
  });

  it("U-CP-010: OpenAI throw → safe default 'adjust'", async () => {
    chatCreateMock.mockRejectedValueOnce(new Error("API down"));
    const { classifyIterationIntent } = await import("@/lib/custom-prompt");
    expect(await classifyIterationIntent("anything")).toBe("adjust");
  });

  it("réponse inconnue → safe default 'adjust'", async () => {
    chatCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: "maybe-something" } }],
    });
    const { classifyIterationIntent } = await import("@/lib/custom-prompt");
    expect(await classifyIterationIntent("x")).toBe("adjust");
  });
});

describe("G2 — preprocessIterationComment", () => {
  it("U-CP-011: 'juste un canapé' → isExclusive=true", async () => {
    mockJsonResponse({
      enrichedComment: "ONLY: light grey linen 230cm wide sofa",
      isExclusive: true,
      allowWallMounted: false,
      warnings: [],
    });
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("juste un canapé", "scandinave", "base furniture");
    expect(r.isExclusive).toBe(true);
    expect(r.enrichedComment).toMatch(/^ONLY:/);
  });

  it("U-CP-012: 'remplacer X par Y' → isExclusive=false", async () => {
    mockJsonResponse({
      enrichedComment: "replace lamp with floor lamp",
      isExclusive: false,
      allowWallMounted: false,
      warnings: [],
    });
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("remplacer lampe par lampadaire", "scandinave", "");
    expect(r.isExclusive).toBe(false);
  });

  it("U-CP-013: 'ajouter étagère' → allowWallMounted=true", async () => {
    mockJsonResponse({
      enrichedComment: "add a wall-mounted oak shelf",
      isExclusive: false,
      allowWallMounted: true,
      warnings: [],
    });
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("ajouter une étagère", "scandinave", "");
    expect(r.allowWallMounted).toBe(true);
  });

  it("U-CP-014: 'ajouter canapé' → allowWallMounted=false", async () => {
    mockJsonResponse({
      enrichedComment: "add a 230cm sofa",
      isExclusive: false,
      allowWallMounted: false,
      warnings: [],
    });
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("ajouter un canapé", "scandinave", "");
    expect(r.allowWallMounted).toBe(false);
  });

  it("U-CP-015: 'enlever toilette' → warning sanitaire", async () => {
    mockJsonResponse({
      enrichedComment: "",
      isExclusive: false,
      allowWallMounted: false,
      warnings: ["Versimo est conçu pour le home staging mobilier. Les équipements sanitaires ne sont pas supportés dans ce mode."],
    });
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("enlever les toilettes", "scandinave", "");
    expect(r.warnings.some((w) => /sanitaire|home staging/i.test(w))).toBe(true);
  });

  it("OpenAI throw → fallback raw comment + no blocking", async () => {
    chatCreateMock.mockRejectedValueOnce(new Error("timeout"));
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("test comment", "scandinave", "");
    expect(r.enrichedComment).toBe("test comment");
    expect(r.warnings).toEqual([]);
    expect(r.isExclusive).toBe(false);
  });

  it("pas d'API key → fallback raw comment", async () => {
    process.env.OPENAI_API_KEY = "";
    const { preprocessIterationComment } = await import("@/lib/custom-prompt");
    const r = await preprocessIterationComment("test", "scandinave", "");
    expect(r.enrichedComment).toBe("test");
    expect(chatCreateMock).not.toHaveBeenCalled();
  });
});
