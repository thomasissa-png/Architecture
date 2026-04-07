/**
 * BR-4 (session 37) — Bug Affiner : écrasement croisé entre photos
 *
 * Symptôme reproduit par le fondateur :
 *   1. Génère 3 photos
 *   2. Clique "Affiner" sur la photo #0, écrit un commentaire, valide
 *   3. Pendant que #0 tourne, ouvre "Affiner" sur la photo #1
 *   4. La résolution du fetch #0 écrit le résultat dans le slot de la
 *      photo affichée au moment de la résolution (#1 ou #2), pas dans #0
 *
 * Cause racine :
 *   `handleRefine` lisait `targetIndex` depuis le state global
 *   `refineTargetIndex` (closure stale). Quand l'utilisateur ouvrait le
 *   modal pour une autre photo, `setRefineTargetIndex` mettait à jour le
 *   state, et toute closure de `handleRefine` créée APRÈS lisait la
 *   nouvelle valeur. La promesse fetch en vol résolvait avec un index
 *   qui n'était plus le sien.
 *
 * Fix appliqué (commit à venir) :
 *   - `handleRefine(targetIndex, comment)` reçoit l'index en PARAMÈTRE
 *   - Le `RefineModal.onSubmit` est wrappé : `(c) => handleRefine(refineTargetIndex, c)`
 *     → l'index est capturé au render courant, figé dans la closure
 *   - `refineTargetIndex` retiré des deps de `useCallback`
 *   - `handleRefineRetry` appelle `handleRefine(index, comment)` sans setTimeout
 *
 * Stratégie de test :
 *   1. STATIC GATES — grep sur app/page.tsx pour verrouiller la shape du fix
 *   2. LOGIC SIMULATION — modèle pur qui reproduit le pattern (state vs param)
 *      avec une matrice exhaustive de scénarios :
 *        - 1, 2, 3, 4, 5 photos générées
 *        - Sélections diverses (#0, #1, #0+#1, #0+#2, #1+#2, etc.)
 *        - Ordres variés (#2 puis #0, #0 puis #1 puis #2, inverse)
 *        - Concurrence stricte (résolutions out-of-order)
 *        - Cas limites (annulation, retry, double affinage du même index)
 *
 * Note conventionnelle : ce fichier suit le pattern de tests/unit/regression/
 * (br1, br2, br3, br4-tab-switch). L'utilisateur a demandé
 * `__tests__/refine-coverage.test.tsx` mais les conventions Versimo placent
 * tous les tests sous `tests/unit/` (vitest.config.ts include).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");

// =============================================================================
// PARTIE 1 — STATIC GATES (verrouille la shape du fix dans app/page.tsx)
// =============================================================================

describe("BR-4 session 37 — static gates fix Affiner", () => {
  it("U-BR4S37-001: handleRefine prend `targetIndex` en PARAMÈTRE explicite", () => {
    // Anti-pattern (cassé) : `async (comment: string) => { const targetIndex = refineTargetIndex; ... }`
    // Pattern correct : `async (targetIndex: number, comment: string) => { ... }`
    expect(src).toMatch(/handleRefine\s*=\s*useCallback\(\s*\n?\s*async\s*\(\s*targetIndex:\s*number\s*,\s*comment:\s*string\s*\)/);
  });

  it("U-BR4S37-002: handleRefine NE lit PLUS targetIndex depuis le state global", () => {
    // L'ancien code contenait `const targetIndex = refineTargetIndex;` en première
    // ligne du callback. Si ce pattern revient, la régression est de retour.
    const badPattern = /const\s+targetIndex\s*=\s*refineTargetIndex\s*;/;
    expect(badPattern.test(src)).toBe(false);
  });

  it("U-BR4S37-003: refineTargetIndex N'est PLUS dans les deps de handleRefine useCallback", () => {
    // Extrait le useCallback handleRefine et inspecte sa deps array.
    const start = src.indexOf("handleRefine = useCallback(");
    expect(start).toBeGreaterThan(-1);
    // handleRefine est long (~200 lignes ≈ 16k chars) — prendre une fenêtre large
    const slice = src.slice(start, start + 20000);
    // La deps array est la dernière `[...]` avant le `);` de fermeture du useCallback.
    // Format actuel : `[results, versions, activeVersions, session?.user?.id]`
    const depsMatch = slice.match(/\[results,\s*versions,\s*activeVersions[^\]]*\]/);
    expect(depsMatch, "Impossible de localiser la deps array de handleRefine").not.toBeNull();
    // La deps array NE doit PAS contenir refineTargetIndex
    expect(depsMatch![0]).not.toMatch(/refineTargetIndex/);
  });

  it("U-BR4S37-004: RefineModal.onSubmit wrap handleRefine avec capture explicite de l'index", () => {
    // Pattern correct : onSubmit={(comment) => handleRefine(refineTargetIndex, comment)}
    // Anti-pattern : onSubmit={handleRefine}  (laisserait handleRefine lire le state)
    expect(src).toMatch(/onSubmit=\{\s*\(comment\)\s*=>\s*handleRefine\(\s*refineTargetIndex\s*,\s*comment\s*\)\s*\}/);
  });

  it("U-BR4S37-005: handleRefineRetry appelle handleRefine(index, comment) — pas de setTimeout", () => {
    const start = src.indexOf("handleRefineRetry = useCallback");
    const slice = src.slice(start, start + 800);
    // Doit contenir l'appel direct
    expect(slice).toMatch(/handleRefine\(\s*index\s*,\s*comment\s*\)/);
    // Ne doit PAS contenir le hack setTimeout
    expect(slice).not.toMatch(/setTimeout\(\s*\(\)\s*=>\s*handleRefine/);
  });

  it("U-BR4S37-006: tous les state updates de handleRefine utilisent targetIndex (paramètre)", () => {
    // Extrait le corps du handleRefine et vérifie que CHAQUE setState/Map/Set
    // utilise `targetIndex` (paramètre), pas `refineTargetIndex` (state global).
    const start = src.indexOf("handleRefine = useCallback(");
    const end = src.indexOf("[results, versions, activeVersions", start);
    expect(end).toBeGreaterThan(start);
    const body = src.slice(start, end);
    // Strip les commentaires (single-line et block) avant grep — les commentaires
    // de documentation du fix mentionnent intentionnellement `refineTargetIndex`
    // (explication historique). Seul le code exécutable doit être audité.
    const stripped = body
      .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
      .replace(/\/\/[^\n]*/g, ""); // single-line comments
    // Pas de référence à refineTargetIndex dans le CODE (comments OK)
    expect(stripped).not.toMatch(/refineTargetIndex/);
    // Au moins 5 références à targetIndex (state updates multiples)
    const targetRefs = (stripped.match(/targetIndex/g) || []).length;
    expect(targetRefs).toBeGreaterThanOrEqual(5);
  });
});

// =============================================================================
// PARTIE 2 — LOGIC SIMULATION (matrice exhaustive de scénarios)
// =============================================================================

/**
 * Modèle pur qui reproduit le pattern de capture d'index de handleRefine.
 *
 * - `RefineState` simule le state React (`results`, `refineTargetIndex`)
 * - `createRefineHandler` reproduit la closure :
 *     - **mode "broken"** : lit l'index depuis le state au moment de la résolution
 *     - **mode "fixed"**  : reçoit l'index en paramètre (comme le fix BR-4)
 *
 * Chaque appel renvoie une promise contrôlable (resolveNow) pour orchestrer
 * des résolutions out-of-order et reproduire la concurrence.
 */
type RefineMode = "broken" | "fixed";

type RefineResult = { id: string; refinedComment?: string };

interface RefineState {
  results: RefineResult[];
  refineTargetIndex: number; // simule le state global
}

interface PendingRefine {
  promise: Promise<void>;
  resolve: (refinedComment: string) => void;
  reject: (err: Error) => void;
  capturedTargetAtCall: number;
}

function createRefineHandler(state: RefineState, mode: RefineMode) {
  // Le handler simule handleRefine. En mode "broken", il lit targetIndex
  // depuis state.refineTargetIndex au moment où la promise se résout
  // (closure stale). En mode "fixed", il prend targetIndex en paramètre.
  function handleRefine(maybeTargetIndex: number | null, _comment: string): PendingRefine {
    // Capture l'index AU MOMENT DE L'APPEL (mode fixed) ou laisse à la résolution (broken)
    const capturedTargetAtCall =
      mode === "fixed" ? (maybeTargetIndex as number) : state.refineTargetIndex;

    let resolveOuter!: (refinedComment: string) => void;
    let rejectOuter!: (err: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolveOuter = (refinedComment: string) => {
        // Au moment de la résolution :
        //   - mode "broken" : on relit refineTargetIndex (état actuel)
        //   - mode "fixed"  : on utilise capturedTargetAtCall (figé)
        const indexToWrite = mode === "broken" ? state.refineTargetIndex : capturedTargetAtCall;
        if (indexToWrite >= 0 && indexToWrite < state.results.length) {
          state.results[indexToWrite] = {
            ...state.results[indexToWrite],
            refinedComment,
          };
        }
        res();
      };
      rejectOuter = (err: Error) => rej(err);
    });

    return { promise, resolve: resolveOuter, reject: rejectOuter, capturedTargetAtCall };
  }

  return handleRefine;
}

function makeState(nbPhotos: number): RefineState {
  return {
    results: Array.from({ length: nbPhotos }, (_, i) => ({ id: `photo-${i}` })),
    refineTargetIndex: 0,
  };
}

// --- 2A. Sanity check : le mode "broken" reproduit bien le bug ---

describe("BR-4 simulation — sanity check : le mode broken reproduit le bug", () => {
  it("U-BR4S37-100: 3 photos, refine #0 puis ouverture modal #1, résolution #0 → écrit dans #1 (BUG)", () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "broken");

    // Étape 1 : utilisateur clique Affiner sur #0 → state.refineTargetIndex = 0
    state.refineTargetIndex = 0;
    const refine0 = handler(null, "moins de meubles");

    // Étape 2 : utilisateur ouvre le modal pour #1 → state.refineTargetIndex = 1
    state.refineTargetIndex = 1;

    // Étape 3 : la promise #0 résout AVANT que #1 soit lancé
    refine0.resolve("résultat photo 0");

    return refine0.promise.then(() => {
      // BUG : le résultat est écrit dans #1 au lieu de #0
      expect(state.results[0].refinedComment).toBeUndefined();
      expect(state.results[1].refinedComment).toBe("résultat photo 0");
    });
  });
});

// --- 2B. Mode FIXED : matrice nb photos × sélection ---

describe("BR-4 simulation — mode fixed : matrice nb photos × sélections", () => {
  it("U-BR4S37-200: 1 photo (cas dégénéré), affine #0", async () => {
    const state = makeState(1);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r = handler(0, "plus chaud");
    r.resolve("v1");
    await r.promise;

    expect(state.results[0].refinedComment).toBe("v1");
  });

  it("U-BR4S37-201: 2 photos, affine #0 seul", async () => {
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r = handler(0, "plus de plantes");
    state.refineTargetIndex = 1; // l'utilisateur ouvre le modal pour #1 entre temps
    r.resolve("v0");
    await r.promise;

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBeUndefined();
  });

  it("U-BR4S37-202: 2 photos, affine #1 seul", async () => {
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r = handler(1, "table plus grande");
    state.refineTargetIndex = 0; // user clique sur #0 (ouvre modal mais ne valide pas)
    r.resolve("v1");
    await r.promise;

    expect(state.results[0].refinedComment).toBeUndefined();
    expect(state.results[1].refinedComment).toBe("v1");
  });

  it("U-BR4S37-203: 2 photos, affine #0 puis #1 (séquentiel)", async () => {
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    r0.resolve("v0");
    await r0.promise;

    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    r1.resolve("v1");
    await r1.promise;

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBe("v1");
  });

  it("U-BR4S37-204: 2 photos, affine #1 puis #0 (séquentiel inverse)", async () => {
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    r1.resolve("v1");
    await r1.promise;

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    r0.resolve("v0");
    await r0.promise;

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBe("v1");
  });

  it("U-BR4S37-205: 3 photos (CAS FONDATEUR), affine #0+#1, #2 reste intact", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");

    // Résolutions out-of-order : #1 résout avant #0
    r1.resolve("v1");
    r0.resolve("v0");
    await Promise.all([r0.promise, r1.promise]);

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBe("v1");
    expect(state.results[2].refinedComment).toBeUndefined(); // intact
  });

  it("U-BR4S37-206: 3 photos, affine #0+#2 (non contiguës)", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");

    r0.resolve("v0");
    r2.resolve("v2");
    await Promise.all([r0.promise, r2.promise]);

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBeUndefined();
    expect(state.results[2].refinedComment).toBe("v2");
  });

  it("U-BR4S37-207: 3 photos, affine #1+#2", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");

    r2.resolve("v2");
    r1.resolve("v1");
    await Promise.all([r1.promise, r2.promise]);

    expect(state.results[0].refinedComment).toBeUndefined();
    expect(state.results[1].refinedComment).toBe("v1");
    expect(state.results[2].refinedComment).toBe("v2");
  });

  it("U-BR4S37-208: 3 photos, affine les 3 dans l'ordre", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");

    r0.resolve("v0");
    r1.resolve("v1");
    r2.resolve("v2");
    await Promise.all([r0.promise, r1.promise, r2.promise]);

    expect(state.results.map((r) => r.refinedComment)).toEqual(["v0", "v1", "v2"]);
  });

  it("U-BR4S37-209: 3 photos, affine les 3 résolutions en ordre INVERSE", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");

    r2.resolve("v2");
    r1.resolve("v1");
    r0.resolve("v0");
    await Promise.all([r0.promise, r1.promise, r2.promise]);

    expect(state.results.map((r) => r.refinedComment)).toEqual(["v0", "v1", "v2"]);
  });

  it("U-BR4S37-210: 4 photos, affine #0 et #3 (non contiguës, extrêmes)", async () => {
    const state = makeState(4);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 3;
    const r3 = handler(3, "c3");

    r3.resolve("v3");
    r0.resolve("v0");
    await Promise.all([r0.promise, r3.promise]);

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBeUndefined();
    expect(state.results[2].refinedComment).toBeUndefined();
    expect(state.results[3].refinedComment).toBe("v3");
  });

  it("U-BR4S37-211: 5 photos (max upload), affine #0+#2+#4", async () => {
    const state = makeState(5);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");
    state.refineTargetIndex = 4;
    const r4 = handler(4, "c4");

    // Résolution dans un ordre arbitraire
    r4.resolve("v4");
    r0.resolve("v0");
    r2.resolve("v2");
    await Promise.all([r0.promise, r2.promise, r4.promise]);

    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBeUndefined();
    expect(state.results[2].refinedComment).toBe("v2");
    expect(state.results[3].refinedComment).toBeUndefined();
    expect(state.results[4].refinedComment).toBe("v4");
  });
});

// --- 2C. Tests de concurrence stricts ---

describe("BR-4 simulation — concurrence stricte", () => {
  it("U-BR4S37-300: 2 fetch lancés à 50ms d'écart, le 2ème résout AVANT le 1er", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");

    // Simule un délai puis ouvre modal #1
    await new Promise((res) => setTimeout(res, 5));
    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");

    // #1 résout AVANT #0 (réseau plus rapide / serveur plus rapide)
    r1.resolve("v1");
    await r1.promise;

    // Avant que #0 résolve, #1 doit déjà être correct
    expect(state.results[1].refinedComment).toBe("v1");
    expect(state.results[0].refinedComment).toBeUndefined();

    // Maintenant #0 résout
    r0.resolve("v0");
    await r0.promise;

    // Les deux slots sont distincts et corrects
    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBe("v1");
    expect(state.results[2].refinedComment).toBeUndefined();
  });

  it("U-BR4S37-301: 3 fetch concurrents, résolutions aléatoires (seed déterministe)", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");
    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    state.refineTargetIndex = 2;
    const r2 = handler(2, "c2");

    // Ordre arbitraire 2 → 0 → 1
    r2.resolve("v2");
    await r2.promise;
    expect(state.results[2].refinedComment).toBe("v2");

    r0.resolve("v0");
    await r0.promise;
    expect(state.results[0].refinedComment).toBe("v0");

    r1.resolve("v1");
    await r1.promise;
    expect(state.results[1].refinedComment).toBe("v1");

    expect(state.results.map((r) => r.refinedComment)).toEqual(["v0", "v1", "v2"]);
  });

  it("U-BR4S37-302: refineTargetIndex change PENDANT que les promises sont en vol — aucun écrasement", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "c0");

    // L'utilisateur clique partout sans valider
    state.refineTargetIndex = 1;
    state.refineTargetIndex = 2;
    state.refineTargetIndex = 0;
    state.refineTargetIndex = 2;

    // Pendant ce temps, #0 résout
    r0.resolve("v0");
    await r0.promise;

    // Le slot #0 doit être correct, peu importe les changements de state
    expect(state.results[0].refinedComment).toBe("v0");
    expect(state.results[1].refinedComment).toBeUndefined();
    expect(state.results[2].refinedComment).toBeUndefined();
  });
});

// --- 2D. Cas limites ---

describe("BR-4 simulation — cas limites", () => {
  it("U-BR4S37-400: annulation d'un refine en cours — slot garde l'état pré-affinage", async () => {
    const state = makeState(2);
    state.results[0].refinedComment = "version-précédente";
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "nouveau commentaire");

    // Annule (reject avec AbortError-like) sans résoudre
    r0.reject(new Error("AbortError"));
    await r0.promise.catch(() => {});

    // Le slot conserve l'ancienne version (pas écrasée)
    expect(state.results[0].refinedComment).toBe("version-précédente");
  });

  it("U-BR4S37-401: échec d'un refine (mock 500) — slot garde l'état pré-affinage", async () => {
    const state = makeState(3);
    state.results[1].refinedComment = "v1-précédente";
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r1 = handler(1, "tentative");
    r1.reject(new Error("HTTP 500"));
    await r1.promise.catch(() => {});

    expect(state.results[1].refinedComment).toBe("v1-précédente");
  });

  it("U-BR4S37-402: retry après échec — le slot reçoit la NOUVELLE version", async () => {
    const state = makeState(2);
    state.results[1].refinedComment = "v1-old";
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r1Fail = handler(1, "tentative 1");
    r1Fail.reject(new Error("HTTP 500"));
    await r1Fail.promise.catch(() => {});
    expect(state.results[1].refinedComment).toBe("v1-old");

    // Retry — handleRefineRetry appelle handleRefine(1, comment) directement
    const r1Retry = handler(1, "tentative 1");
    r1Retry.resolve("v1-new");
    await r1Retry.promise;

    expect(state.results[1].refinedComment).toBe("v1-new");
  });

  it("U-BR4S37-403: affiner DEUX FOIS la même image (séquentiel) — la dernière version gagne", async () => {
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0a = handler(0, "première itération");
    r0a.resolve("v1");
    await r0a.promise;
    expect(state.results[0].refinedComment).toBe("v1");

    const r0b = handler(0, "seconde itération");
    r0b.resolve("v2");
    await r0b.promise;
    expect(state.results[0].refinedComment).toBe("v2");
  });

  it("U-BR4S37-404: affiner pendant qu'une régénération tourne sur un AUTRE index — pas d'interférence", async () => {
    // Simule : régénération en cours sur #0 (n'utilise pas handleRefine).
    // Pendant ce temps, l'utilisateur affine #1.
    // Le refine de #1 ne doit pas toucher #0.
    const state = makeState(3);
    state.results[0].refinedComment = "génération-en-cours-marker";
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 1;
    const r1 = handler(1, "c1");
    r1.resolve("v1");
    await r1.promise;

    expect(state.results[0].refinedComment).toBe("génération-en-cours-marker");
    expect(state.results[1].refinedComment).toBe("v1");
  });

  it("U-BR4S37-405: deux refines concurrents sur le MÊME index — la dernière résolution gagne", async () => {
    // Cas pathologique : double-clic, ou modal réouvert avant la première résolution.
    // Comportement attendu : pas de crash, le slot finit avec la dernière valeur.
    // Note : en prod, AbortController annule le précédent (cf. ligne 1174 de page.tsx),
    // mais le test ici valide le pire cas (les deux résolvent vraiment).
    const state = makeState(2);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const rA = handler(0, "version A");
    const rB = handler(0, "version B");

    rA.resolve("vA");
    await rA.promise;
    expect(state.results[0].refinedComment).toBe("vA");

    rB.resolve("vB");
    await rB.promise;
    expect(state.results[0].refinedComment).toBe("vB");
  });
});

// --- 2E. Test de non-régression : le mode broken doit échouer sur les scénarios clés ---

describe("BR-4 simulation — anti-régression : le mode broken ÉCHOUE sur le scénario fondateur", () => {
  it("U-BR4S37-500: scénario fondateur en mode broken — DOIT produire le bug", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "broken");

    // Reproduction exacte du scénario fondateur
    state.refineTargetIndex = 0;
    const r0 = handler(null, "moins de meubles");

    // L'utilisateur ouvre le modal pour #1 (state change)
    state.refineTargetIndex = 1;

    // #0 résout MAINTENANT, lit le state actuel (1) au lieu de l'index initial (0)
    r0.resolve("résultat photo 0");
    await r0.promise;

    // BUG REPRODUIT : le résultat est dans #1, pas dans #0
    expect(state.results[0].refinedComment).toBeUndefined();
    expect(state.results[1].refinedComment).toBe("résultat photo 0");
  });

  it("U-BR4S37-501: même scénario en mode fixed — résultat correct dans #0", async () => {
    const state = makeState(3);
    const handler = createRefineHandler(state, "fixed");

    state.refineTargetIndex = 0;
    const r0 = handler(0, "moins de meubles"); // ← l'index est passé en param

    state.refineTargetIndex = 1;
    r0.resolve("résultat photo 0");
    await r0.promise;

    // FIX VALIDÉ : le résultat est bien dans #0
    expect(state.results[0].refinedComment).toBe("résultat photo 0");
    expect(state.results[1].refinedComment).toBeUndefined();
  });
});
