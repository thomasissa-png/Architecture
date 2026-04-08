/**
 * BR-5 (session 38) — Iteration base storage collision cross-photos
 *
 * Symptôme reproduit par le fondateur (manifestation #3 du bug Affiner) :
 *   1. Génère 3 photos en parallèle (ex : Scandinave, Scandinave, Maximaliste)
 *   2. Elles se génèrent correctement (outputs distincts)
 *   3. Clique "Affiner" sur les 2 premières
 *   4. Les 2 tiles affinées affichent le Maximaliste (la 3e) au lieu de leurs
 *      propres outputs affinés
 *
 * Cause racine (différente de BR-3 et BR-4) :
 *   `lib/db.ts::saveIterationBase(sessionId, base64)` et `getIterationBase(sessionId)`
 *   utilisaient une clé `iteration-base/${sessionId}.jpg` — UNE SEULE entrée par
 *   session. Quand N photos se génèrent dans la même session, les N appels de
 *   saveIterationBase écrivent sur la MÊME clé. Le dernier (Maximaliste) écrase
 *   les autres. Les refines suivants font `getIterationBase(sessionId)` → reçoivent
 *   le Maximaliste pour TOUTES les photos de la batch.
 *
 * BR-3 (session 34) fixait `isRefining` single state côté client.
 * BR-4 (session 37) fixait `refineTargetIndex` single state côté client.
 * BR-5 (session 38) fixe le single state côté SERVER STORAGE.
 *
 * Fix :
 *   - Clé dérivée de `pass1Key` (unique par génération) au lieu de `sessionId`
 *   - Format : `${pass1Key.replace(/\.jpg$/, "_iter.jpg")}` — sibling du pass1 cache
 *   - Signature : `saveIterationBase(pass1Key, base64)` / `getIterationBase(pass1Key)`
 *   - 4 call-sites route.ts migrés (adjust, iteration save, pass2Only, initial gen)
 *
 * Stratégie de test :
 *   1. Mock @replit/object-storage pour intercepter uploadFromBytes/downloadAsBytes
 *   2. Simuler le scénario exact : 3 saves avec 3 pass1Keys distincts dans la même session
 *   3. Vérifier que les 3 entrées existent INDÉPENDAMMENT (pas d'écrasement)
 *   4. Vérifier qu'un refine #0 et refine #1 récupèrent leurs OWN data, pas celle de #2
 *   5. Static gate : la clé ne doit PLUS être `iteration-base/${sessionId}.jpg`
 *   6. Static gate : route.ts ne doit PLUS passer `sessionId` ou `effectiveSessionId` à saveIterationBase/getIterationBase
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mock @replit/object-storage BEFORE importing lib/db
const storageBlobs = new Map<string, Uint8Array>();

vi.mock("@replit/object-storage", () => {
  class Client {
    async uploadFromBytes(key: string, buffer: Uint8Array) {
      storageBlobs.set(key, new Uint8Array(buffer));
      return { ok: true };
    }
    async downloadAsBytes(key: string) {
      const buf = storageBlobs.get(key);
      if (!buf) return { ok: false, error: "not_found" };
      return { ok: true, value: [Buffer.from(buf)] };
    }
  }
  return { Client };
});

// Mock pg (lib/db imports Pool but we never hit it in these tests)
vi.mock("pg", () => {
  class Pool {
    async query() { return { rows: [], rowCount: 0 }; }
    async connect() { return { query: async () => ({ rows: [] }), release: () => {} }; }
  }
  return { Pool, default: { Pool } };
});

// Ensure DATABASE_URL is set so getPool doesn't throw (even though we don't call it)
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://fake";

// Import AFTER mocks
import { saveIterationBase, getIterationBase } from "@/lib/db";

const route = readFileSync(join(process.cwd(), "app/api/generate/route.ts"), "utf-8");
const db = readFileSync(join(process.cwd(), "lib/db.ts"), "utf-8");

/**
 * Strip all comments (line + block) before regex analysis.
 * Les commentaires explicatifs du fix mentionnent intentionnellement les
 * anti-patterns (ex : "l'ancienne clé était `iteration-base/${sessionId}.jpg`") —
 * seul le code exécutable doit être audité par les static gates.
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

const routeCode = stripComments(route);
const dbCode = stripComments(db);

// ─── Helpers ─────────────────────────────────────────────────────────
const b64 = (s: string) => Buffer.from(s).toString("base64");
const fromB64 = (s: string) => Buffer.from(s, "base64").toString();

function makePass1Key(sessionId: string, timestamp: number): string {
  return `sessions/${sessionId}/pass1_${timestamp}.jpg`;
}

// ─── PARTIE 1 — Runtime behavior : no cross-photo collision ──────────

describe("BR-5 runtime — iteration base keyed by pass1Key (not sessionId)", () => {
  beforeEach(() => {
    storageBlobs.clear();
  });

  it("U-BR5-001: 3 saves distincts avec 3 pass1Keys → 3 entrées séparées (pas d'écrasement)", async () => {
    const sessionId = "user-abc";
    const keyA = makePass1Key(sessionId, 1000);
    const keyB = makePass1Key(sessionId, 1001);
    const keyC = makePass1Key(sessionId, 1002);

    await saveIterationBase(keyA, b64("scandinave-1"));
    await saveIterationBase(keyB, b64("scandinave-2"));
    await saveIterationBase(keyC, b64("maximaliste-3"));

    const gotA = await getIterationBase(keyA);
    const gotB = await getIterationBase(keyB);
    const gotC = await getIterationBase(keyC);

    expect(gotA).not.toBeNull();
    expect(gotB).not.toBeNull();
    expect(gotC).not.toBeNull();
    expect(fromB64(gotA!)).toBe("scandinave-1");
    expect(fromB64(gotB!)).toBe("scandinave-2");
    expect(fromB64(gotC!)).toBe("maximaliste-3");
  });

  it("U-BR5-002: scénario fondateur — refine photo #0 et #1 récupèrent leurs OWN data après save de #2", async () => {
    // Simule le scénario exact : 3 photos générées dans l'ordre, la 3e (Maximaliste) finit en dernier
    const sessionId = "founder-session";
    const p1 = makePass1Key(sessionId, 10_000);
    const p2 = makePass1Key(sessionId, 10_001);
    const p3 = makePass1Key(sessionId, 10_002); // Maximaliste (dernière à finir)

    // Initial gen : toutes les 3 passes 2 finissent et save leur iteration base
    await saveIterationBase(p1, b64("furnished-scandinave-1"));
    await saveIterationBase(p2, b64("furnished-scandinave-2"));
    await saveIterationBase(p3, b64("furnished-maximaliste-3"));

    // User clique Affiner sur photo #0 → serveur doit récupérer furnished-scandinave-1
    const base1 = await getIterationBase(p1);
    expect(base1).not.toBeNull();
    expect(fromB64(base1!)).toBe("furnished-scandinave-1");

    // User clique Affiner sur photo #1 → serveur doit récupérer furnished-scandinave-2
    const base2 = await getIterationBase(p2);
    expect(base2).not.toBeNull();
    expect(fromB64(base2!)).toBe("furnished-scandinave-2");

    // Photo #2 (Maximaliste) reste intacte
    const base3 = await getIterationBase(p3);
    expect(base3).not.toBeNull();
    expect(fromB64(base3!)).toBe("furnished-maximaliste-3");
  });

  it("U-BR5-003: refines successifs sur le même pass1Key → la dernière version gagne (comportement attendu)", async () => {
    const p = makePass1Key("s1", 500);
    await saveIterationBase(p, b64("v1"));
    await saveIterationBase(p, b64("v2"));
    await saveIterationBase(p, b64("v3"));

    const latest = await getIterationBase(p);
    expect(fromB64(latest!)).toBe("v3");
  });

  it("U-BR5-004: getIterationBase sur pass1Key inexistant → null", async () => {
    const got = await getIterationBase(makePass1Key("s1", 999));
    expect(got).toBeNull();
  });

  it("U-BR5-005: clé de stockage dérivée est SIBLING du pass1 (même dossier de session)", async () => {
    const p = makePass1Key("session-x", 42);
    await saveIterationBase(p, b64("content"));

    // Les clés de stockage doivent vivre dans le même namespace session, pas dans un bucket global
    const keys = Array.from(storageBlobs.keys());
    const iterationKey = keys.find((k) => k.includes("session-x") && k.includes("_iter"));
    expect(iterationKey, "Clé iteration-base doit contenir 'session-x' et '_iter'").toBeTruthy();

    // Anti-régression : pas de clé globale `iteration-base/${sessionId}.jpg`
    const oldFormatKey = keys.find((k) => /^iteration-base\/[^/]+\.jpg$/.test(k));
    expect(oldFormatKey, "Clé au format legacy 'iteration-base/{sessionId}.jpg' détectée").toBeUndefined();
  });

  it("U-BR5-006: 5 photos parallèles dans la même session → 5 entrées isolées", async () => {
    const sid = "batch-5";
    const keys = [1, 2, 3, 4, 5].map((i) => makePass1Key(sid, 2000 + i));
    const contents = ["scandi", "japandi", "mid-century", "boheme", "maxi"];

    // Saves dans un ordre quelconque
    for (let i = 0; i < 5; i++) {
      await saveIterationBase(keys[i], b64(contents[i]));
    }

    // Lectures dans un ordre différent
    const results = await Promise.all([
      getIterationBase(keys[3]),
      getIterationBase(keys[0]),
      getIterationBase(keys[4]),
      getIterationBase(keys[1]),
      getIterationBase(keys[2]),
    ]);

    expect(fromB64(results[0]!)).toBe("boheme");
    expect(fromB64(results[1]!)).toBe("scandi");
    expect(fromB64(results[2]!)).toBe("maxi");
    expect(fromB64(results[3]!)).toBe("japandi");
    expect(fromB64(results[4]!)).toBe("mid-century");
  });
});

// ─── PARTIE 2 — Static gates sur lib/db.ts et route.ts ───────────────

describe("BR-5 static gates — anti-régression format de clé", () => {
  it("U-BR5-100: lib/db.ts::saveIterationBase NE contient PLUS la clé legacy `iteration-base/${sessionId}.jpg`", () => {
    // Anti-pattern : const key = `iteration-base/${sessionId}.jpg`;
    expect(dbCode).not.toMatch(/`iteration-base\/\$\{sessionId\}\.jpg`/);
  });

  it("U-BR5-101: lib/db.ts::saveIterationBase prend `pass1Key` en paramètre (signature)", () => {
    // La signature doit être `saveIterationBase(pass1Key: string, imageBase64: string)`
    expect(dbCode).toMatch(/export async function saveIterationBase\(\s*pass1Key:\s*string\s*,\s*imageBase64:\s*string\s*\)/);
  });

  it("U-BR5-102: lib/db.ts::getIterationBase prend `pass1Key` en paramètre (signature)", () => {
    expect(dbCode).toMatch(/export async function getIterationBase\(\s*pass1Key:\s*string\s*\)/);
  });

  it("U-BR5-103: route.ts ne passe PLUS `sessionId` ni `effectiveSessionId` à saveIterationBase", () => {
    // Grep tous les appels à saveIterationBase dans route.ts (sans commentaires)
    const calls = routeCode.match(/saveIterationBase\([^)]+\)/g) || [];
    expect(calls.length, "Au moins 3 appels attendus (iteration, pass2Only, initial gen)").toBeGreaterThanOrEqual(3);
    for (const call of calls) {
      expect(call, `Call ${call} contient encore sessionId`).not.toMatch(/\bsessionId\b/);
      expect(call, `Call ${call} contient encore effectiveSessionId`).not.toMatch(/\beffectiveSessionId\b/);
    }
  });

  it("U-BR5-104: route.ts ne passe PLUS `sessionId` ni `effectiveSessionId` à getIterationBase", () => {
    const calls = routeCode.match(/getIterationBase\([^)]+\)/g) || [];
    expect(calls.length, "Au moins 1 appel attendu (adjust mode)").toBeGreaterThanOrEqual(1);
    for (const call of calls) {
      expect(call, `Call ${call} contient encore sessionId`).not.toMatch(/\bsessionId\b/);
      expect(call, `Call ${call} contient encore effectiveSessionId`).not.toMatch(/\beffectiveSessionId\b/);
    }
  });

  it("U-BR5-105: route.ts ne contient PLUS de gate `if (sessionId)` autour de saveIterationBase", () => {
    // Le gate était nécessaire quand on keyait par sessionId — avec pass1Key (toujours présent), inutile
    // On regarde qu'il n'y a pas de `if (sessionId)` dans les ~5 lignes précédant un saveIterationBase
    // Utilise routeCode (sans commentaires) pour éviter les faux positifs sur les commentaires de fix.
    const lines = routeCode.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("saveIterationBase(")) {
        const context = lines.slice(Math.max(0, i - 5), i).join("\n");
        expect(
          context,
          `Ligne ${i + 1}: gate 'if (sessionId)' précédant saveIterationBase — doit être supprimé`
        ).not.toMatch(/if\s*\(\s*sessionId\s*\)/);
      }
    }
  });
});
