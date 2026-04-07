/**
 * Tests for `lib/image-analysis.ts` — detection des highlights cramés.
 *
 * Sprint 25 (v55) — voir docs/ia/v55-input-fidelity-investigation.md
 *
 * Génère des images synthétiques via sharp pour valider le seuil 95% luminance.
 */
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { detectBlownHighlights, detectBlownHighlightsFromBase64 } from "@/lib/image-analysis";

const W = 100;
const H = 100;
const PIXELS = W * H;

/**
 * Helper : génère un buffer JPEG d'une image RGB unie.
 */
async function makeSolidImage(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: { r, g, b },
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
}

/**
 * Helper : image moitié sombre / moitié cramée (vertical split).
 * `blownRatio` = fraction de la hauteur qui sera blanche pure.
 */
async function makePartiallyBlown(blownRatio: number): Promise<Buffer> {
  const blownRows = Math.round(H * blownRatio);

  const buffer = Buffer.alloc(PIXELS * 3);
  // top: white (cramé)
  for (let i = 0; i < blownRows * W * 3; i++) buffer[i] = 255;
  // bottom: dark grey (luminance ~50)
  for (let i = blownRows * W * 3; i < PIXELS * 3; i++) buffer[i] = 50;

  return sharp(buffer, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
}

describe("detectBlownHighlights", () => {
  it("returns hasBlownHighlights=false on a uniformly mid-grey image (clean input)", async () => {
    const img = await makeSolidImage(128, 128, 128);
    const result = await detectBlownHighlights(img);
    expect(result.ratio).toBeLessThan(0.01);
    expect(result.hasBlownHighlights).toBe(false);
  });

  it("returns hasBlownHighlights=false on a fully dark image (cave / sous-sol)", async () => {
    const img = await makeSolidImage(15, 15, 15);
    const result = await detectBlownHighlights(img);
    expect(result.ratio).toBeLessThan(0.01);
    expect(result.hasBlownHighlights).toBe(false);
  });

  it("returns hasBlownHighlights=true on a fully white image (worst case)", async () => {
    const img = await makeSolidImage(255, 255, 255);
    const result = await detectBlownHighlights(img);
    expect(result.ratio).toBeGreaterThan(0.95);
    expect(result.hasBlownHighlights).toBe(true);
  });

  it("returns hasBlownHighlights=true when ~30% of the image is blown (gen-192 case: baies vitrées surexposées)", async () => {
    const img = await makePartiallyBlown(0.3);
    const result = await detectBlownHighlights(img);
    // jpeg compression can blur the boundary slightly, but ratio should be > 0.20
    expect(result.ratio).toBeGreaterThan(0.2);
    expect(result.ratio).toBeLessThan(0.4);
    expect(result.hasBlownHighlights).toBe(true);
  });

  it("returns hasBlownHighlights=false when only 2% is blown (single small reflection — under threshold)", async () => {
    const img = await makePartiallyBlown(0.02);
    const result = await detectBlownHighlights(img);
    expect(result.ratio).toBeLessThan(0.05);
    expect(result.hasBlownHighlights).toBe(false);
  });

  it("respects custom ratioThreshold", async () => {
    const img = await makePartiallyBlown(0.1);
    // strict threshold (1%) → should flag
    const strict = await detectBlownHighlights(img, 0.01);
    expect(strict.hasBlownHighlights).toBe(true);
    // permissive threshold (50%) → should NOT flag
    const permissive = await detectBlownHighlights(img, 0.5);
    expect(permissive.hasBlownHighlights).toBe(false);
  });

  it("fail-open: returns ratio 0 + hasBlownHighlights=false on invalid buffer", async () => {
    const garbage = Buffer.from("not an image at all", "utf-8");
    const result = await detectBlownHighlights(garbage);
    expect(result.ratio).toBe(0);
    expect(result.hasBlownHighlights).toBe(false);
  });
});

describe("detectBlownHighlightsFromBase64", () => {
  it("accepts a raw base64 string", async () => {
    const img = await makeSolidImage(255, 255, 255);
    const result = await detectBlownHighlightsFromBase64(img.toString("base64"));
    expect(result.hasBlownHighlights).toBe(true);
  });

  it("accepts a data URI prefix", async () => {
    const img = await makeSolidImage(255, 255, 255);
    const dataUri = `data:image/jpeg;base64,${img.toString("base64")}`;
    const result = await detectBlownHighlightsFromBase64(dataUri);
    expect(result.hasBlownHighlights).toBe(true);
  });
});
