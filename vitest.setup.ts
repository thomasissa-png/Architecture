/**
 * Global setup for Vitest unit tests.
 *
 * - Loads jest-dom matchers (toBeInTheDocument, toHaveClass, etc.)
 * - Provides minimal global mocks needed by Next.js / browser APIs
 *   that jsdom does not implement.
 */
import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";

// Mock fetch by default — individual tests override with vi.spyOn / vi.fn
if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = vi.fn();
}

// jsdom does not implement matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Default safe env vars for tests (override per-test if needed)
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""; // empty by default = fail-open path

afterEach(() => {
  vi.restoreAllMocks();
});
