/**
 * Playwright fixture: authenticatedPage
 *
 * Provides a Page that simulates a logged-in NextAuth session by mocking
 * the endpoints that the client-side useSession() hook and AuthButton
 * component rely on:
 *
 *   - GET  /api/auth/session  → returns a fake session payload
 *   - GET  /api/user/credits  → returns a fake credits payload
 *
 * This avoids the need for real OAuth flows or signed JWT cookies in E2E.
 * It only works for tests that exercise client-side gates (UI conditionals
 * on session presence, credits display, buy buttons that check session.user.id).
 *
 * Server-side route handlers (e.g. /api/stripe/checkout, /api/generate)
 * still call getServerSession() and will see no session — those routes
 * MUST be mocked separately via page.route() in the test itself.
 */
import { test as base, expect, type Page } from "@playwright/test";

export type MockUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

export type MockSessionOptions = {
  user?: Partial<MockUser>;
  credits?: number;
  hasPro?: boolean;
  hasStarter?: boolean;
  expiresInMs?: number;
};

const DEFAULT_USER: MockUser = {
  id: "test-user-id",
  email: "test@versimo.fr",
  name: "Test User",
  image: null,
};

/**
 * Install NextAuth session + credits mocks on a page.
 * Exposed as a standalone helper so tests can call it on a non-fixture page
 * if they need to (e.g. multi-page contexts).
 */
export async function installSessionMocks(
  page: Page,
  options: MockSessionOptions = {}
): Promise<void> {
  const user: MockUser = { ...DEFAULT_USER, ...(options.user ?? {}) };
  const credits = options.credits ?? 5;
  const hasPro = options.hasPro ?? false;
  const hasStarter = options.hasStarter ?? false;
  const expiresAt = new Date(
    Date.now() + (options.expiresInMs ?? 3_600_000)
  ).toISOString();

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user,
        expires: expiresAt,
      }),
    });
  });

  await page.route("**/api/user/credits", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        credits,
        hasPro,
        hasStarter,
      }),
    });
  });
}

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Extended test object: import { test } from "./fixtures/auth-fixture"
 * instead of @playwright/test, then use `authenticatedPage` parameter.
 *
 * The fixture installs session mocks BEFORE any navigation, so the very
 * first page.goto() call will see an authenticated session.
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await installSessionMocks(page);
    await use(page);
  },
});

export { expect };
