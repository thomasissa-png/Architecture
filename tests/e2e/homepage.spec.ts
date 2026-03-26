import { test, expect } from "@playwright/test";

// DATA-TESTID NEEDED (not currently in source — @fullstack should add):
// - None for this file; tests use text content and semantic selectors.

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with title, hero heading and nav", async ({ page }) => {
    // Page title from layout.tsx metadata
    await expect(page).toHaveTitle(/Versiroom/);

    // Hero heading
    const heading = page.locator("h1");
    await expect(heading).toContainText("Votre pièce meublée");
    await expect(heading).toContainText("en 90 secondes");

    // Brand name in header
    const header = page.locator("header");
    await expect(header).toContainText("Versiroom");
  });

  test('header contains "Tarifs" and "Essayer gratuitement" links', async ({
    page,
  }) => {
    const header = page.locator("header");
    const tarifsLink = header.locator('a[href="#pricing"]');
    await expect(tarifsLink).toBeVisible();
    await expect(tarifsLink).toHaveText("Tarifs");

    const ctaLink = header.locator('a[href="#outil"]');
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText("Essayer gratuitement");
  });

  test("footer contains legal links (Mentions legales, CGV, Confidentialite)", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/mentions-legales"]')).toBeVisible();
    await expect(footer.locator('a[href="/cgv"]')).toBeVisible();
    await expect(footer.locator('a[href="/confidentialite"]')).toBeVisible();
  });

  test("pricing section displays 4 packs with correct prices TTC", async ({
    page,
  }) => {
    const pricing = page.locator("#pricing");

    // 4 pricing cards
    const cards = pricing.locator(
      ":scope > div > div:last-child > div.border"
    );
    // Fallback: just check prices are visible in the pricing section
    await expect(pricing).toContainText("4,90\u20ac");
    await expect(pricing).toContainText("14,90\u20ac");
    await expect(pricing).toContainText("29\u20ac");
    await expect(pricing).toContainText("69\u20ac");

    // Pack names
    await expect(pricing).toContainText("Découverte");
    await expect(pricing).toContainText("Starter");
    await expect(pricing).toContainText("Pro");
    await expect(pricing).toContainText("Studio");

    // TTC mention
    await expect(pricing).toContainText("TTC");
  });

  test('scroll to pricing section works via header "Tarifs" link', async ({
    page,
  }) => {
    // Click "Tarifs" in header
    const tarifsLink = page.locator('header a[href="#pricing"]');
    await tarifsLink.click();

    // Wait for smooth scroll
    await page.waitForTimeout(500);

    // Pricing section should be in viewport
    const pricing = page.locator("#pricing");
    await expect(pricing).toBeInViewport();
  });
});
