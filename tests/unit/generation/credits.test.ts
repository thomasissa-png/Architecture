/**
 * G3 — Crédits & accès — lib/credits.ts
 *
 * Mocks lib/db.ts (getPool + ensureTable). Each test seeds a queue of mock
 * query responses, then asserts the function under test returns the right
 * boolean / number AND that the right SQL was called.
 *
 * Coverage: U-CR-001 to U-CR-014.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPool, enqueue, type MockPool } from "../mocks/db";

let pool: MockPool;

vi.mock("@/lib/db", () => {
  return {
    getPool: () => pool,
    ensureTable: vi.fn(async () => {}),
  };
});

beforeEach(() => {
  pool = createMockPool();
});

describe("G3 — hasStarterAccess (régression session 31)", () => {
  it("U-CR-001: 0 achats → false", async () => {
    const { hasStarterAccess } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ count: "0" }] });
    expect(await hasStarterAccess("user-1")).toBe(false);
  });

  it("U-CR-002: 1 achat completed → true", async () => {
    const { hasStarterAccess } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ count: "1" }] });
    expect(await hasStarterAccess("user-2")).toBe(true);
  });

  it("U-CR-003: hasStarterAccess query filtre status='completed'", async () => {
    const { hasStarterAccess } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ count: "0" }] });
    await hasStarterAccess("user-3");
    expect(pool.__calls[0].sql).toMatch(/status\s*=\s*'completed'/);
  });
});

describe("G3 — hasProAccess", () => {
  it("U-CR-004: role='pro' → true (pas de query purchases)", async () => {
    const { hasProAccess } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ role: "pro", email: "p@test.fr" }] });
    expect(await hasProAccess("user-pro")).toBe(true);
    // Only 1 query (the role check). No second purchase query.
    expect(pool.__calls.length).toBe(1);
  });

  it("U-CR-004b: role='admin' → true", async () => {
    const { hasProAccess } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ role: "admin", email: "a@test.fr" }] });
    expect(await hasProAccess("user-admin")).toBe(true);
  });

  it("U-CR-005: role='user' + 1 purchase ≥50 credits completed → true", async () => {
    const { hasProAccess } = await import("@/lib/credits");
    enqueue(
      pool,
      { rows: [{ role: "user", email: "u@test.fr" }] },
      { rows: [{ count: "1" }] },
    );
    expect(await hasProAccess("user-paid-pro")).toBe(true);
  });

  it("U-CR-006: role='user' + 0 purchase ≥50 → false", async () => {
    const { hasProAccess } = await import("@/lib/credits");
    enqueue(
      pool,
      { rows: [{ role: "user", email: "u@test.fr" }] },
      { rows: [{ count: "0" }] },
    );
    expect(await hasProAccess("user-starter")).toBe(false);
  });
});

describe("G3 — getMaxIterations (régression session 31 — Découverte ≠ Starter)", () => {
  it("U-CR-007: anonyme (userId=null) → 0", async () => {
    const { getMaxIterations } = await import("@/lib/credits");
    expect(await getMaxIterations(null)).toBe(0);
  });

  it("U-CR-008: Découverte (0 achats) → 0 (NOT 1, régression session 31)", async () => {
    const { getMaxIterations } = await import("@/lib/credits");
    // hasProAccess: role=user, 0 purchases ≥50
    enqueue(
      pool,
      { rows: [{ role: "user", email: "d@test.fr" }] },
      { rows: [{ count: "0" }] },
    );
    // hasStarterAccess: 0 purchases
    enqueue(pool, { rows: [{ count: "0" }] });
    expect(await getMaxIterations("user-decouverte")).toBe(0);
  });

  it("U-CR-009: Starter (1 achat completed) → 1", async () => {
    const { getMaxIterations } = await import("@/lib/credits");
    enqueue(
      pool,
      { rows: [{ role: "user", email: "s@test.fr" }] },
      { rows: [{ count: "0" }] },
    );
    enqueue(pool, { rows: [{ count: "1" }] });
    expect(await getMaxIterations("user-starter")).toBe(1);
  });

  it("U-CR-010: Pro → 3", async () => {
    const { getMaxIterations } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ role: "pro", email: "pro@test.fr" }] });
    expect(await getMaxIterations("user-pro2")).toBe(3);
  });
});

describe("G3 — decrementCredit / addCredits", () => {
  it("U-CR-011: credits=0 → false (no-op)", async () => {
    const { decrementCredit } = await import("@/lib/credits");
    enqueue(pool, { rows: [], rowCount: 0 });
    expect(await decrementCredit("user-broke")).toBe(false);
  });

  it("U-CR-012: credits=5 → true (rowCount=1)", async () => {
    const { decrementCredit } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ credits_remaining: 4 }], rowCount: 1 });
    expect(await decrementCredit("user-rich")).toBe(true);
  });

  it("decrementCredit utilise la clause `AND credits_remaining > 0` (sécurité)", async () => {
    const { decrementCredit } = await import("@/lib/credits");
    enqueue(pool, { rows: [{ credits_remaining: 4 }], rowCount: 1 });
    await decrementCredit("user-x");
    expect(pool.__calls[0].sql).toMatch(/credits_remaining\s*>\s*0/);
  });

  it("U-CR-013: addCredits +10 appelle UPDATE", async () => {
    const { addCredits } = await import("@/lib/credits");
    enqueue(pool, { rows: [], rowCount: 1 });
    await addCredits("user-paid", 10);
    expect(pool.__calls[0].sql).toMatch(/UPDATE users SET credits_remaining/);
    expect(pool.__calls[0].params).toEqual(["user-paid", 10]);
  });
});

describe("G3 — hasGalleryAccess", () => {
  it("U-CR-014: TOUJOURS true (décision fondateur 2026-04-04)", async () => {
    const { hasGalleryAccess } = await import("@/lib/credits");
    expect(await hasGalleryAccess("anyone")).toBe(true);
    expect(await hasGalleryAccess("")).toBe(true);
  });
});
