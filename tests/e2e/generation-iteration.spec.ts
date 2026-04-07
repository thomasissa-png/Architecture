import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
  MOCK_OUTPUT_BASE64,
} from "./_helpers";

/**
 * E-G10 — Iteration (refine) flow.
 * Regression anchor (session 32): the image source of an iteration must be the
 * OUTPUT (furnished) image, NOT the pass1 (empty) image.
 *
 * E-BR4-001 — BackgroundDisconnectError during refine must surface a BLUE toast
 * telling the user "votre image est dans la galerie", NOT a red error banner,
 * and the Affiner button must re-enable.
 */
test.describe("E-G10 / E-BR4-001 — Iteration (refine)", () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E-G10: iteration source image is the output (furnished), not pass1", async ({
    page,
  }) => {
    const iterationPayloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/generate", async (route) => {
      let body: Record<string, unknown> = {};
      try {
        body = route.request().postDataJSON() as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      iterationPayloads.push(body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          image: MOCK_OUTPUT_BASE64,
          model: "mock-model",
          pass1_key: "mock-key",
        }),
      });
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

    await uploadPhotos(page, 1);
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
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // Open refine modal via stable testid
    const refineButton = page.getByTestId("refine-button-0");
    await expect(refineButton).toBeVisible({ timeout: 10_000 });
    await refineButton.click();

    const commentInput = page.getByTestId("refine-comment-input");
    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await commentInput.fill("ajoute une plante verte");

    await page.getByTestId("refine-submit").click();

    // Wait for second generate call
    await expect.poll(() => iterationPayloads.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);

    const refinePayload = iterationPayloads[iterationPayloads.length - 1];
    const payloadStr = JSON.stringify(refinePayload);
    expect(payloadStr).toMatch(/image|sourceImage|inputImage/i);
    // Must not send ONLY a pass1 key without the full image reference
    const hasOnlyPass1 =
      payloadStr.includes("pass1_key") &&
      !payloadStr.includes("data:image") &&
      !payloadStr.includes("outputImage");
    expect(hasOnlyPass1).toBe(false);
  });

  test("E-BR4-001: BackgroundDisconnectError shows blue toast, keeps refine enabled", async ({
    page,
  }) => {
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 1);
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
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // Replace the mock with a TypeError-producing route for the refine call.
    // page.route is LIFO — adding a new handler overrides the previous one.
    let refineCallSeen = false;
    await page.route("**/api/generate", async (route) => {
      refineCallSeen = true;
      await route.abort("failed"); // simulates BackgroundDisconnectError / fetch failed
    });

    const refineButton = page.getByTestId("refine-button-0");
    await expect(refineButton).toBeVisible({ timeout: 10_000 });
    await refineButton.click();

    const commentInput = page.getByTestId("refine-comment-input");
    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await commentInput.fill("ajoute une plante verte");

    await page.getByTestId("refine-submit").click();

    // Blue info toast must surface
    const toast = page.getByTestId("toast-info-gallery");
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // Refine button back to enabled
    await expect(refineButton).toBeEnabled({ timeout: 5000 });
    expect(refineCallSeen).toBe(true);
  });
});
