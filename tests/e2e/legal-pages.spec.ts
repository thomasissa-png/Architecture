import { test, expect } from "@playwright/test";

test.describe("Legal pages", () => {
  test("/mentions-legales loads and contains title", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page).toHaveTitle(/Mentions l.gales/);

    // Page should contain heading text
    const heading = page.locator("h1");
    await expect(heading).toContainText("Mentions l");
    await expect(heading).toBeVisible();

    // Should have a link back to homepage
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test("/cgv loads and contains title", async ({ page }) => {
    await page.goto("/cgv");
    await expect(page).toHaveTitle(/Conditions g.n.rales/);

    const heading = page.locator("h1");
    await expect(heading).toContainText("Conditions g");
    await expect(heading).toBeVisible();

    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test("/confidentialite loads and contains title", async ({ page }) => {
    await page.goto("/confidentialite");
    await expect(page).toHaveTitle(/Politique de confidentialit/);

    const heading = page.locator("h1");
    await expect(heading).toContainText("confidentialit");
    await expect(heading).toBeVisible();

    await expect(page.locator('a[href="/"]')).toBeVisible();
  });
});
