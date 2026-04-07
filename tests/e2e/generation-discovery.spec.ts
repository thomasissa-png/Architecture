import { test, expect } from "@playwright/test";
import { test as authTest } from "./fixtures/auth-fixture";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

/**
 * E-G01 — Discovery: 1 photo, 1 style (Scandinave), 1 result, 1 credit debited.
 * Regression anchor: ensures the happy-path stays green on every PR.
 *
 * Uses mocked /api/generate to avoid calling OpenAI.
 */
test.describe("E-G01 — Discovery happy path (1 photo / 1 style)", () => {
  test.setTimeout(30_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("1 photo + Scandinave style + mocked generate → result displayed", async ({
    page,
  }) => {
    const mockState = mockGenerationHappyPath(page);

    await uploadPhotos(page, 1);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    // Select first room type if a room-type picker is shown
    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const roomButtons = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ });
      const first = roomButtons.first();
      if (await first.isVisible().catch(() => false)) {
        await first.click();
      }
    }

    const generateButton = page.locator("#step-generate").locator("button");
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Results section shows up
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // One call to /api/generate expected for a single photo in discovery mode.
    // (The pipeline may fan out into 2 passes internally, but the client-facing
    // endpoint is hit once per photo+style job.)
    expect(mockState.count).toBeGreaterThanOrEqual(1);
  });

});

/**
 * Authenticated variant — runs the credits-badge regression with a mocked
 * NextAuth session so the badge is rendered. The session mock is installed
 * by the `authenticatedPage` fixture before navigation.
 */
authTest.describe("E-G01 — Discovery happy path (authenticated)", () => {
  authTest.setTimeout(30_000);

  authTest("credits badge decrements by 1 after successful generation", async ({
    authenticatedPage: page,
  }) => {
    // The credits endpoint is mocked by the fixture but we need to update the
    // mocked credits between the two reads. Re-route after the first fetch.
    let creditsCallCount = 0;
    await page.unroute("**/api/user/credits");
    await page.route("**/api/user/credits", async (route) => {
      creditsCallCount += 1;
      const credits = creditsCallCount === 1 ? 5 : 4;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ credits, hasPro: false, hasStarter: false }),
      });
    });

    mockGenerationHappyPath(page);
    await page.goto("/");

    await uploadPhotos(page, 1);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    // Select first room type if shown
    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    // With the auth fixture, the badge MUST be visible. If it isn't, the
    // session mock regressed — fail loudly instead of skipping.
    const badge = page.getByTestId("credits-badge");
    await expect(badge).toBeVisible({ timeout: 5000 });

    const beforeText = (await badge.textContent()) ?? "0";
    const before = Number(beforeText.replace(/[^0-9]/g, ""));
    expect(before).toBe(5);

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // Trigger a credits re-fetch via the credits-updated event to surface
    // the post-generation count. Some clients also re-fetch automatically
    // after a successful generation.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("credits-updated"));
    });

    await expect(badge).toHaveText(/4 visuels?/, { timeout: 5000 });
    const afterText = (await badge.textContent()) ?? "0";
    const after = Number(afterText.replace(/[^0-9]/g, ""));
    expect(after).toBe(before - 1);
  });
});
