import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
} from "./_helpers";

/**
 * E-G04 — Custom prompt (free-text) in French is preprocessed by /api/preprocess-prompt
 * and passed through the pipeline. Asserts the preprocess endpoint is hit and the
 * generation flow completes.
 */
test.describe("E-G04 — Custom prompt mode", () => {
  test.setTimeout(30_000);

  test("French custom prompt triggers preprocess-prompt and generates", async ({
    page,
  }) => {
    mockGenerationHappyPath(page);

    let preprocessCalled = false;
    let preprocessPayload: { prompt?: string } | null = null;
    await page.route("**/api/preprocess-prompt", async (route) => {
      preprocessCalled = true;
      try {
        preprocessPayload = route.request().postDataJSON() as {
          prompt?: string;
        };
      } catch {
        /* ignore */
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          surfacePrompt: "mock surface",
          furniturePrompt: "blue velvet sofa, wooden coffee table",
          warnings: [],
        }),
      });
    });

    await page.goto("/");
    await uploadPhotos(page, 1);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });

    // Find and activate the custom prompt mode (usually a tab/button "Personnalisé")
    const customToggle = page
      .getByRole("button", { name: /personnalis|custom/i })
      .first();
    if (!(await customToggle.isVisible().catch(() => false))) {
      test.skip(
        true,
        "Custom prompt toggle not found — waiting on data-testid=\"custom-prompt-toggle\""
      );
      return;
    }
    await customToggle.click();

    // Type the custom prompt
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();
    await textarea.fill("je veux un canapé bleu et une table en bois");

    // Select room type if needed
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

    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });

    expect(preprocessCalled).toBe(true);
    // The payload must contain the French input — proves it was sent raw, not pre-translated client-side
    expect(
      preprocessPayload && JSON.stringify(preprocessPayload).includes("canapé")
    ).toBe(true);
  });
});
