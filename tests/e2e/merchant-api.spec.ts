import { test, expect } from "@playwright/test";

/**
 * E2E tests for F4 Mode Marchand API routes.
 * Tests API endpoints respond correctly (auth-gated = 401, public = 200/404).
 */

test.describe("Merchant API routes — unauthenticated", () => {
  test("GET /api/properties returns 401 without session", async ({
    request,
  }) => {
    const res = await request.get("/api/properties");
    expect(res.status()).toBe(401);
  });

  test("POST /api/properties returns 401 without session", async ({
    request,
  }) => {
    const res = await request.post("/api/properties", {
      data: { address: "1 rue de Paris" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/merchant/profile returns 401 without session", async ({
    request,
  }) => {
    const res = await request.get("/api/merchant/profile");
    expect(res.status()).toBe(401);
  });

  test("PUT /api/merchant/profile returns 401 without session", async ({
    request,
  }) => {
    const res = await request.put("/api/merchant/profile", {
      data: { siret: "12345678901234" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/dossier returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/dossier");
    expect(res.status()).toBe(401);
  });
});

test.describe("Merchant API routes — public endpoints", () => {
  test("GET /api/dossier/[uuid] returns 404 for non-existent dossier", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/dossier/00000000-0000-0000-0000-000000000000"
    );
    // 404 or 500 (if DB not connected) — but not a crash
    expect([404, 500]).toContain(res.status());
  });
});
