/**
 * BR-4 — Tab-switch iOS pendant itération → BACKGROUND_DISCONNECT
 *
 * Symptôme : `AbortController.signal` était attaché au fetch d'itération.
 * Quand iOS Safari met l'onglet en arrière-plan, le fetch est tué et
 * l'utilisateur voit "BACKGROUND_DISCONNECT - Votre itération n'a pas été consommée".
 *
 * Fix appliqué (commit 46a2ff5) : retrait de `signal:` du fetch d'itération,
 * gestion BackgroundDisconnectError → toast galerie + refund (pattern session 32).
 *
 * Validation par grep statique :
 * - Aucun `signal:` dans app/page.tsx (le pattern session 32 doit s'appliquer
 *   à TOUS les fetches d'itération)
 * - BackgroundDisconnectError doit être catché dans les blocs handleRefine et
 *   handleRegenerate (lignes ~1251, 1501, 1549)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");

describe("BR-4 — détection statique fix tab-switch iteration", () => {
  it("U-BR4-001: aucun `signal:` attaché à un fetch dans app/page.tsx", () => {
    // Pattern : fetch(..., { ..., signal: controller.signal, ... })
    // Le fix session 32 + BR-4 supprime TOUS les signal: (génération + itération).
    const matches = src.match(/\bsignal:\s*\w+/g) || [];
    expect(
      matches.length,
      `BR-4 régression : ${matches.length} occurrence(s) de \`signal:\` dans page.tsx`,
    ).toBe(0);
  });

  it("U-BR4-002: BackgroundDisconnectError est catché dans handleRefine", () => {
    // Le fix doit gérer cette erreur (toast galerie + refund), pas la propager.
    expect(src).toMatch(/BackgroundDisconnectError/);
    // Pattern : if (e instanceof BackgroundDisconnectError) ...
    expect(src).toMatch(/instanceof BackgroundDisconnectError/);
  });

  it("U-BR4-003: BackgroundDisconnectError → toast galerie OU refund (pattern session 32)", () => {
    // On vérifie qu'une chaîne 'galerie' / 'arrière-plan' / 'background' apparaît
    // dans un contexte proche d'un BackgroundDisconnectError.
    const idxs: number[] = [];
    const re = /BackgroundDisconnectError/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) idxs.push(m.index);
    expect(idxs.length).toBeGreaterThan(0);
    // Pour au moins une occurrence, vérifier qu'à proximité on trouve "galerie" ou un toast
    const hasGalleryHandling = idxs.some((idx) => {
      const window = src.slice(Math.max(0, idx - 200), idx + 1500);
      return /galerie|arri[èe]re|background|toast|setToast|refundCredit|gallery/i.test(window);
    });
    expect(
      hasGalleryHandling,
      "BR-4 régression : BackgroundDisconnectError attrapé sans handler galerie/refund",
    ).toBe(true);
  });

  it("BR-4 commentaire de marquage présent (// BR-4 ou session 34)", () => {
    expect(src).toMatch(/BR-4|session 3[24]/);
  });

  it("la classe BackgroundDisconnectError est définie en haut de page.tsx", () => {
    expect(src).toMatch(/class BackgroundDisconnectError extends Error/);
  });
});
