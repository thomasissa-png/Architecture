/**
 * BR-4 (session 37) — handleRefine doit utiliser un targetIndex EXPLICITE
 *
 * Symptôme reproduit en prod : l'utilisateur clique "Affiner" sur 2 images
 * d'une galerie de 3. Le système REMPLACE les 2 images par un duplicata de
 * l'image #3. Cause racine : `handleRefine` lisait `refineTargetIndex` (single
 * state global) au moment de l'exécution. Quand un refine #0 était en vol et
 * que l'utilisateur ouvrait le modal pour #1 (`setRefineTargetIndex(1)`), la
 * résolution du fetch #0 lisait la valeur ACTUELLE (1 ou 2) et écrivait sur
 * le mauvais slot via `setResults(prev => prev[refineTargetIndex] = ...)`.
 *
 * Migration session 34 (BR-3) avait migré `refiningIndices` vers Set<number>
 * mais oublié `refineTargetIndex` — fix incomplet.
 *
 * Le fix session 37 :
 *   - `handleRefine` accepte `(targetIndex: number, comment: string)` en paramètres
 *   - `<RefineModal onSubmit={(comment) => handleRefine(refineTargetIndex, comment)}>`
 *     capture la valeur de refineTargetIndex au render courant
 *   - `refineTargetIndex` n'apparaît plus DANS `handleRefine`, uniquement au site d'appel
 *
 * Tests par grep statique sur app/page.tsx (page.tsx étant trop volumineux
 * pour être monté en isolation par RTL — voir LIMITATIONS dans
 * br3-per-photo-state.test.ts pour la justification du pattern).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");

/**
 * Extrait le bloc useCallback complet de `handleRefine` (entête → deps array → `);`).
 * Utilise indexOf + bracket counting plutôt qu'une regex multilignes (page.tsx ~3200 lignes,
 * regex greedy explose).
 */
function extractHandleRefineBlock(): { body: string; deps: string } {
  const startIdx = src.indexOf("const handleRefine = useCallback(");
  if (startIdx === -1) throw new Error("handleRefine introuvable dans app/page.tsx");
  // On cherche la fin : la prochaine occurrence de `const handleRefineRetry`
  const endIdx = src.indexOf("const handleRefineRetry", startIdx);
  if (endIdx === -1) throw new Error("handleRefineRetry introuvable (borne fin)");
  const slice = src.slice(startIdx, endIdx);
  // Le bloc se termine par `);`. On découpe en body (avant le tableau de deps)
  // et deps (entre `[` et `]` du dernier tableau avant `);`).
  const depsMatch = slice.match(/\n\s*\[([^\]]*)\]\s*\n\s*\);/);
  if (!depsMatch) throw new Error("Tableau de deps de handleRefine introuvable");
  const depsStart = slice.lastIndexOf(depsMatch[0]);
  const body = slice.slice(0, depsStart);
  return { body, deps: depsMatch[1] };
}

describe("BR-4 — handleRefine targetIndex explicite (session 37)", () => {
  it("U-BR4-001: handleRefine accepte (targetIndex: number, comment: string) en paramètres", () => {
    // Le fix doit avoir une signature `async (targetIndex: number, comment: string)`.
    // Avant fix : `async (comment: string)` puis lecture de refineTargetIndex en interne.
    expect(src).toMatch(/handleRefine\s*=\s*useCallback\([\s\S]*?async\s*\(\s*targetIndex\s*:\s*number\s*,\s*comment\s*:\s*string\s*\)/);
  });

  it("U-BR4-002: handleRefine NE lit PAS refineTargetIndex depuis le state global", () => {
    const { body } = extractHandleRefineBlock();
    // Strip line comments and block comments
    const stripped = body
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    expect(stripped).not.toMatch(/refineTargetIndex/);
  });

  it("U-BR4-003: refineTargetIndex N'EST PAS dans le tableau de deps de handleRefine", () => {
    const { deps } = extractHandleRefineBlock();
    expect(deps).not.toMatch(/refineTargetIndex/);
  });

  it("U-BR4-004: <RefineModal> capture refineTargetIndex via inline closure au render", () => {
    // Le modal doit recevoir `(comment) => handleRefine(refineTargetIndex, comment)`
    // — la valeur est figée dans le closure de CHAQUE render, jamais lue tardivement.
    expect(src).toMatch(
      /onSubmit\s*=\s*\{\s*\(\s*comment\s*\)\s*=>\s*handleRefine\(\s*refineTargetIndex\s*,\s*comment\s*\)\s*\}/
    );
  });

  it("U-BR4-005: setResults dans handleRefine utilise targetIndex (paramètre), pas refineTargetIndex", () => {
    const { body } = extractHandleRefineBlock();
    const writes = body.match(/updated\[([^\]]+)\]\s*=/g) || [];
    expect(writes.length, "Aucune écriture `updated[...] =` trouvée dans handleRefine").toBeGreaterThan(0);
    for (const w of writes) {
      expect(w).toMatch(/updated\[targetIndex\]\s*=/);
    }
  });

  it("U-BR4-006: handleRefineRetry passe l'index explicitement à handleRefine", () => {
    // L'ancien code utilisait `setTimeout(() => handleRefine(comment), 0)` et
    // dépendait de `setRefineTargetIndex(index)` pour synchroniser le closure.
    // Le fix doit appeler `handleRefine(index, comment)` directement.
    expect(src).toMatch(/handleRefine\(\s*index\s*,\s*comment\s*\)/);
  });

  it("U-BR4-007: handleRegenerate accepte index en paramètre (cross-handler audit)", () => {
    // Confirme que handleRegenerate (le sibling de handleRefine) prend déjà
    // index en paramètre — règle PROPAGATION CROSS-HANDLER session 34.
    expect(src).toMatch(/const handleRegenerate\s*=\s*useCallback\(\s*async\s*\(\s*index\s*:\s*number\s*\)/);
  });

  it("U-BR4-008: secondaryAbortByIndexRef est Map<number, AbortController>", () => {
    // Pattern session 34 BR-3 : un AbortController PAR photo, pas global.
    expect(src).toMatch(/secondaryAbortByIndexRef\s*=\s*useRef<Map<number,\s*AbortController>>/);
  });

  it("U-BR4-009: lastRefineComments est Map<number, string>", () => {
    // Indexé par photo — sinon `handleRefineRetry(index)` lirait le commentaire
    // de la mauvaise photo.
    expect(src).toMatch(/lastRefineComments[\s\S]{0,200}Map<number,\s*string>/);
  });

  it("U-BR4-010: pas de regression `setTimeout(() => handleRefine(`", () => {
    // L'ancien hack `setTimeout` pour synchroniser le closure ne doit pas
    // ressurgir — il signale que quelqu'un essaie de lire un state global
    // au lieu de passer un paramètre.
    expect(src).not.toMatch(/setTimeout\(\s*\(\s*\)\s*=>\s*handleRefine\(/);
  });
});
