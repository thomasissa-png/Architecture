import path from "path";
import fs from "fs";
import type { Page, Route } from "@playwright/test";

// 1x1 white pixel PNG — used as the mocked generation output
export const MOCK_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// A distinct mock output (different from the input) to assert pipeline produced a NEW image
export const MOCK_OUTPUT_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==";

// Minimal valid JPEG (decoder-friendly 1x1) written to disk on demand.
// We write it once per process to `tests/.fixtures/` so multiple specs share it.
export function getTestImagePath(name = "test-room.jpg"): string {
  const dir = path.join(__dirname, ".fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, name);
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

/**
 * Installs a standard happy-path mock on /api/generate and /api/preprocess-prompt.
 * Every call returns MOCK_IMAGE_BASE64 and counts as 1 pipeline invocation.
 * Returns a counter object the test can read.
 */
export function mockGenerationHappyPath(
  page: Page,
  options: { output?: string; delayMs?: number } = {}
): { count: number; payloads: unknown[] } {
  const state = { count: 0, payloads: [] as unknown[] };
  const output = options.output ?? MOCK_IMAGE_BASE64;

  page.route("**/api/generate", async (route: Route) => {
    state.count += 1;
    try {
      state.payloads.push(route.request().postDataJSON());
    } catch {
      state.payloads.push(null);
    }
    if (options.delayMs) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        image: output,
        model: "mock-model",
        pass1_key: `mock-pass1-${state.count}`,
      }),
    });
  });

  page.route("**/api/preprocess-prompt", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        surfacePrompt: "mock surface prompt",
        furniturePrompt: "mock furniture prompt",
        warnings: [],
      }),
    });
  });

  return state;
}

/**
 * Uploads N copies of the test image to the main upload zone
 * and waits for the style step to appear.
 */
export async function uploadPhotos(page: Page, count = 1): Promise<void> {
  const files = Array.from({ length: count }, (_, i) =>
    getTestImagePath(`test-room-${i}.jpg`)
  );
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);
}

/**
 * Selects the first style in the style radiogroup (currently Scandinave).
 */
export async function selectFirstStyle(page: Page): Promise<void> {
  const radiogroup = page.locator(
    'div[role="radiogroup"][aria-label="Choix du style"]'
  );
  await radiogroup.locator('button[role="radio"]').first().click();
}
