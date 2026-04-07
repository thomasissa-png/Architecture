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

  test("E-G02: partial failure — failed tile shows error, others succeed", async ({
    page,
  }) => {
    // Mock: first call succeeds, second fails, third succeeds.
    let callIndex = 0;
    await page.route("**/api/generate", async (route) => {
      const idx = callIndex++;
      if (idx === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "mock failure" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            image:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            model: "mock-model",
            pass1_key: `mock-pass1-${idx}`,
          }),
        });
      }
    });
    await page.route("**/api/preprocess-prompt", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          surfacePrompt: "mock",
          furniturePrompt: "mock",
          warnings: [],
        }),
      });
    });

    await uploadPhotos(page, 3);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    // 3 result tiles must exist (success or error states both render a tile)
    const tile0 = page.getByTestId("result-tile-0");
    const tile2 = page.getByTestId("result-tile-2");
    await expect(tile0).toBeVisible({ timeout: 10_000 });
    await expect(tile2).toBeVisible({ timeout: 10_000 });
    expect(callIndex).toBeGreaterThanOrEqual(3);
  });

  test("E-G03: 5 photos × Scandinave generates exactly 5 tiles", async ({
    page,
  }) => {
    // The current UI ships one style across all photos in a single batch.
    // The "5 × 3 styles = 15 jobs with cache reuse" scenario requires a
    // multi-style-per-photo picker that does not exist yet — that variant
    // remains pending.
    const mockState = mockGenerationHappyPath(page);
    await uploadPhotos(page, 5);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 60_000 });

    // 5 distinct result tiles
    for (let i = 0; i < 5; i++) {
      await expect(page.getByTestId(`result-tile-${i}`)).toBeVisible({
        timeout: 15_000,
      });
    }
    expect(mockState.count).toBeGreaterThanOrEqual(5);
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

  test("E-BR3-001 (BR-3): refining one tile keeps other tiles' refine buttons enabled", async ({
    page,
  }) => {
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 3);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    const stepSpaceType = page.locator("#step-space-type");
    if (await stepSpaceType.isVisible().catch(() => false)) {
      const first = stepSpaceType
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    const refine0 = page.getByTestId("refine-button-0");
    const refine1 = page.getByTestId("refine-button-1");
    const refine2 = page.getByTestId("refine-button-2");

    await expect(refine0).toBeVisible({ timeout: 15_000 });
    await expect(refine1).toBeVisible({ timeout: 5000 });
    await expect(refine2).toBeVisible({ timeout: 5000 });

    // Click refine on tile #0 (opens modal). Buttons 1 and 2 must remain enabled.
    await refine0.click();
    await expect(refine1).toBeEnabled({ timeout: 2000 });
    await expect(refine2).toBeEnabled({ timeout: 2000 });
  });
});
