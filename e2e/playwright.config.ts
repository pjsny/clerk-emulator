import { defineConfig, devices } from "@playwright/test";

// The browser e2e drives a real React + clerk-js frontend (e2e/frontend) against
// the emulator. Two servers are booted automatically:
//   1. the emulator CLI on EMULATOR_PORT (serves BAPI + FAPI + the clerk-js proxy)
//   2. the Vite dev server on APP_PORT, which proxies /__clerk/* to the emulator
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
    baseURL: `http://localhost:${APP_PORT}`,
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
      cwd: "frontend",
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
