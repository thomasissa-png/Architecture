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

    it("padToOpenAISize preserves 4:3 input ratio via symmetric padding", async () => {
      const mod = await import("@/lib/generation-pipeline");
      const pad = (mod as any).padToOpenAISize as (w: number, h: number) => {
        openai: string;
        targetW: number;
        targetH: number;
        effectiveW: number;
        effectiveH: number;
        padX: number;
        padY: number;
      };

      // Input 1280x968 (ratio 1.322, 4:3 quasi) — cas #244/#245
      const result = pad(1280, 968);
      expect(result.openai).toBe("1536x1024");
      expect(result.targetW).toBe(1536);
      expect(result.targetH).toBe(1024);
      // L'image doit rentrer ENTIÈREMENT dans le canvas sans distorsion
      expect(result.effectiveW).toBeLessThanOrEqual(result.targetW);
      expect(result.effectiveH).toBeLessThanOrEqual(result.targetH);
      // Le ratio de l'image effective doit être identique au ratio input (± 1 px)
      const inputRatio = 1280 / 968;
      const effectiveRatio = result.effectiveW / result.effectiveH;
      expect(Math.abs(effectiveRatio - inputRatio)).toBeLessThan(0.005);
      // Au moins un axe doit avoir du padding (sinon le ratio match déjà le canvas)
      expect(result.padX + result.padY).toBeGreaterThan(0);
    });

    it("padImageToCanvas + cropImageFromCanvas round-trip preserves input dimensions", async () => {
      const mod = await import("@/lib/generation-pipeline");
      const padImageToCanvas = (mod as any).padImageToCanvas;
      const cropImageFromCanvas = (mod as any).cropImageFromCanvas;
      expect(typeof padImageToCanvas).toBe("function");
      expect(typeof cropImageFromCanvas).toBe("function");

      // Crée une image synthétique 1280x968 (ratio 4:3 ~1.322, cas #244/#245)
      const sharp = (await import("sharp")).default;
      const inputBuffer = await sharp({
        create: { width: 1280, height: 968, channels: 3, background: { r: 128, g: 180, b: 200 } },
      })
        .jpeg()
        .toBuffer();
      const inputBase64 = inputBuffer.toString("base64");

      // Pad → canvas OpenAI 1536x1024
      const { paddedBase64, meta } = await padImageToCanvas(inputBase64, 1280, 968);
      const paddedMeta = await sharp(Buffer.from(paddedBase64, "base64")).metadata();
      expect(paddedMeta.width).toBe(1536);
      expect(paddedMeta.height).toBe(1024);

      // Crop → retour aux dimensions input
      const croppedBase64 = await cropImageFromCanvas(paddedBase64, meta);
      const croppedMeta = await sharp(Buffer.from(croppedBase64, "base64")).metadata();
      expect(croppedMeta.width).toBe(1280);
      expect(croppedMeta.height).toBe(968);
    }, 15000);
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

  describe("#5b — Kitchen chantier brut fallback (Fix 7)", () => {
    it("kitchen roomFurnitureOverride must contain raw shell install fallback", () => {
      const override = ROOM_TYPES.kitchen.roomFurnitureOverride.toLowerCase();
      const hasRawShell = override.includes("raw shell") || override.includes("install a complete");
      expect(hasRawShell, "kitchen override missing raw shell fallback clause").toBe(true);
    });
  });

  describe("A1 — Outdoor jardin sol cleanup (Finding A1, Fix 9)", () => {
    it("jardin subtype replaces hard floor (natural ground only, no concrete pavers)", async () => {
      const { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } = await import("@/lib/outdoor-subtypes");
      const result = applyOutdoorSubtypeOverrides(
        "Contemporary outdoor: large-format grey concrete pavers 60x60cm laid in linear bond.",
        "dummy furniture",
        "jardin"
      );
      const lower = result.effectiveSurfacePrompt.toLowerCase();
      expect(lower).not.toContain("concrete pavers");
      expect(lower).toContain("natural ground");
    });

    it("terrasse subtype keeps hard floor (terrace needs paved surface)", async () => {
      const { applyOutdoorSubtypeOverrides } = await import("@/lib/outdoor-subtypes");
      const result = applyOutdoorSubtypeOverrides(
        "Contemporary outdoor: large-format grey concrete pavers 60x60cm.",
        "dummy",
        "terrasse"
      );
      expect(result.effectiveSurfacePrompt.toLowerCase()).toContain("concrete pavers");
    });
  });

  describe("#3 — getApiSize code mort supprimé (Finding #3, Fix 10)", () => {
    it("getApiSize is no longer exported from image-utils", () => {
      // Lecture directe du fichier (évite les imports DOM-dependent d'image-utils côté Node)
      const fs = require("fs") as typeof import("fs");
      const path = require("path") as typeof import("path");
      const content = fs.readFileSync(
        path.resolve(__dirname, "../../lib/image-utils.ts"),
        "utf-8"
      );
      expect(content).not.toContain("export function getApiSize");
    });
  });
});
