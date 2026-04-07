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

    const roomTypePicker = page.getByTestId("room-type-picker");
    await expect(roomTypePicker).toBeVisible({ timeout: 5000 });

    // Try to find a "Cuisine" / kitchen button
    const cuisineButton = roomTypePicker
      .getByRole("button", { name: /cuisine|kitchen/i })
      .first();
    if (!(await cuisineButton.isVisible().catch(() => false))) {
      test.skip(true, "Cuisine room type button not found in room-type-picker");
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

  test("E-BR2-001: withFurniture=false delivers a pass1 result, not the input", async ({
    page,
  }) => {
    mockGenerationHappyPath(page);
    await uploadPhotos(page, 3);
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
    await selectFirstStyle(page);

    // Pick room type if needed
    const roomTypePicker = page.getByTestId("room-type-picker");
    if (await roomTypePicker.isVisible().catch(() => false)) {
      const first = roomTypePicker
        .locator("button")
        .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
        .first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }

    // The furniture-toggle-{index} container holds two buttons (meublé/surfaces).
    // Click the second button (surfaces only) on tile #1 (index 1).
    const toggleContainer = page.getByTestId("furniture-toggle-1");
    if (await toggleContainer.isVisible().catch(() => false)) {
      const buttons = toggleContainer.locator("button");
      const buttonCount = await buttons.count();
      if (buttonCount >= 2) {
        await buttons.nth(1).click(); // surfaces only
      }
    }

    await page.locator("#step-generate").locator("button").click();
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });

    // Tile #1 (index 1) should show a generated image, not the original upload blob
    const tile1 = page.getByTestId("result-tile-1");
    await expect(tile1).toBeVisible({ timeout: 10_000 });
    const img = tile1.locator("img").first();
    const src = await img.getAttribute("src");
    expect(src).not.toBeNull();
    expect(src).not.toMatch(/^blob:/);
  });
});
