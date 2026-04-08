/**
 * BR-5 Edge Cases — couverture des scénarios non couverts par br5-iteration-base-per-pass1.test.ts
 *
 * Audit @qa session 38 (manifestation #3 du bug Affiner) :
 *   Le test principal br5-iteration-base-per-pass1.test.ts couvre :
 *     - 3 saves distincts → 3 entrées séparées (U-BR5-001/002)
 *     - Refines successifs sur même pass1Key (U-BR5-003)
 *     - getIterationBase sur clé inexistante (U-BR5-004)
 *     - Format de clé sibling (U-BR5-005)
 *     - 5 photos parallèles (U-BR5-006)
 *     - Static gates signature/format (U-BR5-100/105)
 *
 *   MAIS il manque les cas suivants identifiés par l'audit :
 *     - B : Refine d'un refine (chaining iterations) — 2 itérations successives
 *     - C : Regenerate puis refine (changement de pass1Key)
 *     - D : User anonyme (clé `sessions/anon_${ts}/pass1.jpg`)
 *     - E : Surfaces-only mode (pas de saveIterationBase, fallback OK)
 *     - F : Race condition 2 saves concurrents sur même clé
 *     - H : pass1Key au format non-standard (fallback du helper)
 *     - I : Scénario E2E fondateur — 3 photos batch + 2 refines distincts
 *           (le test E2E que U-BR5-002 ne couvre pas vraiment car il ne valide
 *            pas l'isolation contre la collision sessionId)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

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

vi.mock("pg", () => {
  class Pool {
    async query() { return { rows: [], rowCount: 0 }; }
    async connect() { return { query: async () => ({ rows: [] }), release: () => {} }; }
  }
  return { Pool, default: { Pool } };
});

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://fake";

import { saveIterationBase, getIterationBase } from "@/lib/db";

// Helpers
const b64 = (s: string) => Buffer.from(s).toString("base64");
const fromB64 = (s: string) => Buffer.from(s, "base64").toString();
const makeAuthKey = (sid: string, ts: number) => `sessions/${sid}/pass1_${ts}.jpg`;
const makeAnonKey = (ts: number) => `sessions/anon_${ts}/pass1.jpg`;

// ─── B — Refine d'un refine (chaining) ───────────────────────────────
describe("BR-5 edge B — refine of a refine (chaining iterations)", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-200: chain v1 → v2 → v3 sur même pass1Key — chaque iteration save l'output, le suivant le lit", async () => {
    // Simule le serveur : à chaque iteration, on save le nouvel outputBase64
    // sur la même clé. La prochaine iteration récupère ce dernier output.
    const p = makeAuthKey("user-x", 42);

    // Initial gen : pass2 furnished
    await saveIterationBase(p, b64("v1-furnished"));

    // Refine #1 : serveur lit v1, génère v2, save v2
    const baseForV2 = await getIterationBase(p);
    expect(fromB64(baseForV2!)).toBe("v1-furnished");
    await saveIterationBase(p, b64("v2-after-modif1"));

    // Refine #2 : serveur lit v2 (PAS v1), génère v3, save v3
    const baseForV3 = await getIterationBase(p);
    expect(fromB64(baseForV3!)).toBe("v2-after-modif1");
    await saveIterationBase(p, b64("v3-after-modif2"));

    // Refine #3 : serveur lit v3
    const baseForV4 = await getIterationBase(p);
    expect(fromB64(baseForV4!)).toBe("v3-after-modif2");
  });

  it("U-BR5-201: 2 photos chacune avec leur propre chaîne v1→v2 — pas de cross-contamination", async () => {
    const sid = "user-y";
    const pA = makeAuthKey(sid, 100);
    const pB = makeAuthKey(sid, 200);

    // Initial gen photo A et B
    await saveIterationBase(pA, b64("A-v1"));
    await saveIterationBase(pB, b64("B-v1"));

    // User refine A → A-v2
    expect(fromB64((await getIterationBase(pA))!)).toBe("A-v1");
    await saveIterationBase(pA, b64("A-v2"));

    // User refine B → B-v2 (la chaîne A reste intacte)
    expect(fromB64((await getIterationBase(pB))!)).toBe("B-v1");
    await saveIterationBase(pB, b64("B-v2"));

    // User re-refine A → la base lue est A-v2, pas B-v2
    expect(fromB64((await getIterationBase(pA))!)).toBe("A-v2");
    expect(fromB64((await getIterationBase(pB))!)).toBe("B-v2");
  });
});

// ─── C — Regenerate puis refine (nouveau pass1Key) ───────────────────
describe("BR-5 edge C — regenerate puis refine (pass1Key change)", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-210: après regenerate, refine utilise NEW pass1Key, lit la nouvelle base, pas l'ancienne", async () => {
    const sid = "user-z";
    const oldKey = makeAuthKey(sid, 1000); // genération initiale
    const newKey = makeAuthKey(sid, 2000); // regenerate (nouveau ts)

    // Initial gen + iteration sur ancienne base
    await saveIterationBase(oldKey, b64("old-furnished-v1"));
    await saveIterationBase(oldKey, b64("old-furnished-v2-after-refine"));

    // Regenerate : nouveau pass1Key, nouveau pass2 → save sur new key
    await saveIterationBase(newKey, b64("new-furnished-v1"));

    // User refine après regenerate → doit lire new-furnished-v1, PAS old-furnished-v2
    const base = await getIterationBase(newKey);
    expect(fromB64(base!)).toBe("new-furnished-v1");

    // L'ancien blob est orphelin mais ne pollue PAS la nouvelle clé
    const oldStillThere = await getIterationBase(oldKey);
    expect(fromB64(oldStillThere!)).toBe("old-furnished-v2-after-refine");
  });
});

// ─── D — User anonyme (clé sessions/anon_${ts}/pass1.jpg) ────────────
describe("BR-5 edge D — anonymous user keys", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-220: anon key se transforme en sibling _iter correctement", async () => {
    const anon = makeAnonKey(1700_000_000);
    await saveIterationBase(anon, b64("anon-content"));

    const got = await getIterationBase(anon);
    expect(fromB64(got!)).toBe("anon-content");

    // Vérifie le format de la clé stockée
    const keys = Array.from(storageBlobs.keys());
    expect(keys[0]).toBe("sessions/anon_1700000000/pass1_iter.jpg");
  });

  it("U-BR5-221: 3 anon en parallèle (timestamps distincts) → 3 entrées isolées", async () => {
    // Sur Replit, chaque request anon génère son propre Date.now() — assume distinct
    const a = makeAnonKey(1700_000_000);
    const b = makeAnonKey(1700_000_001);
    const c = makeAnonKey(1700_000_002);

    await saveIterationBase(a, b64("anon-A"));
    await saveIterationBase(b, b64("anon-B"));
    await saveIterationBase(c, b64("anon-C"));

    expect(fromB64((await getIterationBase(a))!)).toBe("anon-A");
    expect(fromB64((await getIterationBase(b))!)).toBe("anon-B");
    expect(fromB64((await getIterationBase(c))!)).toBe("anon-C");
  });

  it("U-BR5-222: anon vs auth ne collisionnent jamais (namespaces distincts)", async () => {
    const anon = makeAnonKey(1234);
    const auth = makeAuthKey("user-real", 1234); // même ts !

    await saveIterationBase(anon, b64("anon-data"));
    await saveIterationBase(auth, b64("auth-data"));

    expect(fromB64((await getIterationBase(anon))!)).toBe("anon-data");
    expect(fromB64((await getIterationBase(auth))!)).toBe("auth-data");
  });
});

// ─── E — Surfaces-only mode (pas de save, fallback OK) ───────────────
describe("BR-5 edge E — surfaces-only mode (no iteration base saved)", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-230: getIterationBase retourne null pour pass1Key surfaces-only → fallback restyle attendu", async () => {
    // En mode surfaces-only, route.ts L838-892 NE save PAS d'iteration base.
    // Quand l'user clique Affiner, route.ts L316 fait getIterationBase(pass1Key) → null
    // Fallback attendu : sourceImageBase64 = pass1 (image vide) = restyle behavior.
    // Ce test vérifie que le fallback est bien null (pas une erreur, pas une exception).
    const surfacesOnlyKey = makeAuthKey("user-surfaces", 5000);

    const got = await getIterationBase(surfacesOnlyKey);
    expect(got).toBeNull();
  });
});

// ─── F — Race condition 2 saves concurrents sur même clé ────────────
describe("BR-5 edge F — concurrent saves on same key (last-write-wins)", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-240: 2 saves Promise.all sur même pass1Key → un des 2 contenus présent (pas de corruption)", async () => {
    const p = makeAuthKey("user-race", 9000);

    await Promise.all([
      saveIterationBase(p, b64("worker-1")),
      saveIterationBase(p, b64("worker-2")),
    ]);

    const got = await getIterationBase(p);
    expect(got).not.toBeNull();
    const content = fromB64(got!);
    // Last-write-wins : un des 2 doit être présent, pas de mix
    expect(["worker-1", "worker-2"]).toContain(content);
  });

  it("U-BR5-241: 5 saves concurrents sur clés distinctes → 5 contenus isolés", async () => {
    const sid = "user-burst";
    const keys = [1, 2, 3, 4, 5].map((i) => makeAuthKey(sid, 8000 + i));
    const contents = ["a", "b", "c", "d", "e"];

    await Promise.all(keys.map((k, i) => saveIterationBase(k, b64(contents[i]))));

    for (let i = 0; i < 5; i++) {
      const got = await getIterationBase(keys[i]);
      expect(fromB64(got!)).toBe(contents[i]);
    }
  });
});

// ─── H — pass1Key au format non-standard (fallback) ──────────────────
describe("BR-5 edge H — non-standard pass1Key (helper fallback)", () => {
  beforeEach(() => storageBlobs.clear());

  it("U-BR5-260: pass1Key sans .jpg → fallback `${pass1Key}_iter.jpg`", async () => {
    const weird = "custom-key-no-extension";
    await saveIterationBase(weird, b64("weird-content"));

    const got = await getIterationBase(weird);
    expect(fromB64(got!)).toBe("weird-content");

    const keys = Array.from(storageBlobs.keys());
    expect(keys[0]).toBe("custom-key-no-extension_iter.jpg");
  });

  it("U-BR5-261: pass1Key avec .jpg en fin → remplace .jpg par _iter.jpg", async () => {
    const standard = "sessions/user/pass1_123.jpg";
    await saveIterationBase(standard, b64("standard"));

    const keys = Array.from(storageBlobs.keys());
    expect(keys[0]).toBe("sessions/user/pass1_123_iter.jpg");
  });

  it("U-BR5-262: 2 pass1Keys non-standard distincts → 2 entrées isolées", async () => {
    await saveIterationBase("key-A", b64("A"));
    await saveIterationBase("key-B", b64("B"));

    expect(fromB64((await getIterationBase("key-A"))!)).toBe("A");
    expect(fromB64((await getIterationBase("key-B"))!)).toBe("B");
  });
});

// ─── I — Scénario E2E fondateur (vrai test d'isolation) ──────────────
describe("BR-5 edge I — E2E founder scenario (real cross-photo isolation)", () => {
  beforeEach(() => storageBlobs.clear());

  /**
   * Ce test est CRITIQUE — il valide le scénario exact du fondateur :
   *   1. Génère 3 photos en parallèle dans la MÊME session (ex: Scandinave, Scandinave, Maximaliste)
   *   2. Les 3 passes 2 finissent et appellent saveIterationBase
   *   3. User clique Affiner sur photo #0 → serveur lit getIterationBase pour récupérer la base
   *   4. Vérifie que photo #0 récupère SA propre base (Scandinave-1), PAS celle de la #2 (Maximaliste)
   *
   * Ce test IS the regression guard du bug rapporté.
   *
   * Différence avec U-BR5-002 dans br5-iteration-base-per-pass1.test.ts :
   *   - U-BR5-002 utilise des pass1Keys distincts mais ne valide pas que l'isolation
   *     proviendrait de la transformation de la clé (pas d'utilisation de iterationBaseKey).
   *     Si on rollback la signature à `(sessionId, base64)` et que les tests passent
   *     pass1Keys comme sessionId, le mock écrirait sur des clés `iteration-base/pass1Key.jpg`
   *     qui SERAIENT distinctes — donc U-BR5-002 ne détecterait PAS le rollback.
   *   - Ce test (U-BR5-280) vérifie en plus que les CLÉS DE STOCKAGE finales sont sibling
   *     du pass1Key, pas dans un namespace global iteration-base/. C'est la vraie protection.
   */
  it("U-BR5-280: scénario fondateur exact + vérification namespace storage final", async () => {
    const founderSid = "founder-real-session";

    // Étape 1 : 3 pass1 en parallèle (timestamps distincts car requêtes successives ms-level)
    const scandi1 = makeAuthKey(founderSid, 100);
    const scandi2 = makeAuthKey(founderSid, 101);
    const maxi3 = makeAuthKey(founderSid, 102);

    // Étape 2 : 3 passes 2 finissent et save l'iteration base — ordre arbitraire
    // (Maximaliste finit en dernier dans le scénario fondateur)
    await Promise.all([
      saveIterationBase(scandi1, b64("scandi-1-furnished")),
      saveIterationBase(scandi2, b64("scandi-2-furnished")),
      saveIterationBase(maxi3, b64("maximaliste-3-furnished")),
    ]);

    // Étape 3 : 3 entrées de storage existent (ISOLATION confirmée)
    const keys = Array.from(storageBlobs.keys()).sort();
    expect(keys.length).toBe(3);

    // Vérification CRITIQUE : pas de clé legacy `iteration-base/${sessionId}.jpg`
    const legacyKey = keys.find((k) => /^iteration-base\//.test(k));
    expect(legacyKey, "Clé legacy iteration-base/* détectée — fix non actif").toBeUndefined();

    // Vérification CRITIQUE : chaque clé stockée est sibling du pass1Key correspondant
    expect(keys).toContain(`sessions/${founderSid}/pass1_100_iter.jpg`);
    expect(keys).toContain(`sessions/${founderSid}/pass1_101_iter.jpg`);
    expect(keys).toContain(`sessions/${founderSid}/pass1_102_iter.jpg`);

    // Étape 4 : User clique Affiner sur photo #0 → serveur récupère sa OWN base
    const baseForRefine0 = await getIterationBase(scandi1);
    expect(baseForRefine0).not.toBeNull();
    expect(fromB64(baseForRefine0!)).toBe("scandi-1-furnished");
    // ^ Si BR-5 était cassé, on récupérerait "maximaliste-3-furnished"

    // Étape 5 : User clique Affiner sur photo #1 → serveur récupère SA OWN base
    const baseForRefine1 = await getIterationBase(scandi2);
    expect(fromB64(baseForRefine1!)).toBe("scandi-2-furnished");

    // Étape 6 : Photo #2 (Maximaliste) reste accessible aussi
    const baseForRefine2 = await getIterationBase(maxi3);
    expect(fromB64(baseForRefine2!)).toBe("maximaliste-3-furnished");
  });

  it("U-BR5-281: 2 refines successifs sur photos différentes — pas d'écrasement croisé après refine", async () => {
    const sid = "founder-batch";
    const p1 = makeAuthKey(sid, 1);
    const p2 = makeAuthKey(sid, 2);
    const p3 = makeAuthKey(sid, 3);

    // Initial gen
    await saveIterationBase(p1, b64("p1-v1"));
    await saveIterationBase(p2, b64("p2-v1"));
    await saveIterationBase(p3, b64("p3-v1"));

    // Refine photo #0 → save p1-v2
    const r1 = await getIterationBase(p1);
    expect(fromB64(r1!)).toBe("p1-v1");
    await saveIterationBase(p1, b64("p1-v2"));

    // Refine photo #1 → save p2-v2 (p1-v2 doit rester intact)
    const r2 = await getIterationBase(p2);
    expect(fromB64(r2!)).toBe("p2-v1");
    await saveIterationBase(p2, b64("p2-v2"));

    // Vérifications finales
    expect(fromB64((await getIterationBase(p1))!)).toBe("p1-v2");
    expect(fromB64((await getIterationBase(p2))!)).toBe("p2-v2");
    expect(fromB64((await getIterationBase(p3))!)).toBe("p3-v1");
  });
});
