import { test, expect, devices } from "@playwright/test";

/**
 * E-G11 — Multi-device sanity check.
 * Each of iPhone 13 / iPad / Desktop Chrome must load the homepage without
 * horizontal overflow and expose a visible entry CTA without horizontal scroll.
 *
 * Note: this runs under the Desktop Chrome project by default; viewport is
 * overridden per test via `test.use({ viewport: ... })`. We keep the WebKit
 * engine-specific device matrix as skipped until playwright.config.ts adds
 * webkit / mobile Safari projects.
 */
test.describe("E-G11 — Multi-device homepage sanity", () => {
  test.setTimeout(20_000);

  test("iPhone 13 viewport (375×812) — no horizontal overflow", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await context.close();
  });

  test("iPad viewport (768×1024) — homepage and CTA visible", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const cta = page
      .getByRole("link", { name: /essayer|commencer|gratuit/i })
      .or(page.getByRole("button", { name: /essayer|commencer|gratuit/i }))
      .first();
    await expect(cta).toBeVisible();

    await context.close();
  });

  test("Desktop Chrome (1280×720) — homepage and CTA visible", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices["Desktop Chrome"],
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const cta = page
      .getByRole("link", { name: /essayer|commencer|gratuit/i })
      .or(page.getByRole("button", { name: /essayer|commencer|gratuit/i }))
      .first();
    await expect(cta).toBeVisible();

    await context.close();
  });
});
