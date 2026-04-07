/**
 * Session 36 — Results grid 2-cols layout matrix verification
 *
 * Bug context: on desktop, the results section used to render each visual
 * full-width (max-w-4xl ≈ 896px) via `space-y-10`, forcing the user to scroll
 * to see the bottom of a portrait image. The fix (page.tsx ligne 2606)
 * replaces the stack by a `grid grid-cols-1 sm:grid-cols-2` for multi-photo
 * generations, mirroring the loading-tile grid (page.tsx ligne 2391).
 *
 * This spec verifies the fix across the matrix:
 *   - Number of visuals: 1, 2, 3 photos
 *   - Viewports: iPhone 13 (375), iPad (768), Desktop (1280)
 *   - Account-type-agnostic (the wrapper has zero session conditional —
 *     verified via grep on lines 2400-2610)
 *
 * Strategy:
 *   - Mock /api/generate so we never hit OpenAI
 *   - Assert (a) the Tailwind class string on `results-grid-container`,
 *     (b) the bounding box width of the first tile to confirm 2-col layout
 *     produces ~half-width tiles on desktop multi-photo.
 *
 * Runtime: Replit deployed env. Local exec only verifies parsing/typing.
 */
import { test, expect } from "@playwright/test";
import {
  mockGenerationHappyPath,
  uploadPhotos,
  selectFirstStyle,
} from "./_helpers";

const VIEWPORTS = {
  mobile: { width: 375, height: 812, name: "iPhone 13" },
  tablet: { width: 768, height: 1024, name: "iPad Mini" },
  desktop: { width: 1280, height: 800, name: "Desktop 1280" },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

async function runGenerationFlow(page: import("@playwright/test").Page, photoCount: number) {
  mockGenerationHappyPath(page);
  await page.goto("/");
  await uploadPhotos(page, photoCount);
  await expect(page.locator("#step-style")).toBeVisible({ timeout: 5_000 });
  await selectFirstStyle(page);

  const stepSpaceType = page.locator("#step-space-type");
  if (await stepSpaceType.isVisible().catch(() => false)) {
    const first = stepSpaceType
      .locator("button")
      .filter({ hasNotText: /Int.rieur|Ext.rieur/ })
      .first();
    if (await first.isVisible().catch(() => false)) await first.click();
  }

  await page.locator("#step-generate").locator("button").click();
  await expect(page.locator("#step-results")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("result-tile-0")).toBeVisible({ timeout: 15_000 });
}

test.describe("Session 36 — Results grid layout matrix", () => {
  test.setTimeout(90_000);

  // ─── Single photo: must always be 1 column (no grid-cols-2) ───
  for (const key of Object.keys(VIEWPORTS) as ViewportKey[]) {
    const vp = VIEWPORTS[key];
    test(`1 photo / ${vp.name} → grid-cols-1 only (single column)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await runGenerationFlow(page, 1);

      const container = page.getByTestId("results-grid-container");
      await expect(container).toBeVisible();

      const cls = (await container.getAttribute("class")) ?? "";
      expect(cls).toContain("grid");
      expect(cls).toContain("grid-cols-1");
      // CRITICAL: single-photo branch must NOT contain sm:grid-cols-2
      expect(cls).not.toContain("sm:grid-cols-2");
      expect(cls).toContain("sm:max-w-xl");
      expect(cls).toContain("lg:max-w-2xl");
    });
  }

  // ─── Multi-photo (2 and 3) — must apply sm:grid-cols-2 ───
  for (const photoCount of [2, 3] as const) {
    for (const key of Object.keys(VIEWPORTS) as ViewportKey[]) {
      const vp = VIEWPORTS[key];
      test(`${photoCount} photos / ${vp.name} → grid-cols-1 sm:grid-cols-2 + max-w-4xl`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await runGenerationFlow(page, photoCount);

        const container = page.getByTestId("results-grid-container");
        await expect(container).toBeVisible();

        const cls = (await container.getAttribute("class")) ?? "";
        // Multi-photo must use the 2-column branch
        expect(cls).toContain("grid");
        expect(cls).toContain("grid-cols-1");
        expect(cls).toContain("sm:grid-cols-2");
        expect(cls).toContain("sm:max-w-3xl");
        expect(cls).toContain("lg:max-w-4xl");
        // Bug fix: must NOT contain space-y-10 (the old stack class)
        expect(cls).not.toContain("space-y-10");

        // ─── Tile width sanity check (visual confirmation) ───
        // For multi-photo on tablet/desktop, the first tile should NOT span
        // full container width. We assert tile width < container width × 0.7
        // (in 2-col layout, each tile ≈ container.width / 2 minus gap).
        if (vp.width >= 768) {
          const containerBox = await container.boundingBox();
          const tile0 = page.getByTestId("result-tile-0");
          const tile0Box = await tile0.boundingBox();
          expect(containerBox).not.toBeNull();
          expect(tile0Box).not.toBeNull();
          if (containerBox && tile0Box) {
            const ratio = tile0Box.width / containerBox.width;
            // 2-col layout: tile ≈ 0.45-0.5 of container. Strict: < 0.6.
            expect(ratio).toBeLessThan(0.6);
          }
        } else {
          // Mobile (< 640px): sm: breakpoint not active, single column.
          // Tile should span ~full container width (allow 90%+).
          const containerBox = await container.boundingBox();
          const tile0Box = await page.getByTestId("result-tile-0").boundingBox();
          if (containerBox && tile0Box) {
            const ratio = tile0Box.width / containerBox.width;
            expect(ratio).toBeGreaterThan(0.9);
          }
        }
      });
    }
  }

  // ─── Account-type-agnostic regression guard ───
  test("results-grid-container has no session-dependent wrapper (anonymous flow)", async ({
    page,
  }) => {
    // No auth fixture used here on purpose — verifies the grid renders
    // identically for anonymous users (no session mocks installed).
    await page.setViewportSize({ width: 1280, height: 800 });
    await runGenerationFlow(page, 2);

    const container = page.getByTestId("results-grid-container");
    await expect(container).toBeVisible();
    const cls = (await container.getAttribute("class")) ?? "";
    expect(cls).toContain("sm:grid-cols-2");
  });
});
