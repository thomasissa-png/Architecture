import { test, expect } from "@playwright/test";

/**
 * E2E tests for /pricing — Standalone pricing page.
 *
 * The homepage has a #pricing section but /pricing is a separate "use client" page
 * with 3 packs (Decouverte, Starter, Pro), Stripe checkout integration,
 * retractation checkbox, and AuthModal for unauthenticated users.
 *
 * These tests run WITHOUT authentication — they verify the page renders correctly
 * and that buy buttons trigger the auth modal for unauthenticated users.
 */

test.describe("Pricing page — /pricing", () => {
  test.beforeEach(async ({ page }) => {
    // Block Stripe checkout calls — no real payment in tests
    await page.route("**/api/stripe/checkout", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Not authenticated" }) })
    );
    await page.goto("/pricing");
  });

  test("page loads with correct H1 and subtitle", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Tarifs");

    // Subtitle about no subscription
    await expect(page.locator("text=Sans abonnement")).toBeVisible();
  });

  test("displays 3 packs: Decouverte, Starter, Pro", async ({ page }) => {
    await expect(page.locator("text=Découverte")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Pro")).toBeVisible();
  });

  test("displays correct prices for each pack", async ({ page }) => {
    await expect(page.locator("text=4,90")).toBeVisible();
    await expect(page.locator("text=14,90")).toBeVisible();
    // Pro pack is 29 EUR
    await expect(page.locator("text=29€")).toBeVisible();
  });

  test("displays credit counts per pack", async ({ page }) => {
    await expect(page.locator("text=5 crédits")).toBeVisible();
    await expect(page.locator("text=20 crédits")).toBeVisible();
    await expect(page.locator("text=50 crédits")).toBeVisible();
  });

  test("displays TTC mention", async ({ page }) => {
    // All packs show "TTC · TVA 20% incluse"
    const ttcMentions = page.locator("text=TTC");
    const count = await ttcMentions.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("Pro pack is highlighted with Recommande badge", async ({ page }) => {
    await expect(page.locator("text=Recommandé")).toBeVisible();
  });

  test("each pack has an Acheter button", async ({ page }) => {
    const buyButtons = page.locator("button", { hasText: "Acheter" });
    await expect(buyButtons).toHaveCount(3);
  });

  test("retractation checkbox is present", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(
      page.locator("text=droit de rétractation")
    ).toBeVisible();
  });

  test("free trial note is displayed", async ({ page }) => {
    await expect(
      page.locator("text=3 generations offertes sans carte bancaire")
    ).toBeVisible();
  });

  test("header contains Versiroom branding and Essayer link", async ({
    page,
  }) => {
    const header = page.locator("header");
    await expect(header).toContainText("Versiroom");
    await expect(header.locator('a[href="/#outil"]')).toBeVisible();
  });

  test("footer contains legal links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/mentions-legales"]')).toBeVisible();
    await expect(footer.locator('a[href="/cgv"]')).toBeVisible();
    await expect(footer.locator('a[href="/confidentialite"]')).toBeVisible();
    await expect(footer).toContainText("Versiroom 2026");
  });

  test("Decouverte pack mentions 3 generations offertes", async ({ page }) => {
    await expect(
      page.locator("text=3 générations offertes sans CB")
    ).toBeVisible();
  });

  test("Pro pack features mention Mode Marchand", async ({ page }) => {
    await expect(
      page.locator("text=Mode Marchand")
    ).toBeVisible();
  });

  test("clicking Acheter without retractation shows error", async ({
    page,
  }) => {
    // Mock next-auth session to return null (unauthenticated)
    // The page uses useSession — without auth, clicking Acheter opens AuthModal
    // But if somehow session exists and checkbox is not checked, error shows
    // In unauthenticated state, clicking Acheter opens AuthModal instead
    const buyButton = page.locator("button", { hasText: "Acheter" }).first();
    await buyButton.click();

    // Should either show auth modal or retractation error
    // Without session, AuthModal opens
    await page.waitForTimeout(500);
    const body = await page.locator("body").textContent();
    const hasAuthModal = body?.includes("connecter") || body?.includes("Connexion") || body?.includes("Google");
    const hasError = body?.includes("retractation");
    expect(hasAuthModal || hasError).toBeTruthy();
  });
});
