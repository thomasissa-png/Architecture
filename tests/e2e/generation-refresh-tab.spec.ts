import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

/**
 * E-G05 — Tab switch mid-generation: the user leaves the tab while generation is running.
 * Result must still land in the gallery (or a toast notifies the user).
 *
 * E-G06 — Full reload mid-generation: the queue resumes the job or the result is
 * retrievable from the gallery fallback.
 *
 * Both scenarios depend on the queue/gallery architecture (session 32+).
 * Marked test.skip where the gallery UI is not yet stabilized.
 */
test.describe("E-G05 / E-G06 — Tab switch & reload resilience", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E-G05: visibilitychange during generation does not break the result", async ({
    page,
  }) => {
    mockGenerationHappyPath(page, { delayMs: 2000 });

    await uploadPhotos(page, 1);
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

    // Simulate user switching tab
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Wait a beat then switch back
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Result must still appear
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });
  });

  test.skip("E-G06: reload during generation triggers queue resume or gallery fallback", async ({
    page,
  }) => {
    // Waiting on: stable gallery route (/galerie) + deterministic queue state
    // See tests/e2e/NEEDED-TESTIDS.md
    mockGenerationHappyPath(page, { delayMs: 3000 });

    await uploadPhotos(page, 1);
    await selectFirstStyle(page);
    await page.locator("#step-generate").locator("button").click();

    // Reload mid-generation
    await page.waitForTimeout(500);
    await page.reload();

    // Either the result comes back (queue resume) or the gallery has it
    const results = page.locator("#step-results");
    const gallery = page.getByRole("link", { name: /galerie/i });
    await expect(results.or(gallery)).toBeVisible({ timeout: 15_000 });
  });
});
