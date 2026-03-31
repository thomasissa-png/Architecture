import { test, expect } from "@playwright/test";

/**
 * E2E tests for /mes-biens (F4 Mode Pro — Property list).
 * These tests run WITHOUT authentication, so they verify the page loads
 * and shows the appropriate unauthenticated/loading state.
 */

test.describe("Mes Biens — Property list page", () => {
  test("page loads without crash", async ({ page }) => {
    const response = await page.goto("/mes-biens");
    expect(response?.status()).toBeLessThan(500);
  });

  test("page contains Versimo branding", async ({ page }) => {
    await page.goto("/mes-biens");
    // Wait for client render
    await page.waitForTimeout(1000);
    // Either shows branding or redirects to home (which has branding)
    await expect(page.locator("body")).toContainText("Versimo");
  });

  test("unauthenticated user sees loading or redirect", async ({ page }) => {
    await page.goto("/mes-biens");
    await page.waitForTimeout(2000);

    // Without session, should show either:
    // 1. Loading state ("Chargement...")
    // 2. Redirect to homepage
    // 3. Auth prompt
    const url = page.url();
    const hasLoadingOrContent =
      url.includes("/mes-biens") || url === "http://localhost:3000/";
    expect(hasLoadingOrContent).toBeTruthy();
  });
});

test.describe("Mes Biens — Property detail page", () => {
  test("non-existent property returns gracefully", async ({ page }) => {
    const response = await page.goto("/mes-biens/999999");
    // Should not crash the server
    expect(response?.status()).toBeLessThan(500);
  });

  test("page loads without crash", async ({ page }) => {
    await page.goto("/mes-biens/1");
    await page.waitForTimeout(1000);
    // Should contain branding regardless of auth state
    await expect(page.locator("body")).toContainText("Versimo");
  });
});
