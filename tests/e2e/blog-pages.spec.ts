import { test, expect } from "@playwright/test";

/**
 * E2E tests for blog pages:
 * - /blog — Blog index (lists articles from DB, or empty state)
 * - /blog/[slug] — Individual blog post (requires DB data, tested with mock)
 *
 * The blog pages fetch data from PostgreSQL via lib/blog.ts.
 * Without DB, /blog shows an empty state ("Bientot disponible").
 * /blog/[slug] calls notFound() if post doesn't exist.
 */

test.describe("Blog index page — /blog", () => {
  test("page loads without crash and has correct title", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBeLessThan(500);

    await expect(page).toHaveTitle(/Blog.*Versiroom/);
  });

  test("H1 is Blog", async ({ page }) => {
    await page.goto("/blog");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Blog");
  });

  test("subtitle describes the blog content", async ({ page }) => {
    await page.goto("/blog");

    await expect(
      page.locator("text=home staging virtuel par IA")
    ).toBeVisible();
  });

  test("header contains Versiroom branding and nav", async ({ page }) => {
    await page.goto("/blog");

    const header = page.locator("header");
    await expect(header).toContainText("Versiroom");
    await expect(header.locator('a[href="/pricing"]')).toBeVisible();
    await expect(header.locator('a[href="/#outil"]')).toBeVisible();
  });

  test("shows empty state or article list", async ({ page }) => {
    await page.goto("/blog");

    // Either we have articles (links to /blog/...) or the empty state
    const body = page.locator("body");
    const bodyText = await body.textContent();

    const hasArticles = bodyText?.includes("/blog/") ?? false;
    const hasEmptyState = bodyText?.includes("disponible") ?? false;

    // One of the two states must be true
    expect(hasArticles || hasEmptyState).toBeTruthy();
  });

  test("footer contains navigation links", async ({ page }) => {
    await page.goto("/blog");

    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/"]')).toBeVisible();
    await expect(footer.locator('a[href="/marchand"]')).toBeVisible();
    await expect(footer.locator('a[href="/mentions-legales"]')).toBeVisible();
    await expect(footer).toContainText("Versiroom 2026");
  });
});

test.describe("Blog post page — /blog/[slug]", () => {
  test("non-existent slug returns 404", async ({ page }) => {
    const response = await page.goto("/blog/this-slug-does-not-exist-99999");

    // Next.js notFound() returns 404
    expect(response?.status()).toBe(404);
  });

  test("non-existent slug does not crash the server (status < 500)", async ({
    page,
  }) => {
    const response = await page.goto("/blog/non-existent-article");
    expect(response?.status()).toBeLessThan(500);
  });
});
