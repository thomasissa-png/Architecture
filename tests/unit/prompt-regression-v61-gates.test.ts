/**
 * Gates anti-régression v61 — TDD RED phase.
 *
 * Couvre les 4 findings P0 du round audit v60 session 39 :
 * - Finding #1 : regex kitchenSurface cassée (wood plank flooring)
 * - Finding #7 : contradiction sol systémique dans 4 builders
 * - Finding A3 : clause dining zone kitchen override
 * - Finding #5 : bathroom chantier brut sans fallback création
 *
 * Gate #2 (ratio padding) : test d'existence + it.todo.
 *
 * IMPORTANT : tous ces tests doivent échouer sur le code v60 actuel (RED phase).
 * Ils passeront GREEN après les fixes v61 correspondants.
 *
 * Source : docs/reviews/audit-v60-session39-*.md
 */
import { describe, it, expect } from "vitest";
import { buildSurfacesResponsesPrompt } from "@/lib/generation-pipeline";
import { ROOM_TYPES } from "@/lib/room-types";
import { getStyleById } from "@/lib/style-resolver";

function getSurfacePromptFor(styleId: string): string {
  const style = getStyleById(styleId);
  if (!style) throw new Error(`Style not found: ${styleId}`);
  return style.surfacePrompt;
}

describe("v61 gates — RED phase (must fail on v60, green after fixes)", () => {
  describe("V1 — Regex kitchenSurface robuste (Finding #1)", () => {
    it.each([
      ["bohemian", "wood plank flooring"],
      ["mid-century", "wood plank flooring"],
    ])(
      "kitchen + %s must strip '%s' from surface prompt",
      (styleId, banned) => {
        const surface = getSurfacePromptFor(styleId);
        const prompt = buildSurfacesResponsesPrompt(surface, "kitchen");
        expect(prompt.toLowerCase()).not.toContain(banned);
      }
    );

    it("kitchen + contemporary must strip 'engineered stone flooring'", () => {
      const surface = getSurfacePromptFor("contemporary");
      const prompt = buildSurfacesResponsesPrompt(surface, "kitchen");
      expect(prompt.toLowerCase()).not.toContain("engineered stone");
    });
  });

  describe("V7 — Pas de contradiction wood + ceramic (Finding #7)", () => {
    const HARD_ROOMS = ["kitchen", "bathroom", "wc", "laundry"] as const;
    const WOOD_STYLES = [
      "scandinavian",
      "japandi",
      "art-deco",
      "mid-century",
      "bohemian",
      "cosy",
      "haussmannian",
    ] as const;

    const combos = HARD_ROOMS.flatMap((room) =>
      WOOD_STYLES.map((style) => [room, style] as const)
    );

    it.each(combos)(
      "%s + %s must not mix wood flooring with ceramic tiles",
      (room, styleId) => {
        const surface = getSurfacePromptFor(styleId);
        const prompt = buildSurfacesResponsesPrompt(surface, room);
        const hasWood =
          /\b(wood|parquet|herringbone|plank|ash|oak|walnut)\b[^,.]*flooring/i.test(
            prompt
          );
        const hasCeramic = /ceramic[^,.]*tile/i.test(prompt);
        expect(
          hasWood && hasCeramic,
          `${styleId}+${room} has both wood flooring and ceramic tiles in: ${prompt.slice(
            0,
            300
          )}`
        ).toBe(false);
      }
    );
  });

  describe("A3 — Clause dining zone absente du kitchen override", () => {
    it("kitchen roomFurnitureOverride must NOT contain 'dining zone' clause", () => {
      const override = ROOM_TYPES.kitchen.roomFurnitureOverride ?? "";
      expect(override.toLowerCase()).not.toContain("dining zone");
    });
  });

  describe("#2 — Ratio preservation via padding (Finding #2)", () => {
    it("padToOpenAISize function must be exported from generation-pipeline", async () => {
      const mod = await import("@/lib/generation-pipeline");
      expect(typeof (mod as Record<string, unknown>).padToOpenAISize).toBe(
        "function"
      );
    });

    it.todo(
      "padToOpenAISize preserves 4:3 ratio via white padding and crop-back"
    );
  });

  describe("#5 — Bathroom chantier brut fallback (Finding #5)", () => {
    it("bathroom roomFurnitureOverride must contain raw shell install fallback", () => {
      const override = (
        ROOM_TYPES.bathroom.roomFurnitureOverride ?? ""
      ).toLowerCase();
      const hasRawShell =
        override.includes("raw shell") ||
        override.includes("install a complete");
      expect(
        hasRawShell,
        "bathroom override missing raw shell fallback clause"
      ).toBe(true);
    });
  });
});
