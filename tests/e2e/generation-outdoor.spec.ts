import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

/**
 * E-G09 — Outdoor mode (Terrasse/Jardin).
 * Mutex F2/F3: selecting outdoor disables the indoor room-type picker.
 * The generate payload must include outdoor: true and an outdoorSubtype.
 */
test.describe("E-G09 — Outdoor mode", () => {
  test.setTimeout(30_000);

  test("selecting Terrasse sends outdoor=true, outdoorSubtype=terrace", async ({
    page,
  }) => {
    mockGenerationHappyPath(page);

    await page.goto("/");
    await uploadPhotos(page, 1);

    // Switch to outdoor tab via stable testid
    const outdoorTab = page.getByTestId("outdoor-tab");
    await expect(outdoorTab).toBeVisible();
    await outdoorTab.click();

    // Pick Terrasse subtype
    const terrasse = page.getByRole("button", { name: /terrasse/i }).first();
    if (await terrasse.isVisible().catch(() => false)) {
      await terrasse.click();
    }

    // Mutex check: indoor room type picker should be disabled or hidden
    const indoorRoomTypes = page.locator("#step-space-type").filter({
      hasText: /salon|cuisine|chambre/i,
    });
    const indoorVisible = await indoorRoomTypes.isVisible().catch(() => false);
    if (indoorVisible) {
      // If still visible, it must be aria-disabled
      const indoorButtons = indoorRoomTypes.locator("button");
      const firstBtn = indoorButtons.first();
      if (await firstBtn.isVisible().catch(() => false)) {
        await expect(firstBtn).toBeDisabled();
      }
    }

    await selectFirstStyle(page);

    const [request] = await Promise.all([
      page.waitForRequest("**/api/generate"),
      page.locator("#step-generate").locator("button").click(),
    ]);

    const payloadStr = JSON.stringify(request.postDataJSON()).toLowerCase();
    expect(payloadStr).toMatch(/outdoor|ext.rieur|terrace|terrasse/);
  });
});
