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

  test.skip("E-G10: iteration source image is the output (furnished), not pass1", async ({
    page,
  }) => {
    // Waiting on: exposed refine button (stable locator) + request shape that
    // includes the source image field. See tests/e2e/NEEDED-TESTIDS.md
    const iterationPayloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/generate", async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
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

    await uploadPhotos(page, 1);
    await selectFirstStyle(page);
    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // Open refine panel and submit a comment
    const refineButton = page.getByRole("button", { name: /affiner/i }).first();
    await refineButton.click();
    const commentInput = page.locator("textarea").last();
    await commentInput.fill("ajoute une plante verte");
    await page.getByRole("button", { name: /envoyer|g.n.rer|valider/i }).click();

    // Wait for second generate call
    await expect.poll(() => iterationPayloads.length).toBeGreaterThanOrEqual(2);

    const refinePayload = iterationPayloads[1];
    // The refine payload must contain the OUTPUT image (base64 starting with our MOCK_OUTPUT),
    // NOT a reference to pass1 cache only.
    const payloadStr = JSON.stringify(refinePayload);
    expect(payloadStr).toMatch(/image|sourceImage|inputImage/i);
    // Must not send ONLY a pass1 key without the full image reference
    const hasOnlyPass1 =
      payloadStr.includes("pass1_key") &&
      !payloadStr.includes("data:image") &&
      !payloadStr.includes("outputImage");
    expect(hasOnlyPass1).toBe(false);
  });

  test.skip("E-BR4-001: BackgroundDisconnectError shows blue toast, keeps refine enabled", async ({
    page,
  }) => {
    // Waiting on: stable refine button testid + stable toast testid
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 1);
    await selectFirstStyle(page);
    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 15_000 });

    // Replace the mock with a TypeError-producing route for the next call
    let refineCallSeen = false;
    await page.route("**/api/generate", async (route) => {
      refineCallSeen = true;
      await route.abort("failed"); // simulates BackgroundDisconnectError / fetch failed
    });

    const refineButton = page.getByRole("button", { name: /affiner/i }).first();
    await refineButton.click();
    const commentInput = page.locator("textarea").last();
    await commentInput.fill("ajoute une plante verte");
    await page.getByRole("button", { name: /envoyer|g.n.rer|valider/i }).click();

    // Blue toast (info, not error) mentioning galerie
    await expect(page.getByText(/galerie/i)).toBeVisible({ timeout: 10_000 });
    // No red error banner
    await expect(page.getByRole("alert").filter({ hasText: /erreur/i })).toHaveCount(
      0
    );
    // Refine button back to enabled
    await expect(refineButton).toBeEnabled();
    expect(refineCallSeen).toBe(true);
  });
});
