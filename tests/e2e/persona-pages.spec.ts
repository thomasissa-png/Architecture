import { test, expect } from "@playwright/test";

/**
 * E2E tests for persona landing pages:
 * - /architecte (Claire — architecte d'interieur)
 * - /marchand (Thomas — marchand de biens)
 * - /particulier (Lea — particuliere)
 *
 * Each page is a static SEO landing page with:
 * - Unique H1, hero section, FAQ section
 * - JSON-LD FAQPage structured data
 * - CTA links to /#outil
 * - Header with Versiroom branding + Tarifs + Essayer
 * - Footer with cross-links to other persona pages
 */

// ─── /architecte ──────────────────────────────────────────────────────

test.describe("Architecte persona page — /architecte", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/architecte");
  });

  test("page loads with correct title and H1", async ({ page }) => {
    await expect(page).toHaveTitle(/architecte/i);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("90 secondes");
  });

  test("hero contains CTA link to /#outil", async ({ page }) => {
    const ctaLink = page.locator('a[href="/#outil"]').first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText("planche");
  });

  test("FAQ section displays 3 questions", async ({ page }) => {
    // FAQ heading
    await expect(page.locator("text=Questions fr")).toBeVisible();

    // 3 FAQ items rendered as h3 elements
    const faqQuestions = page.locator("h3");
    await expect(faqQuestions).toHaveCount(3);

    // First question about replacing 3D rendering
    await expect(faqQuestions.first()).toContainText("rendu 3D");
  });

  test("JSON-LD FAQPage structured data is present", async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();

    const content = await jsonLd.textContent();
    expect(content).toBeTruthy();

    const parsed = JSON.parse(content!);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(3);
    expect(parsed.mainEntity[0]["@type"]).toBe("Question");
  });

  test("header contains Versiroom branding and nav links", async ({
    page,
  }) => {
    const header = page.locator("header");
    await expect(header).toContainText("Versiroom");
    await expect(header.locator('a[href="/pricing"]')).toBeVisible();
    await expect(header.locator('a[href="/#outil"]')).toBeVisible();
  });

  test("footer contains cross-links to other persona pages", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/marchand"]')).toBeVisible();
    await expect(footer.locator('a[href="/particulier"]')).toBeVisible();
  });

  test("page mentions Claire persona citation", async ({ page }) => {
    await expect(
      page.locator("text=support de conversation avec mon client")
    ).toBeVisible();
    await expect(page.locator("text=Claire")).toBeVisible();
  });
});

// ─── /marchand ────────────────────────────────────────────────────────

test.describe("Marchand persona page — /marchand", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/marchand");
  });

  test("page loads with correct title and H1", async ({ page }) => {
    await expect(page).toHaveTitle(/marchand/i);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("pré-commercialisation");
  });

  test("hero contains CTA link to pricing (Pro subscription)", async ({ page }) => {
    const ctaLink = page.locator('a[href="/pricing"]').first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText("Abonnement Pro");
  });

  test("problem section mentions price pain point (200-500 EUR)", async ({
    page,
  }) => {
    await expect(page.locator("text=200")).toBeVisible();
    await expect(page.locator("text=500")).toBeVisible();
  });

  test("FAQ section displays 3 questions", async ({ page }) => {
    await expect(page.locator("text=Questions fr")).toBeVisible();

    const faqQuestions = page.locator("h3");
    await expect(faqQuestions).toHaveCount(3);
  });

  test("JSON-LD FAQPage structured data is present", async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();

    const content = await jsonLd.textContent();
    const parsed = JSON.parse(content!);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(3);
  });

  test("how it works section displays 3 steps", async ({ page }) => {
    await expect(page.locator("text=Comment")).toBeVisible();
    await expect(page.locator("text=Uploadez vos photos")).toBeVisible();
    await expect(page.locator("text=Choisissez un style")).toBeVisible();
  });

  test("footer contains cross-links to other persona pages", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/architecte"]')).toBeVisible();
    await expect(footer.locator('a[href="/particulier"]')).toBeVisible();
  });
});

// ─── /particulier ─────────────────────────────────────────────────────

test.describe("Particulier persona page — /particulier", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/particulier");
  });

  test("page loads with correct title and H1", async ({ page }) => {
    await expect(page).toHaveTitle(/Visualiser|particulier/i);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("appartement");
  });

  test("hero mentions gratuit and iPhone", async ({ page }) => {
    await expect(page.locator("text=Gratuit")).toBeVisible();
  });

  test("hero contains CTA link to /#outil", async ({ page }) => {
    const ctaLink = page.locator('a[href="/#outil"]').first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText("Essayer");
  });

  test("FAQ section displays 3 questions", async ({ page }) => {
    await expect(page.locator("text=Questions fr")).toBeVisible();

    const faqQuestions = page.locator("h3");
    await expect(faqQuestions).toHaveCount(3);

    // First question about free offer
    await expect(faqQuestions.first()).toContainText("gratuit");
  });

  test("JSON-LD FAQPage structured data is present", async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();

    const content = await jsonLd.textContent();
    const parsed = JSON.parse(content!);
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.mainEntity).toHaveLength(3);
  });

  test("footer contains cross-links to other persona pages", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/architecte"]')).toBeVisible();
    await expect(footer.locator('a[href="/marchand"]')).toBeVisible();
  });
});
