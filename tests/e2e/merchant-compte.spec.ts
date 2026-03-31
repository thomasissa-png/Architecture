import { test, expect } from "@playwright/test";

/**
 * E2E tests for /compte (F4 Mode Pro — Merchant profile).
 * Verifies page loads and handles unauthenticated state gracefully.
 */

test.describe("Compte — Profile page", () => {
  test("page loads without crash", async ({ page }) => {
    const response = await page.goto("/compte");
    expect(response?.status()).toBeLessThan(500);
  });

  test("page contains Versimo branding", async ({ page }) => {
    await page.goto("/compte");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toContainText("Versimo");
  });

  test("unauthenticated user sees loading or redirect", async ({ page }) => {
    await page.goto("/compte");
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasValidState =
      url.includes("/compte") || url === "http://localhost:3000/";
    expect(hasValidState).toBeTruthy();
  });
});
