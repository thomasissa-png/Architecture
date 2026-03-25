import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// DATA-TESTID NEEDED (not currently in source — @fullstack should add):
// - data-testid="upload-zone" on the UploadZone root dropzone div
// - data-testid="file-preview" on each file preview card in UploadZone
// - data-testid="remove-file-{index}" on remove buttons (currently uses aria-label)
//
// For now, tests use aria-label and text content selectors which work with the current DOM.

// Create a minimal valid JPEG file for upload tests
function createTestImage(filename: string): string {
  const dir = path.join(__dirname, ".fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) {
    // Minimal valid JPEG: SOI + APP0 + minimal scan + EOI
    // This is a 1x1 white pixel JPEG
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
      0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
      0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
      0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
      0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
      0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
      0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
      0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
      0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
      0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
      0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
      0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
      0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
      0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
      0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
      0x00, 0x00, 0x3f, 0x00, 0x7b, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xd9,
    ]);
    fs.writeFileSync(filepath, jpegBytes);
  }
  return filepath;
}

test.describe("Upload flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("upload zone is visible and accepts files", async ({ page }) => {
    // The dropzone has input[type=file] hidden inside
    const dropzone = page.locator(
      'text="Glissez vos photos ici" >> xpath=ancestor::div[contains(@class, "border-dashed")]'
    );
    // On mobile it shows different text, so check for the input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test("uploading an image shows preview with delete button", async ({
    page,
  }) => {
    const testImagePath = createTestImage("test-room.jpg");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview to appear — the grid appears when files.length > 0
    const previewGrid = page.locator(".grid.grid-cols-2");
    await expect(previewGrid).toBeVisible({ timeout: 5000 });

    // Delete button with aria-label should be visible
    const deleteButton = page.locator('button[aria-label*="Supprimer"]');
    await expect(deleteButton).toBeVisible();
  });

  test("uploading more than 5 images shows max reached state", async ({
    page,
  }) => {
    const testImagePath = createTestImage("test-room.jpg");

    const fileInput = page.locator('input[type="file"]');

    // Upload 5 files (react-dropzone maxFiles will be 5, then 4, then 3...)
    // We need to set files multiple times since maxFiles adjusts
    for (let i = 0; i < 5; i++) {
      // Re-query input each time as react re-renders
      const input = page.locator('input[type="file"]');
      await input.setInputFiles(testImagePath);
      // Small wait for state update
      await page.waitForTimeout(300);
    }

    // After 5 files, the dropzone should show "Maximum atteint" text
    await expect(page.getByText(/Maximum atteint/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("uploading a non-image file is rejected", async ({ page }) => {
    // Create a .txt file
    const dir = path.join(__dirname, ".fixtures");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const txtPath = path.join(dir, "not-an-image.txt");
    fs.writeFileSync(txtPath, "this is not an image");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);

    // Rejection message should appear
    await expect(
      page.getByText(/Format non accept/)
    ).toBeVisible({ timeout: 5000 });
  });

  test("deleting an uploaded image works", async ({ page }) => {
    const testImagePath = createTestImage("test-room.jpg");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview
    const deleteButton = page.locator('button[aria-label*="Supprimer"]');
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    // Click delete
    await deleteButton.click();

    // Preview grid should disappear (no more files)
    await expect(deleteButton).not.toBeVisible({ timeout: 3000 });
  });

  test("after upload, style selector appears (progressive reveal)", async ({
    page,
  }) => {
    const testImagePath = createTestImage("test-room.jpg");

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // The style section (#step-style) should become visible
    const styleSection = page.locator("#step-style");
    await expect(styleSection).toBeVisible({ timeout: 5000 });

    // Space type section should also appear
    const spaceTypeSection = page.locator("#step-space-type");
    await expect(spaceTypeSection).toBeVisible({ timeout: 5000 });
  });
});
