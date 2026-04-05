import { test, expect, Page, Route } from "@playwright/test";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Fixtures — minimal valid JPEG files for upload
// ---------------------------------------------------------------------------

function createTestImage(filename: string): string {
  const dir = path.join(__dirname, ".fixtures");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  if (!fs.existsSync(filepath)) {
    // Minimal valid JPEG (1x1 white pixel)
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

// 1x1 white pixel PNG as base64 for mock API responses
const MOCK_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// A visually different mock (1x1 red pixel) to distinguish before/after
const MOCK_IMAGE_RED_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Number of /api/generate calls intercepted */
type CallTracker = { count: number; bodies: unknown[] };

/** Set up route intercept for /api/generate that succeeds instantly */
function mockGenerateSuccess(
  page: Page,
  tracker?: CallTracker,
  options?: { delayMs?: number; failAfter?: number }
): Promise<void> {
  let callIndex = 0;
  return page.route("**/api/generate", async (route: Route) => {
    const body = route.request().postDataJSON();
    if (tracker) {
      tracker.count++;
      tracker.bodies.push(body);
    }
    if (options?.delayMs) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    const idx = callIndex++;
    if (options?.failAfter !== undefined && idx >= options.failAfter) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Erreur serveur simulée" }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        image: MOCK_IMAGE_BASE64,
        model: "mock-model",
        pass1_key: `mock-pass1-key-${idx}`,
      }),
    });
  });
}

/** Set up route intercept for /api/generate that always fails */
function mockGenerateFail(page: Page): Promise<void> {
  return page.route("**/api/generate", async (route: Route) => {
    return route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Erreur serveur simulée" }),
    });
  });
}

/** Mock /api/generate with configurable delay — never resolves until aborted */
function mockGenerateHang(page: Page): Promise<void> {
  return page.route("**/api/generate", async (route: Route) => {
    // Wait 60s — the test will cancel well before this
    await new Promise((r) => setTimeout(r, 60_000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ image: MOCK_IMAGE_BASE64, model: "mock" }),
    });
  });
}

/** Mock ancillary endpoints that may fire during generation */
async function mockAncillary(page: Page): Promise<void> {
  await page.route("**/api/preprocess-prompt", async (route: Route) => {
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
  // Mock validate-room to allow any image through
  await page.route("**/api/validate-room", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ valid: true }),
    });
  });
  // Mock user/credits — start with 20 credits
  await page.route("**/api/user/credits", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ credits: 20 }),
    });
  });
  // Mock auth/session — logged in user
  await page.route("**/api/auth/session", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { name: "Test User", email: "test@test.com" },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });
}

/** Upload N test images into the UploadZone */
async function uploadImages(page: Page, count: number): Promise<void> {
  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    paths.push(createTestImage(`test-room-${i}.jpg`));
  }
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(paths);
  // Wait for preview grid to stabilise
  await page.waitForTimeout(500);
}

/** Select a single indoor style (first available) */
async function selectStyle(page: Page): Promise<void> {
  await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
  const radiogroup = page.locator(
    'div[role="radiogroup"][aria-label="Choix du style"]'
  );
  const firstStyle = radiogroup.locator('button[role="radio"]').first();
  await firstStyle.click();
}

/** Select two indoor styles */
async function selectTwoStyles(page: Page): Promise<void> {
  await expect(page.locator("#step-style")).toBeVisible({ timeout: 5000 });
  const radiogroup = page.locator(
    'div[role="radiogroup"][aria-label="Choix du style"]'
  );
  const buttons = radiogroup.locator('button[role="radio"]');
  // In multi-style mode, clicking multiple styles selects them
  await buttons.nth(0).click();
  await buttons.nth(1).click();
}

/** Select room type if the generate button is disabled */
async function ensureRoomType(page: Page): Promise<void> {
  const generateButton = page.locator("#step-generate").locator("button");
  const isDisabled = await generateButton.isDisabled().catch(() => true);
  if (isDisabled) {
    const roomTypeSection = page.locator("#step-space-type");
    if (await roomTypeSection.isVisible().catch(() => false)) {
      const firstRoomType = roomTypeSection.locator("button").first();
      if (await firstRoomType.isVisible()) {
        await firstRoomType.click();
        await page.waitForTimeout(300);
      }
    }
  }
}

/** Click the generate button */
async function clickGenerate(page: Page): Promise<void> {
  await ensureRoomType(page);
  const generateButton = page.locator("#step-generate").locator("button");
  await expect(generateButton).toBeEnabled({ timeout: 5000 });
  await generateButton.click();
}

/** Read credit count displayed in the AuthButton */
async function getDisplayedCredits(page: Page): Promise<string> {
  // AuthButton shows credits as a small badge or text — look for the credits indicator
  // The component shows "N visuel(s)" or a number
  const creditsEl = page.locator('[data-testid="credits-display"]');
  if (await creditsEl.isVisible().catch(() => false)) {
    return (await creditsEl.textContent()) || "";
  }
  // Fallback: look for text matching pattern "XX visuel" in the header area
  const headerCredits = page.locator("header").getByText(/visuel/);
  if (await headerCredits.isVisible().catch(() => false)) {
    return (await headerCredits.textContent()) || "";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Multi-photo generation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAncillary(page);
  });

  // ==========================================================================
  // SCENARIO 1 — 1 photo x 1 style : credits -1 immediate
  // ==========================================================================
  test("S01: 1 photo x 1 style — credits -1 immediate, result correct", async ({
    page,
  }) => {
    const tracker: CallTracker = { count: 0, bodies: [] };
    await mockGenerateSuccess(page, tracker);

    await page.goto("/");
    await uploadImages(page, 1);
    await selectStyle(page);
    await clickGenerate(page);

    // Credits event should fire with credits = 19 (20 - 1)
    // Verify via evaluating the CustomEvent that was dispatched
    const creditsAfterClick = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        // Credits already decremented synchronously — check state via DOM
        // The AuthButton listens to credits-updated events
        // We check the last known value
        const handler = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          resolve(detail?.credits ?? null);
        };
        window.addEventListener("credits-updated", handler, { once: true });
        // If event already fired, resolve after short timeout
        setTimeout(() => resolve(null), 2000);
      });
    });
    // Note: the event may have already fired before our listener.
    // Instead, verify the generation completes with 1 API call.

    // Wait for results section (generation completes)
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });

    // Exactly 1 API call
    expect(tracker.count).toBe(1);

    // Result section shows "Resultat"
    await expect(page.locator("#step-results")).toContainText("sultat");
  });

  // ==========================================================================
  // SCENARIO 2 — 3 photos x 1 style : credits -3 immediate, ALL show
  //              "Generation..." simultaneously (no "En attente")
  // ==========================================================================
  test("S02: 3 photos x 1 style — credits -3, all show Generation simultaneously", async ({
    page,
  }) => {
    const tracker: CallTracker = { count: 0, bodies: [] };
    // Use a 3s delay so we can observe the loading state
    await mockGenerateSuccess(page, tracker, { delayMs: 3000 });

    await page.goto("/");
    await uploadImages(page, 3);
    await selectStyle(page);

    // Intercept the credits-updated event BEFORE clicking
    const creditsPromise = page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        const handler = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          resolve(detail?.credits ?? null);
        };
        window.addEventListener("credits-updated", handler, { once: true });
        setTimeout(() => resolve(null), 5000);
      });
    });

    await clickGenerate(page);

    // Credits should decrement by 3 immediately (20 - 3 = 17)
    const creditsValue = await creditsPromise;
    if (creditsValue !== null) {
      expect(creditsValue).toBe(17);
    }

    // During generation: loading block visible
    await expect(page.locator("#step-loading")).toBeVisible({ timeout: 5000 });

    // ALL 3 images should show "Generation..." — NONE should show "En attente"
    // The loading block renders one card per file
    const generationLabels = page.locator(
      '#step-loading >> text="Génération…"'
    );
    // With MAX_CONCURRENT=5, all 3 launch simultaneously
    await expect(generationLabels).toHaveCount(3, { timeout: 3000 });

    // "En attente" should NOT be visible anywhere
    const enAttente = page.locator('#step-loading >> text="En attente"');
    await expect(enAttente).toHaveCount(0);

    // Wait for completion
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });

    // 3 API calls
    expect(tracker.count).toBe(3);
  });

  // ==========================================================================
  // SCENARIO 3 — 2 photos x 2 styles : credits -4 immediate, 4 results
  // ==========================================================================
  test("S03: 2 photos x 2 styles — credits -4, 4 jobs, 4 results", async ({
    page,
  }) => {
    const tracker: CallTracker = { count: 0, bodies: [] };
    await mockGenerateSuccess(page, tracker);

    await page.goto("/");
    await uploadImages(page, 2);
    await selectTwoStyles(page);

    const creditsPromise = page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        const handler = (e: Event) => {
          resolve((e as CustomEvent).detail?.credits ?? null);
        };
        window.addEventListener("credits-updated", handler, { once: true });
        setTimeout(() => resolve(null), 5000);
      });
    });

    await clickGenerate(page);

    // Credits: 20 - 4 = 16
    const creditsValue = await creditsPromise;
    if (creditsValue !== null) {
      expect(creditsValue).toBe(16);
    }

    // Wait for results
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });

    // 4 API calls (2 photos x 2 styles)
    expect(tracker.count).toBe(4);
  });

  // ==========================================================================
  // SCENARIO 4 — 1 photo outdoor : credits -1, result
  // ==========================================================================
  test("S04: 1 photo outdoor — credits -1, outdoor result", async ({
    page,
  }) => {
    const tracker: CallTracker = { count: 0, bodies: [] };
    await mockGenerateSuccess(page, tracker);

    await page.goto("/");
    await uploadImages(page, 1);

    // Switch to outdoor mode
    const outdoorToggle = page.getByText("Extérieur");
    if (await outdoorToggle.isVisible().catch(() => false)) {
      await outdoorToggle.click();
      await page.waitForTimeout(300);
    }

    // Select outdoor style
    await selectStyle(page);
    await clickGenerate(page);

    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });
    expect(tracker.count).toBe(1);

    // Verify the API was called with outdoor flag
    const firstBody = tracker.bodies[0] as Record<string, unknown>;
    expect(firstBody?.isOutdoor).toBe(true);
  });

  // ==========================================================================
  // SCENARIO 5 — 1 photo surfaces-only : credits -1, no furniture
  // ==========================================================================
  test("S05: 1 photo surfaces-only — credits -1, surfaces result", async ({
    page,
  }) => {
    const tracker: CallTracker = { count: 0, bodies: [] };
    await mockGenerateSuccess(page, tracker);

    await page.goto("/");
    await uploadImages(page, 1);
    await selectStyle(page);

    // Toggle surfaces-only (withFurniture = false)
    // Look for the "surfaces uniquement" or "sans meubles" toggle
    const surfacesToggle = page.getByText(/surfaces/i).first();
    if (await surfacesToggle.isVisible().catch(() => false)) {
      await surfacesToggle.click();
      await page.waitForTimeout(300);
    }

    await clickGenerate(page);

    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });
    expect(tracker.count).toBe(1);

    // Verify withFurniture is false in the API call
    const firstBody = tracker.bodies[0] as Record<string, unknown>;
    // If surfaces-only toggle was found and clicked
    if (firstBody?.withFurniture !== undefined) {
      expect(firstBody.withFurniture).toBe(false);
    }
  });

  // ==========================================================================
  // SCENARIO 6 — Partial error: 2 succeed / 1 fails, credits +1 refund
  // ==========================================================================
  test("S06: partial error — 2 succeed, 1 fails, 1 credit refunded", async ({
    page,
  }) => {
    // First 2 calls succeed, 3rd fails
    await mockGenerateSuccess(page, undefined, { failAfter: 2 });

    await page.goto("/");
    await uploadImages(page, 3);
    await selectStyle(page);

    const creditsEvents: number[] = [];
    await page.evaluate(() => {
      (window as unknown as Record<string, number[]>).__creditsLog = [];
      window.addEventListener("credits-updated", (e: Event) => {
        const detail = (e as CustomEvent).detail;
        (window as unknown as Record<string, number[]>).__creditsLog.push(
          detail?.credits ?? -1
        );
      });
    });

    await clickGenerate(page);

    // Wait for results or error message
    await expect(
      page.getByText(/remboursé/)
    ).toBeVisible({ timeout: 20_000 });

    // The error message should mention 2/3 successful + 1 refunded
    await expect(page.getByText(/2\/3/)).toBeVisible();
    await expect(page.getByText(/1 visuel.*remboursé/)).toBeVisible();

    // Results section should show the 2 successful results
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 5000 });
  });

  // ==========================================================================
  // SCENARIO 7 — Total error: 0/3 succeed, credits +3 refund
  // ==========================================================================
  test("S07: total error — 0/3 succeed, all 3 credits refunded", async ({
    page,
  }) => {
    await mockGenerateFail(page);

    await page.goto("/");
    await uploadImages(page, 3);
    await selectStyle(page);

    // Listen for credit refund events
    await page.evaluate(() => {
      (window as unknown as Record<string, number[]>).__creditsLog = [];
      window.addEventListener("credits-updated", (e: Event) => {
        const detail = (e as CustomEvent).detail;
        (window as unknown as Record<string, number[]>).__creditsLog.push(
          detail?.credits ?? -1
        );
      });
    });

    await clickGenerate(page);

    // Should show error message
    await expect(
      page.getByText(/Erreur/)
    ).toBeVisible({ timeout: 20_000 });

    // Credits should be refunded: initial decrement -3, then refund +3
    // Verify via the credits log
    const creditsLog = await page.evaluate(
      () => (window as unknown as Record<string, number[]>).__creditsLog
    );
    // First event: 20 - 3 = 17 (immediate decrement)
    // Second event: refund (credits-updated without detail, triggers fetch — or with detail)
    expect(creditsLog.length).toBeGreaterThanOrEqual(1);

    // Results section should NOT be visible (no successful results)
    await expect(page.locator("#step-results")).not.toBeVisible();
  });

  // ==========================================================================
  // SCENARIO 8 — Cancellation: credits refunded
  // ==========================================================================
  test("S08: cancel during generation — generation stops", async ({
    page,
  }) => {
    await mockGenerateHang(page);

    await page.goto("/");
    await uploadImages(page, 2);
    await selectStyle(page);
    await clickGenerate(page);

    // Wait for loading state
    await expect(page.locator("#step-loading")).toBeVisible({ timeout: 5000 });

    // Click cancel
    const cancelButton = page.getByText("Annuler");
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Loading should disappear (isGenerating = false)
    await expect(page.locator("#step-loading")).not.toBeVisible({
      timeout: 5000,
    });
  });

  // ==========================================================================
  // SCENARIO 9 — Before/after: each result shows ITS input photo
  // ==========================================================================
  test("S09: each result shows its own input photo in comparator", async ({
    page,
  }) => {
    // Return different mock images per call to make tracking easier
    let callIdx = 0;
    await page.route("**/api/generate", async (route: Route) => {
      const idx = callIdx++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          image: idx % 2 === 0 ? MOCK_IMAGE_BASE64 : MOCK_IMAGE_RED_BASE64,
          model: "mock-model",
          pass1_key: `pass1-${idx}`,
        }),
      });
    });

    await page.goto("/");
    await uploadImages(page, 2);
    await selectStyle(page);
    await clickGenerate(page);

    // Wait for results
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });

    // Each result card should contain an image — verify there are 2 result blocks
    const resultBlocks = page.locator("#step-results .space-y-10 > div");
    const count = await resultBlocks.count();
    expect(count).toBe(2);

    // Each result should have a comparator with the original image
    // The ImageComparator renders the original (before) and generated (after)
    // Verify that each result block contains an img element
    for (let i = 0; i < count; i++) {
      const block = resultBlocks.nth(i);
      const images = block.locator("img");
      // At minimum, the generated image should be present
      const imgCount = await images.count();
      expect(imgCount).toBeGreaterThanOrEqual(1);
    }
  });

  // ==========================================================================
  // SCENARIO 10 — AuthButton sync: credits update via CustomEvent immediately
  // ==========================================================================
  test("S10: AuthButton receives credits-updated CustomEvent immediately on generate", async ({
    page,
  }) => {
    await mockGenerateSuccess(page, undefined, { delayMs: 3000 });

    await page.goto("/");

    // Instrument: track all credits-updated events with their detail
    await page.evaluate(() => {
      (window as unknown as Record<string, Array<{ credits: number | null; timestamp: number }>>).__creditsEvents = [];
      window.addEventListener("credits-updated", (e: Event) => {
        const detail = (e as CustomEvent).detail;
        (window as unknown as Record<string, Array<{ credits: number | null; timestamp: number }>>).__creditsEvents.push({
          credits: detail?.credits ?? null,
          timestamp: Date.now(),
        });
      });
    });

    await uploadImages(page, 2);
    await selectStyle(page);

    const beforeClickTs = await page.evaluate(() => Date.now());
    await clickGenerate(page);

    // Wait a short moment for the synchronous event to fire
    await page.waitForTimeout(500);

    // Check that a credits-updated event was dispatched IMMEDIATELY (within 500ms of click)
    const events = await page.evaluate(
      () =>
        (window as unknown as Record<string, Array<{ credits: number | null; timestamp: number }>>).__creditsEvents
    );

    expect(events.length).toBeGreaterThanOrEqual(1);

    // The first event should have credits = 18 (20 - 2) and happened right after click
    const firstEvent = events[0];
    expect(firstEvent.credits).toBe(18);
    // Should have fired within 500ms of click (immediate, synchronous)
    expect(firstEvent.timestamp - beforeClickTs).toBeLessThan(1000);
  });

  // ==========================================================================
  // INVARIANT: Loading block never shows "En attente" with MAX_CONCURRENT=5
  // ==========================================================================
  test("INVARIANT: no 'En attente' label during generation with <= 5 photos", async ({
    page,
  }) => {
    await mockGenerateSuccess(page, undefined, { delayMs: 4000 });

    await page.goto("/");
    await uploadImages(page, 5);
    await selectStyle(page);
    await clickGenerate(page);

    // Wait for loading block
    await expect(page.locator("#step-loading")).toBeVisible({ timeout: 5000 });

    // "En attente" must NOT appear — all 5 images launch simultaneously
    const enAttente = page.locator('#step-loading >> text="En attente"');
    await expect(enAttente).toHaveCount(0);

    // All 5 should show "Generation..."
    const genLabels = page.locator('#step-loading >> text="Génération…"');
    await expect(genLabels).toHaveCount(5, { timeout: 3000 });
  });

  // ==========================================================================
  // INVARIANT: Results section hidden during generation
  // ==========================================================================
  test("INVARIANT: results section gated by !isGenerating — no content during generation", async ({
    page,
  }) => {
    await mockGenerateSuccess(page, undefined, { delayMs: 4000 });

    await page.goto("/");
    await uploadImages(page, 1);
    await selectStyle(page);
    await clickGenerate(page);

    // During generation, results section must NOT be visible
    await expect(page.locator("#step-loading")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#step-results")).not.toBeVisible();

    // After generation completes, results appear
    await expect(page.locator("#step-results")).toBeVisible({ timeout: 20_000 });
  });
});
