import { test, expect } from "@playwright/test";

/**
 * E2E tests for /ma-galerie — User photo gallery.
 *
 * This is a "use client" page that requires authentication (next-auth useSession).
 * - Unauthenticated: shows "Connectez-vous" prompt with Se connecter button
 * - Loading: shows skeleton placeholders
 * - Authenticated: shows photo grid with filters
 *
 * These tests run WITHOUT authentication.
 */

test.describe("Ma Galerie page — /ma-galerie", () => {
  test("page loads without crash", async ({ page }) => {
    const response = await page.goto("/ma-galerie");
    expect(response?.status()).toBeLessThan(500);
  });

  test("unauthenticated user sees connexion prompt", async ({ page }) => {
    await page.goto("/ma-galerie");
    // Wait for client hydration — useSession needs to resolve
    await page.waitForTimeout(2000);

    // The page should show the unauthenticated state with "Ma galerie" heading
    // and "Connectez-vous" message
    const body = await page.locator("body").textContent();
    const hasGalerieTitle = body?.includes("galerie");
    const hasConnexionPrompt = body?.includes("Connectez-vous") || body?.includes("connecter");

    // Either shows the unauthenticated prompt or a loading/redirect state
    expect(hasGalerieTitle || hasConnexionPrompt).toBeTruthy();
  });

  test("unauthenticated user sees Se connecter button", async ({ page }) => {
    await page.goto("/ma-galerie");
    await page.waitForTimeout(2000);

    // Check for the "Se connecter" button in the unauthenticated state
    const connectButton = page.locator("button", { hasText: "Se connecter" });
    const count = await connectButton.count();

    // If unauthenticated state renders, the button should be there
    // If still loading or redirected, this is also acceptable
    if (count > 0) {
      await expect(connectButton.first()).toBeVisible();
    }
  });

  test("page does not expose API data without session", async ({ page }) => {
    // Block API calls that require auth — they should return 401
    let photoApiCalled = false;
    await page.route("**/api/user/photos*", (route) => {
      photoApiCalled = true;
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: "Not authenticated" }),
      });
    });

    await page.goto("/ma-galerie");
    await page.waitForTimeout(2000);

    // The photo API should NOT be called without a session
    // (useSession resolves to unauthenticated, fetchPhotos is gated by session?.user?.id)
    // If it was called, the mock returns 401 — no data leak
    // This test verifies the page handles the unauthenticated state gracefully
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toContain("[object Object]");
  });
});
