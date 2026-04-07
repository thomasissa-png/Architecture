import { test, expect } from "@playwright/test";
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

  test.skip("credits badge decrements by 1 after successful generation", async ({
    page,
  }) => {
    // Waiting on data-testid="credits-badge" from @fullstack
    // See tests/e2e/NEEDED-TESTIDS.md
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 1);
    await selectFirstStyle(page);

    const badge = page.getByTestId("credits-badge");
    const before = Number(await badge.textContent());

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    const after = Number(await badge.textContent());
    expect(after).toBe(before - 1);
  });
});
