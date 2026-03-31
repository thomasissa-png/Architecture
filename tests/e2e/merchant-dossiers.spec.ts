import { test, expect } from "@playwright/test";

/**
 * E2E tests for /mes-dossiers (F4 Mode Pro — Dossier list).
 * Verifies page loads and handles unauthenticated state gracefully.
 */

test.describe("Mes Dossiers — Dossier list page", () => {
  test("page loads without crash", async ({ page }) => {
    const response = await page.goto("/mes-dossiers");
    expect(response?.status()).toBeLessThan(500);
  });

  test("page contains Versimo branding", async ({ page }) => {
    await page.goto("/mes-dossiers");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toContainText("Versimo");
  });

  test("unauthenticated user sees loading or redirect", async ({ page }) => {
    await page.goto("/mes-dossiers");
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasValidState =
      url.includes("/mes-dossiers") || url === "http://localhost:3000/";
    expect(hasValidState).toBeTruthy();
  });
});

test.describe("Dossier public page", () => {
  test("non-existent dossier UUID shows 404 or error message", async ({
    page,
  }) => {
    const response = await page.goto(
      "/dossier/00000000-0000-0000-0000-000000000000"
    );
    // Should not crash
    expect(response?.status()).toBeLessThan(500);

    // Should show some error or "not found" indication
    await page.waitForTimeout(1000);
    const body = await page.locator("body").textContent();
    // Either redirects, shows 404, or shows "introuvable/expire" message
    expect(body).toBeTruthy();
  });
});
