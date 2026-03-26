import { test, expect } from "@playwright/test";

// DATA-TESTID NEEDED: none for this file.
// Tests use semantic HTML attributes (aria-label, role, etc.).

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("all buttons have accessible text (aria-label or text content)", async ({
    page,
  }) => {
    // Get all visible buttons on the page
    const buttons = page.locator("button:visible");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      // Button should have either:
      // 1. Non-empty text content, OR
      // 2. An aria-label attribute
      const textContent = (await button.textContent())?.trim() || "";
      const ariaLabel = await button.getAttribute("aria-label");

      const hasAccessibleText = textContent.length > 0 || (ariaLabel && ariaLabel.length > 0);

      if (!hasAccessibleText) {
        // Get some context for debugging
        const outerHTML = await button.evaluate((el) =>
          el.outerHTML.substring(0, 200)
        );
        expect(
          hasAccessibleText,
          `Button without accessible text found: ${outerHTML}`
        ).toBeTruthy();
      }
    }
  });

  test("keyboard navigation works (Tab between interactive elements)", async ({
    page,
  }) => {
    // Tab into the page from the top
    await page.keyboard.press("Tab");

    // First focusable element should be in the header (skip-to-content or first link)
    const firstFocused = page.locator(":focus");
    await expect(firstFocused).toBeVisible();

    // Tab a few more times — each Tab should move focus to a different element
    const focusedElements: string[] = [];

    for (let i = 0; i < 5; i++) {
      const tagName = await page.evaluate(() =>
        document.activeElement?.tagName?.toLowerCase()
      );
      const href = await page.evaluate(() =>
        (document.activeElement as HTMLAnchorElement)?.href || ""
      );
      focusedElements.push(`${tagName}:${href}`);
      await page.keyboard.press("Tab");
    }

    // Should have visited at least 3 different elements
    const uniqueElements = new Set(focusedElements);
    expect(uniqueElements.size).toBeGreaterThanOrEqual(3);
  });

  test("focus-visible ring is shown on interactive elements", async ({
    page,
  }) => {
    // Tab to the first interactive element
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // The focused element should have a focus ring (via focus-visible:ring or outline)
    const focusedElement = page.locator(":focus-visible");
    const count = await focusedElement.count();

    // There should be at least one element with :focus-visible
    expect(count).toBeGreaterThanOrEqual(1);

    // Check that focus-visible styles are applied (the app uses focus-visible:ring-2)
    const hasRingOrOutline = await page.evaluate(() => {
      const el = document.querySelector(":focus-visible");
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      // Check for outline or box-shadow (Tailwind ring = box-shadow)
      const hasOutline =
        styles.outlineStyle !== "none" && styles.outlineWidth !== "0px";
      const hasBoxShadow =
        styles.boxShadow !== "none" && styles.boxShadow !== "";
      return hasOutline || hasBoxShadow;
    });

    expect(
      hasRingOrOutline,
      "Focused element should have a visible focus ring (outline or box-shadow)"
    ).toBeTruthy();
  });
});
