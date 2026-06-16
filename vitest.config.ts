import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit/integration suite lives in src/ (*.test.ts). Keep vitest out of e2e/,
    // whose *.spec.ts files are Playwright tests with their own runner and deps.
    include: ["src/**/*.test.ts"],
  },
});
