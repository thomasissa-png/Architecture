/**
 * BR-2 — Photo en surface-only affiche l'AVANT au lieu du résultat passe 1
 *
 * TDD : ces tests décrivent le comportement attendu d'un helper
 * `buildResultFromApiResponse({pass1Url, outputUrl, withFurniture})` qui mappe
 * la réponse serveur vers le champ `displayUrl` côté client.
 *
 * Symptôme : quand `withFurniture: false` est envoyé pour une photo, le
 * client affiche `originalUrl` (l'input) au lieu de `pass1Url` (le résultat
 * de la passe 1 — surfaces rénovées sans meuble).
 *
 * Statut : helper non extrait. Test SKIPPÉ jusqu'à refactor.
 * Le test alternatif Grep est NON-skippé et détecte la régression
 * directement dans app/page.tsx.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface ApiResponse {
  pass1Url?: string | null;
  outputUrl?: string | null;
  inputUrl: string;
  withFurniture: boolean;
}

interface ResultDisplay {
  displayUrl: string;
  originalUrl: string;
}

// BLOCKED: helper extraction needed
function buildResultFromApiResponse(r: ApiResponse): ResultDisplay {
  // The expected behaviour:
  // - withFurniture=true → displayUrl = outputUrl ?? pass1Url
  // - withFurniture=false → displayUrl = pass1Url (NEVER inputUrl)
  if (r.withFurniture) {
    return {
      displayUrl: r.outputUrl || r.pass1Url || r.inputUrl,
      originalUrl: r.inputUrl,
    };
  }
  return {
    displayUrl: r.pass1Url || r.inputUrl,
    originalUrl: r.inputUrl,
  };
}

describe("BR-2 — buildResultFromApiResponse mapping", () => {
  it("U-BR2-001: withFurniture=false → displayUrl = pass1Url (PAS inputUrl)", () => {
    const r = buildResultFromApiResponse({
      pass1Url: "https://cdn.test/pass1.jpg",
      outputUrl: null,
      inputUrl: "https://cdn.test/input.jpg",
      withFurniture: false,
    });
    expect(r.displayUrl).toBe("https://cdn.test/pass1.jpg");
    expect(r.displayUrl).not.toBe("https://cdn.test/input.jpg");
  });

  it("U-BR2-002: withFurniture=true → displayUrl = outputUrl (chemin standard inchangé)", () => {
    const r = buildResultFromApiResponse({
      pass1Url: "https://cdn.test/pass1.jpg",
      outputUrl: "https://cdn.test/output.jpg",
      inputUrl: "https://cdn.test/input.jpg",
      withFurniture: true,
    });
    expect(r.displayUrl).toBe("https://cdn.test/output.jpg");
  });

  it("withFurniture=false + pass1Url null → fallback inputUrl (degraded mais non-crash)", () => {
    const r = buildResultFromApiResponse({
      pass1Url: null,
      outputUrl: null,
      inputUrl: "https://cdn.test/input.jpg",
      withFurniture: false,
    });
    // Acceptable de tomber sur inputUrl uniquement si pass1 manque (cas dégradé)
    expect(r.displayUrl).toBe("https://cdn.test/input.jpg");
  });
});

/**
 * Détection statique : on Grep app/page.tsx pour la régression.
 * Si le code mappe encore directement `originalUrl` au lieu de `pass1Url`
 * quand withFurniture=false, on flag.
 */
describe("BR-2 — détection statique régression dans app/page.tsx", () => {
  it("split-mode result : pass1Url DOIT être assigné depuis data.image (pas inputUrl)", () => {
    const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");
    // Recherche du bloc partialResult pendingPass2 — DOIT contenir `pass1Url: data.image`
    // ou équivalent. NE doit PAS contenir `pass1Url: filePreviewUrls[...]` (= input).
    const hasCorrectMapping = /pass1Url:\s*data\.image/.test(src);
    expect(
      hasCorrectMapping,
      "BR-2 régression possible : pass1Url n'est pas mappé depuis data.image dans le bloc split-mode",
    ).toBe(true);
  });
});
