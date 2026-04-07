import { test, expect } from "@playwright/test";

/**
 * E-G07 — Stripe checkout flow (mocked).
 * Verifies: Starter CTA → checkout session → redirect back → post-purchase banner → credits incremented.
 *
 * All Stripe endpoints are mocked; no real network call.
 */
test.describe("E-G07 — Stripe purchase flow (mocked)", () => {
  test.setTimeout(30_000);

  test.skip("Starter checkout → post-purchase banner → credits updated", async ({
    page,
  }) => {
    // Waiting on:
    //   - data-testid="buy-starter-button"
    //   - data-testid="credits-badge"
    //   - data-testid="post-purchase-banner"
    // See tests/e2e/NEEDED-TESTIDS.md

    // Mock Stripe checkout session creation
    await page.route("**/api/stripe/**", async (route) => {
      const url = route.request().url();
      if (url.includes("checkout") || url.includes("create-session")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sessionId: "cs_test_mock",
            url: "/pricing?success=1&plan=starter",
          }),
        });
      } else if (url.includes("webhook")) {
        await route.fulfill({ status: 200, body: "ok" });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    await page.goto("/pricing");

    const badgeBefore = page.getByTestId("credits-badge");
    const before = Number((await badgeBefore.textContent()) ?? "0");

    await page.getByTestId("buy-starter-button").click();

    // Simulate Stripe redirect back with success params
    await page.waitForURL(/success=1/);

    // Post-purchase banner visible
    await expect(page.getByTestId("post-purchase-banner")).toBeVisible();

    // Credits incremented
    const after = Number((await badgeBefore.textContent()) ?? "0");
    expect(after).toBeGreaterThan(before);
  });
});
