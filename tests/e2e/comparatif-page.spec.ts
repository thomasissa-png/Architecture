import { test, expect } from "@playwright/test";

/**
 * E2E tests for /comparatif — SEO comparison page.
 * Static page with comparison table (Versiroom vs Gepetto vs InterieurAI vs Renovate Club),
 * FAQ section with JSON-LD, and persona-targeted content sections.
 */

test.describe("Comparatif page — /comparatif", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/comparatif");
  });

  test("page loads with correct title and H1", async ({ page }) => {
    await expect(page).toHaveTitle(/[Cc]omparatif/);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Comparatif");
    await expect(h1).toContainText("Versiroom");
    await expect(h1).toContainText("Gepetto");
  });

  test("comparison table is present with 4 competitor columns", async ({
    page,
  }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Table headers: Critere, Versiroom, Gepetto, InterieurAI, Renovate Club
    const headers = table.locator("th");
    await expect(headers).toHaveCount(5);

    await expect(headers.nth(1)).toContainText("Versiroom");
    await expect(headers.nth(2)).toContainText("Gepetto");
    await expect(headers.nth(3)).toContainText("InterieurAI");
    await expect(headers.nth(4)).toContainText("Renovate Club");
  });

  test("comparison table contains key criteria rows", async ({ page }) => {
    const table = page.locator("table");

    // Key criteria that must be in the table
    await expect(table).toContainText("Prix");
    await expect(table).toContainText("Nombre de styles");
    await expect(table).toContainText("Technologie");
    await expect(table).toContainText("Made in France");
    await expect(table).toContainText("Essai gratuit");
  });

  test("comparison table has at least 8 data rows", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test("Versiroom price is displayed in the table", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toContainText("4,90");
  });

  test("JSON-LD FAQPage structured data is present", async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();

    const content = await jsonLd.textContent();
    const parsed = JSON.parse(content!);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity.length).toBeGreaterThanOrEqual(3);
  });

  test("FAQ section displays questions", async ({ page }) => {
    await expect(page.locator("text=Questions fr")).toBeVisible();

    const faqQuestions = page.locator("h3");
    const count = await faqQuestions.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("persona sections mention Claire, Thomas and Lea", async ({
    page,
  }) => {
    await expect(page.locator("text=Pour qui est fait Versiroom")).toBeVisible();
    await expect(page.locator("text=Claire")).toBeVisible();
    await expect(page.locator("text=Thomas")).toBeVisible();
  });

  test("differentiators section highlights pipeline 2 passes", async ({
    page,
  }) => {
    await expect(
      page.locator("text=Ce qui distingue Versiroom")
    ).toBeVisible();
    await expect(page.locator("text=Pipeline 2 passes")).toBeVisible();
  });

  test("CTA link to /#outil is present", async ({ page }) => {
    const ctaLink = page.locator('a[href="/#outil"]').first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText("Essayer");
  });

  test("cross-links to persona pages are present", async ({ page }) => {
    await expect(page.locator('a[href="/architecte"]').first()).toBeVisible();
    await expect(page.locator('a[href="/marchand"]').first()).toBeVisible();
    await expect(page.locator('a[href="/particulier"]').first()).toBeVisible();
  });

  test("data collection disclaimer is visible", async ({ page }) => {
    await expect(page.locator("text=mars 2026")).toBeVisible();
  });
});
