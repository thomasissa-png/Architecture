/**
 * R3 — generation-schema.ts — Tests unitaires
 *
 * Valide le contrat d'entrée de POST /api/generate.
 */
import { describe, it, expect } from "vitest";
import { parseGenerateBody } from "@/lib/generation-schema";

const validImage =
  "data:image/jpeg;base64," + Buffer.from("fake-image-data").toString("base64");

function baseValid() {
  return {
    image: validImage,
    surfacePrompt: "white walls, oak floor",
    furniturePrompt: "sofa 230cm, coffee table",
    styleId: "scandinave",
    width: 1024,
    height: 1024,
  };
}

describe("R3 — parseGenerateBody", () => {
  it("U-GS-001: body valide → ok true", () => {
    const r = parseGenerateBody(baseValid());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.styleId).toBe("scandinave");
      expect(r.data.withFurniture).toBe(true); // default
      expect(r.data.isOutdoor).toBe(false); // default
    }
  });

  it("U-GS-002: champ manquant (image) sur nouvelle génération → ok false", () => {
    const body = baseValid();
    delete (body as Record<string, unknown>).image;
    const r = parseGenerateBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path === "image")).toBe(true);
    }
  });

  it("U-GS-003: surfacePrompt vide → ok false", () => {
    const r = parseGenerateBody({ ...baseValid(), surfacePrompt: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path.includes("surfacePrompt"))).toBe(true);
    }
  });

  it("U-GS-004: width négatif → ok false", () => {
    const r = parseGenerateBody({ ...baseValid(), width: -100 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path === "width")).toBe(true);
    }
  });

  it("U-GS-005: width non-entier → ok false", () => {
    const r = parseGenerateBody({ ...baseValid(), width: 1024.5 });
    expect(r.ok).toBe(false);
  });

  it("U-GS-006: width > 8192 → ok false", () => {
    const r = parseGenerateBody({ ...baseValid(), width: 16000 });
    expect(r.ok).toBe(false);
  });

  it("U-GS-007: surfacePrompt > 5000 chars → ok false", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      surfacePrompt: "a".repeat(5001),
    });
    expect(r.ok).toBe(false);
  });

  it("U-GS-008: image non base64 data URI → ok false", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      image: "https://example.com/evil.jpg",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path === "image")).toBe(true);
    }
  });

  it("U-GS-009: image GIF non supporté → ok false", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      image: "data:image/gif;base64,abcd",
    });
    expect(r.ok).toBe(false);
  });

  it("U-GS-010: PNG accepté", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      image: "data:image/png;base64," + Buffer.from("x").toString("base64"),
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-011: WEBP accepté", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      image: "data:image/webp;base64," + Buffer.from("x").toString("base64"),
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-012: pass2Only sans pass1_key → ok false", () => {
    const r = parseGenerateBody({
      pass2Only: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path === "pass1_key")).toBe(true);
    }
  });

  it("U-GS-013: pass2Only avec pass1_key → ok true (pas besoin d'image)", () => {
    const r = parseGenerateBody({
      pass2Only: true,
      pass1_key: "logs/abc.jpg",
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-014: iteration sans image mais avec iterationComment → ok true", () => {
    const r = parseGenerateBody({
      iterationComment: "add a plant",
      pass1_key: "logs/xyz.jpg",
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-015: outputFormat enum — valeur inconnue → ok false", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      outputFormat: "square-hd",
    });
    expect(r.ok).toBe(false);
  });

  it("U-GS-016: outputFormat enum — valeurs valides", () => {
    for (const fmt of ["original", "landscape", "portrait"]) {
      const r = parseGenerateBody({ ...baseValid(), outputFormat: fmt });
      expect(r.ok).toBe(true);
    }
  });

  it("U-GS-017: previousModifications > 20 → ok false", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      previousModifications: Array.from({ length: 25 }, (_, i) => `mod ${i}`),
    });
    expect(r.ok).toBe(false);
  });

  it("U-GS-018: defaults appliqués correctement", () => {
    const r = parseGenerateBody({
      image: validImage,
      surfacePrompt: "walls",
      furniturePrompt: "sofa",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.styleId).toBe("custom");
      expect(r.data.withFurniture).toBe(true);
      expect(r.data.isOutdoor).toBe(false);
      expect(r.data.splitMode).toBe(false);
      expect(r.data.pass2Only).toBe(false);
      expect(r.data.previousModifications).toEqual([]);
    }
  });

  it("U-GS-019: tentative XSS dans styleId → acceptée au niveau schéma (sanitization côté downstream)", () => {
    // Le schéma ne sanitize pas — il valide le FORMAT, la sanitization XSS
    // est la responsabilité du rendu downstream. On vérifie juste que ce
    // n'est pas un blocage silencieux.
    const r = parseGenerateBody({
      ...baseValid(),
      styleId: "<script>alert(1)</script>",
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-020: iterationComment > 1000 chars → ok false", () => {
    const r = parseGenerateBody({
      iterationComment: "a".repeat(1001),
      pass1_key: "logs/x.jpg",
    });
    expect(r.ok).toBe(false);
  });

  it("U-GS-021: isOutdoor + outdoorSubtype null → ok true", () => {
    const r = parseGenerateBody({
      ...baseValid(),
      isOutdoor: true,
      outdoorSubtype: null,
    });
    expect(r.ok).toBe(true);
  });

  it("U-GS-022: roomType null explicite → ok true", () => {
    const r = parseGenerateBody({ ...baseValid(), roomType: null });
    expect(r.ok).toBe(true);
  });
});
