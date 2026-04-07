import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

/**
 * Multi-photo scenarios:
 *   - E-G02: Starter, 3 photos, per-photo style, refund on partial failure
 *   - E-G03: Pro, 5 photos × 3 styles = 15 jobs with pass1 cache reuse
 *   - E-BR1-001 (BR-1): parallel labeling (no "1/3" counter, show "parallèle")
 *   - E-BR3-001 (BR-3): refining one tile must not disable the other tiles
 */
test.describe("E-G02 / E-G03 — Multi-photo generation", () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E-G02: 3 photos generate successfully with mocked pipeline", async ({
    page,
  }) => {
    const mockState = mockGenerationHappyPath(page);

    await uploadPhotos(page, 3);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    // Pick a room type if exposed
    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    const generateButton = page.locator("#step-generate").locator("button");
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    // Expect at least 3 generate calls for 3 photos (happens in parallel).
    expect(mockState.count).toBeGreaterThanOrEqual(3);
  });

  test.skip("E-G02: partial failure refunds credits for failed jobs only", async ({
    page,
  }) => {
    // Waiting on data-testid="credits-badge" and deterministic per-tile error state
    // See tests/e2e/NEEDED-TESTIDS.md
  });

  test.skip("E-G03: Pro 5 photos × 3 styles reuses pass1 cache (<= 15 calls)", async ({
    page,
  }) => {
    // Waiting on: multi-style picker UI (one style per photo), data-testid="tile"
    // See tests/e2e/NEEDED-TESTIDS.md
    const mockState = mockGenerationHappyPath(page);
    await uploadPhotos(page, 5);
    await selectFirstStyle(page);
    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 60_000 });
    // With pass1 cache, total calls should stay <= (5 pass1 + 15 pass2) = 20,
    // but the client endpoint is hit 15 times (once per job).
    expect(mockState.count).toBeLessThanOrEqual(20);
  });

  test("E-BR1-001 (BR-1): 3 photos parallel — progress label mentions parallèle, not 1/3", async ({
    page,
  }) => {
    // Slow the mock so we can observe the progress label
    mockGenerationHappyPath(page, { delayMs: 2000 });

    await uploadPhotos(page, 3);
    await selectFirstStyle(page);

    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    const generateButton = page.locator("#step-generate").locator("button");
    await generateButton.click();

    // Within 2s, progress UI should say "3 visuels" or "parallèle" (not "1/3")
    const generateStep = page.locator("#step-generate");
    await expect(generateStep).toContainText(/parall.le|3 visuels|3\s*photos/i, {
      timeout: 3000,
    });
    // Explicit anti-regression: must NOT show "(1/3)" counter
    const text = await generateStep.innerText();
    expect(text).not.toMatch(/\(1\s*\/\s*3\)/);
  });

  test.skip("E-BR3-001 (BR-3): refining one tile keeps other tiles' refine buttons enabled", async ({
    page,
  }) => {
    // Waiting on data-testid="refine-button-{index}" from @fullstack
    // See tests/e2e/NEEDED-TESTIDS.md
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 3);
    await selectFirstStyle(page);
    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    const refineButtons = page
      .locator('[data-testid^="refine-button-"]')
      .or(page.getByRole("button", { name: /affiner/i }));
    const count = await refineButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click refine on tile #1
    await refineButtons.nth(0).click();
    // Buttons #2 and #3 must still be enabled
    await expect(refineButtons.nth(1)).toBeEnabled();
    await expect(refineButtons.nth(2)).toBeEnabled();
  });
});
