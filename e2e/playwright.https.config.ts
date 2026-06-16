import { defineConfig, devices } from "@playwright/test";

// Config for the Core 2 (@clerk/clerk-react v5) cell. clerk-js v5 force-upgrades
// the bundle URL to https, so the Vite dev server (frontend-v5) serves https via
// @vitejs/plugin-basic-ssl and Playwright runs with ignoreHTTPSErrors. Same test
// suite as the v6 config; only the frontend and scheme differ.
const EMULATOR_PORT = 4900;
const APP_PORT = 5173;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `https://localhost:${APP_PORT}`,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node ../dist/cli.js",
      env: { PORT: String(EMULATOR_PORT), HOST: "127.0.0.1" },
      port: EMULATOR_PORT,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      cwd: "frontend-v5",
      url: `https://localhost:${APP_PORT}`,
      ignoreHTTPSErrors: true,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
