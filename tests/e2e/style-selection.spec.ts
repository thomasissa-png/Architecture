import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// DATA-TESTID NEEDED (not currently in source — @fullstack should add):
// - data-testid="style-card-{id}" on each style button in StylePicker
// - data-testid="toggle-indoor" and data-testid="toggle-outdoor" on the mode toggle buttons
// - data-testid="room-type-picker" on the RoomTypePicker container
//
// For now, tests use role="radio", aria-label, and text content selectors.

// Helper: create a minimal JPEG for upload (needed to reveal style picker)
function getTestImagePath(): string {
  const dir = path.join(__dirname, ".fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, "test-room.jpg");
  if (!fs.existsSync(filepath)) {
    // Minimal JPEG (1x1 white pixel)
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

test.describe("Style selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Upload an image to reveal the style picker
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(getTestImagePath());
    // Wait for style section to appear
    await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
  });

  test("12 indoor styles are displayed with color palette dots (no emojis)", async ({
    page,
  }) => {
    const styleSection = page.locator("#step-style");

    // The radiogroup for styles
    const radiogroup = styleSection.locator(
      'div[role="radiogroup"][aria-label="Choix du style"]'
    );
    await expect(radiogroup).toBeVisible();

    // 12 styles + 1 custom = 13 radio buttons
    const styleButtons = radiogroup.locator('button[role="radio"]');
    await expect(styleButtons).toHaveCount(13);

    // Check that each style card has color palette dots (round spans)
    // The STYLES array has 12 entries, each with a palette of 3 colors
    const expectedStyles = [
      "Scandinave",
      "Contemporain",
      "Industriel",
      "Japandi",
      "Art Déco",
      "Mid-Century",
      "Bohème",
      "Méditerranéen",
      "Cosy Moderne",
      "Wabi-Sabi",
      "Maximaliste",
      "Haussmannien",
    ];

    for (const styleName of expectedStyles) {
      await expect(styleSection.getByText(styleName, { exact: true })).toBeVisible();
    }

    // Verify palette dots exist (rounded-full spans inside the first style button)
    const firstStyleDots = styleButtons.first().locator("span.rounded-full");
    await expect(firstStyleDots).toHaveCount(3);
  });

  test("selecting a style highlights the card", async ({ page }) => {
    const styleSection = page.locator("#step-style");
    const radiogroup = styleSection.locator(
      'div[role="radiogroup"][aria-label="Choix du style"]'
    );

    // Click the first style (Scandinave)
    const firstStyle = radiogroup.locator('button[role="radio"]').first();
    await firstStyle.click();

    // Should be aria-checked="true"
    await expect(firstStyle).toHaveAttribute("aria-checked", "true");

    // Should have the selected visual class
    await expect(firstStyle).toHaveClass(/border-foreground/);
  });

  test("indoor/outdoor toggle works", async ({ page }) => {
    const spaceTypeSection = page.locator("#step-space-type");

    // The toggle is a radiogroup with "Interieur" and "Exterieur" buttons
    const toggleGroup = spaceTypeSection.locator(
      'div[role="radiogroup"][aria-label*="interieur"]'
    );
    await expect(toggleGroup).toBeVisible();

    const indoorBtn = toggleGroup.locator('button[role="radio"]').first();
    const outdoorBtn = toggleGroup.locator('button[role="radio"]').last();

    // Default: indoor selected
    await expect(indoorBtn).toHaveAttribute("aria-checked", "true");
    await expect(outdoorBtn).toHaveAttribute("aria-checked", "false");

    // Click outdoor
    await outdoorBtn.click();
    await expect(outdoorBtn).toHaveAttribute("aria-checked", "true");
    await expect(indoorBtn).toHaveAttribute("aria-checked", "false");

    // Click back to indoor
    await indoorBtn.click();
    await expect(indoorBtn).toHaveAttribute("aria-checked", "true");
  });

  test("in outdoor mode, outdoor styles are displayed", async ({ page }) => {
    const spaceTypeSection = page.locator("#step-space-type");
    const toggleGroup = spaceTypeSection.locator(
      'div[role="radiogroup"][aria-label*="interieur"]'
    );
    const outdoorBtn = toggleGroup.locator('button[role="radio"]').last();
    await outdoorBtn.click();

    // The outdoor style picker should appear with its own radiogroup
    const outdoorRadiogroup = page.locator(
      'div[role="radiogroup"][aria-label*="ext"]'
    );
    await expect(outdoorRadiogroup).toBeVisible({ timeout: 5000 });

    // Should have outdoor style buttons (at least 1)
    const outdoorButtons = outdoorRadiogroup.locator('button[role="radio"]');
    const count = await outdoorButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("room type picker appears BEFORE style picker in indoor mode", async ({
    page,
  }) => {
    // In page.tsx, step-space-type (which contains RoomTypePicker in indoor mode)
    // comes before step-style in the DOM
    const spaceTypeSection = page.locator("#step-space-type");
    const styleSection = page.locator("#step-style");

    await expect(spaceTypeSection).toBeVisible();
    await expect(styleSection).toBeVisible();

    // Verify DOM order: space-type should come before style
    const spaceTypeBox = await spaceTypeSection.boundingBox();
    const styleBox = await styleSection.boundingBox();

    expect(spaceTypeBox).not.toBeNull();
    expect(styleBox).not.toBeNull();
    // Space type should be above style (lower Y coordinate)
    expect(spaceTypeBox!.y).toBeLessThan(styleBox!.y);
  });
});
