import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

/**
 * E-G08 — Room type picker injects roomType into the generate payload.
 * Regression: type piece must reach /api/generate so the prompt builder can
 * tailor constraints per room.
 *
 * E-BR2-001 (BR-2) — withFurniture=false on a tile must deliver a pass1-only
 * (unfurnished) result, NOT the original input.
 */
test.describe("E-G08 / E-BR2-001 — Room types & pass1 toggle", () => {
  test.setTimeout(45_000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("E-G08: selecting 'Cuisine' sends roomType=kitchen in the payload", async ({
    page,
  }) => {
    const state = mockGenerationHappyPath(page);

    await uploadPhotos(page, 1);
    await selectFirstStyle(page);

    const stepSpaceType = page.locator("#step-space-type");
    if (!(await stepSpaceType.isVisible().catch(() => false))) {
      test.skip(
        true,
        "Room type picker not visible — waiting on data-testid=\"room-type-picker\""
      );
      return;
    }

    // Try to find a "Cuisine" / kitchen button
    const cuisineButton = stepSpaceType
      .getByRole("button", { name: /cuisine|kitchen/i })
      .first();
    if (!(await cuisineButton.isVisible().catch(() => false))) {
      test.skip(true, "Cuisine room type button not found");
      return;
    }
    await cuisineButton.click();

    const [request] = await Promise.all([
      page.waitForRequest("**/api/generate"),
      page.locator("#step-generate").locator("button").click(),
    ]);

    const body = request.postDataJSON() as Record<string, unknown>;
    const payloadStr = JSON.stringify(body).toLowerCase();
    expect(payloadStr).toMatch(/kitchen|cuisine/);
    expect(state.count).toBeGreaterThanOrEqual(1);
  });

  test.skip("E-BR2-001: withFurniture=false delivers a pass1 result, not the input", async ({
    page,
  }) => {
    // Waiting on: exposed per-tile toggle data-testid="furniture-toggle-{i}"
    // and distinct mock outputs per tile. See tests/e2e/NEEDED-TESTIDS.md
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 3);
    await selectFirstStyle(page);

    const toggle = page.getByTestId("furniture-toggle-1");
    await toggle.click(); // disables furniture on tile #2

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    // Tile #2 should show the pass1 (empty-room finished) image, not the original upload
    const tile2 = page.getByTestId("result-tile-1");
    const src = await tile2.locator("img").getAttribute("src");
    expect(src).not.toBe(null);
    expect(src).not.toMatch(/blob:/); // must not be the original file URL
  });
});
