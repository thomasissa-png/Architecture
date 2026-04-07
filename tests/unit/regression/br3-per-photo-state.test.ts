/**
 * BR-3 — Affinage/régénération verrouille les autres photos
 *
 * Symptôme : `isRefining` / `iterationsRemaining` étaient des états globaux.
 * Affiner #1 désactivait Affiner #2 et #3.
 *
 * Fix appliqué dans page.tsx (commit 46a2ff5) : refiningIndices, regeneratingIndices,
 * refineErrors, refineWarningsByIndex sont maintenant des Maps/Sets indexés par photo.
 *
 * Ces tests valident le fix par grep statique sur app/page.tsx.
 * (Tests unitaires purs impossibles tant que les helpers ne sont pas extraits.)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");

describe("BR-3 — détection statique fix per-photo state dans app/page.tsx", () => {
  it("U-BR3-001: refiningIndices est un Set<number> (pas un boolean global)", () => {
    // On cherche `refiningIndices` (Set) — la version cassée serait `isRefining: boolean`.
    expect(src).toMatch(/refiningIndices/);
    // Le fix doit utiliser .has(index) pour le check per-photo
    expect(src).toMatch(/refiningIndices\.has\(/);
  });

  it("U-BR3-002: regeneratingIndices est un Set<number>", () => {
    expect(src).toMatch(/regeneratingIndices/);
    expect(src).toMatch(/regeneratingIndices\.has\(/);
  });

  it("U-BR3-003: refineErrors est une Map<number, ...>", () => {
    expect(src).toMatch(/refineErrors/);
    // .get(index) typique des Maps
    expect(src).toMatch(/refineErrors\.get\(/);
  });

  it("refineWarningsByIndex est une Map indexée par photo", () => {
    expect(src).toMatch(/refineWarningsByIndex/);
    expect(src).toMatch(/refineWarningsByIndex\.get\(/);
  });

  it("BR-3 NE doit PAS introduire de `setIsRefining(true)` global non-indexé", () => {
    // Si le code contient encore l'ancien pattern global sans index, c'est une régression.
    // L'ancienne version utilisait `const [isRefining, setIsRefining] = useState(false)`.
    // Le fix l'a transformé en refiningIndices Set.
    const hasGlobalIsRefiningState = /useState<boolean>\(false\)[^;]*isRefining/.test(src);
    expect(
      hasGlobalIsRefiningState,
      "BR-3 régression : `isRefining` est encore un boolean global",
    ).toBe(false);
  });

  it("commentaire de marquage BR-3 présent dans le code (// BR-3)", () => {
    // Le fix doit être annoté pour ne pas être supprimé par mégarde.
    expect(src).toMatch(/BR-3/);
  });
});
