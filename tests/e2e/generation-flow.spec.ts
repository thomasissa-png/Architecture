import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// DATA-TESTID NEEDED (not currently in source — @fullstack should add):
// - data-testid="generate-button" on the main generate button
// - data-testid="cancel-button" on the cancel button during generation
// - data-testid="error-message" on the error container
// - data-testid="retry-button" on the retry button
// - data-testid="results-section" on the results container
//
// For now, tests use text content, id selectors, and role-based selectors.

// Helper: create a minimal JPEG for upload
function getTestImagePath(): string {
  const dir = path.join(__dirname, ".fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, "test-room.jpg");
  if (!fs.existsSync(filepath)) {
    const jpegBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0x7b, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xd9,
    ]);
    fs.writeFileSync(filepath, jpegBytes);
  }
  return filepath;
}

// Helper: prepare page with uploaded image + selected style
async function setupReadyToGenerate(page: import("@playwright/test").Page) {
  await page.goto("/");

  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(getTestImagePath());

  // Wait for style section
  await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });

  // Select first style (Scandinave)
  const styleRadiogroup = page.locator(
    'div[role="radiogroup"][aria-label="Choix du style"]'
  );
  const firstStyle = styleRadiogroup.locator('button[role="radio"]').first();
  await firstStyle.click();

  // Wait for generate button area to appear
  await expect(page.locator("#step-generate")).toBeVisible({ timeout: 5000 });
}

// 1x1 white pixel PNG as base64 for mock responses
const MOCK_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

test.describe("Generation flow", () => {
  test("generate button is disabled without upload and style", async ({
    page,
  }) => {
    await page.goto("/");

    // The generate button should not be visible at all when no files are uploaded
    // (canGenerate is false, so the button is not rendered)
    const generateArea = page.locator("#step-generate");
    await expect(generateArea).not.toBeVisible();
  });

  test("generate button is enabled after upload + style selection", async ({
    page,
  }) => {
    await setupReadyToGenerate(page);

    const generateButton = page
      .locator("#step-generate")
      .locator("button");
    await expect(generateButton).toBeVisible();
    // Button should not be disabled (unless roomType is required and not selected,
    // but roomType is optional for now based on the disabled condition)
    // Note: if selectedStyle !== null && !selectedRoomType, button IS disabled.
    // So we need to also select a room type.
    // Let's check the actual state — the button might be disabled due to room type requirement.
    const isDisabled = await generateButton.isDisabled();
    if (isDisabled) {
      // Select a room type first
      const roomTypeButton = page.locator("#step-space-type button").first();
      if (await roomTypeButton.isVisible()) {
        // Click the first room type option (find a clickable button in RoomTypePicker)
        const roomTypes = page.locator("#step-space-type").locator("button").filter({
          hasNot: page.locator('[role="radio"]'),
        });
        const firstRoomType = roomTypes.first();
        if (await firstRoomType.isVisible()) {
          await firstRoomType.click();
        }
      }
    }

    // Re-check: button should be enabled now
    await expect(generateButton).toBeEnabled({ timeout: 3000 });
  });

  test("mock API success: comparator appears after generation", async ({
    page,
  }) => {
    // Mock the /api/generate endpoint
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          image: MOCK_IMAGE_BASE64,
          model: "mock-model",
          pass1_key: "mock-pass1-key",
        }),
      });
    });

    // Also mock /api/preprocess-prompt in case custom prompt is used
    await page.route("**/api/preprocess-prompt", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          surfacePrompt: "mock surface",
          furniturePrompt: "mock furniture",
          warnings: [],
        }),
      });
    });

    await setupReadyToGenerate(page);

    // Select room type if needed
    const generateButton = page.locator("#step-generate").locator("button");
    if (await generateButton.isDisabled()) {
      // Find and click a room type
      const roomTypeButtons = page
        .locator("#step-space-type")
        .locator("button")
        .filter({ hasNotText: /Int|Ext/ });
      const firstRoomBtn = roomTypeButtons.first();
      if (await firstRoomBtn.isVisible()) {
        await firstRoomBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await generateButton.click();

    // Results section should appear
    const resultsSection = page.locator("#step-results");
    await expect(resultsSection).toBeVisible({ timeout: 15000 });

    // Should contain "Resultat" heading
    await expect(resultsSection).toContainText("sultat");
  });

  test("mock API error: error message and retry button appear", async ({
    page,
  }) => {
    // Mock the /api/generate endpoint with an error
    await page.route("**/api/generate", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Erreur serveur de test",
        }),
      });
    });

    await setupReadyToGenerate(page);

    // Select room type if needed
    const generateButton = page.locator("#step-generate").locator("button");
    if (await generateButton.isDisabled()) {
      const roomTypeButtons = page
        .locator("#step-space-type")
        .locator("button")
        .filter({ hasNotText: /Int|Ext/ });
      const firstRoomBtn = roomTypeButtons.first();
      if (await firstRoomBtn.isVisible()) {
        await firstRoomBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await generateButton.click();

    // Error message should appear
    await expect(page.getByText("Erreur serveur de test")).toBeVisible({
      timeout: 15000,
    });

    // Retry button should be visible
    const retryButton = page.getByText("essayer");
    await expect(retryButton).toBeVisible();
  });

  test("cancel button during generation works", async ({ page }) => {
    // Mock the /api/generate endpoint with a slow response
    await page.route("**/api/generate", async (route) => {
      // Simulate a slow response — wait 30s (test will cancel before this)
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          image: MOCK_IMAGE_BASE64,
          model: "mock-model",
        }),
      });
    });

    await setupReadyToGenerate(page);

    // Select room type if needed
    const generateButton = page.locator("#step-generate").locator("button");
    if (await generateButton.isDisabled()) {
      const roomTypeButtons = page
        .locator("#step-space-type")
        .locator("button")
        .filter({ hasNotText: /Int|Ext/ });
      const firstRoomBtn = roomTypeButtons.first();
      if (await firstRoomBtn.isVisible()) {
        await firstRoomBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await generateButton.click();

    // Wait for loading state — the generation timer text
    await expect(page.getByText(/Estimation/)).toBeVisible({ timeout: 5000 });

    // Cancel button should be visible
    const cancelButton = page.getByText("Annuler");
    await expect(cancelButton).toBeVisible();

    // Click cancel
    await cancelButton.click();

    // Generation should stop — timer text should disappear
    await expect(page.getByText(/Estimation/)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("mock generation shows progress indicators", async ({ page }) => {
    // Mock with a delay to observe loading state
    let resolveRoute: (() => void) | null = null;
    const routePromise = new Promise<void>((resolve) => {
      resolveRoute = resolve;
    });

    await page.route("**/api/generate", async (route) => {
      // Wait a bit so we can observe the loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          image: MOCK_IMAGE_BASE64,
          model: "mock-model",
          pass1_key: "mock-key",
        }),
      });
      resolveRoute?.();
    });

    await setupReadyToGenerate(page);

    // Select room type if needed
    const generateButton = page.locator("#step-generate").locator("button");
    if (await generateButton.isDisabled()) {
      const roomTypeButtons = page
        .locator("#step-space-type")
        .locator("button")
        .filter({ hasNotText: /Int|Ext/ });
      const firstRoomBtn = roomTypeButtons.first();
      if (await firstRoomBtn.isVisible()) {
        await firstRoomBtn.click();
        await page.waitForTimeout(300);
      }
    }

    await generateButton.click();

    // Should show the generation in progress text in the button
    await expect(
      page.getByText(/n.ration en cours/)
    ).toBeVisible({ timeout: 5000 });

    // Timer should be visible
    await expect(page.getByText(/Estimation/)).toBeVisible({ timeout: 5000 });

    // Wait for mock to complete
    await routePromise;
  });
});
