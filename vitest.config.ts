import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vitest config for Versimo unit tests.
 *
 * - jsdom environment for component-style assertions where needed
 * - alias `@/*` matches Next.js convention (tsconfig.json)
 * - excludes Playwright E2E specs
 * - excludes legacy node-assert tests (run via tsx, not vitest)
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    exclude: [
      "tests/e2e/**",
      "tests/unit/portal-formatter.test.ts", // legacy node:assert runner
      "tests/unit/crop-api.test.ts",
      "tests/unit/CropModal.test.tsx",
      "node_modules/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "**/*.d.ts"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
