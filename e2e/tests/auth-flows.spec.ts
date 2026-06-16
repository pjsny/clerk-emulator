import { test, expect, type Page } from "@playwright/test";

// Real clerk-js sign-in/sign-up flows, driven through a browser against the
// emulator's Frontend API (FAPI). Mirrors the seeded fixtures in the CLI:
//   alice@example.com / alice123      (member of "Acme Corp")
//   bob@example.com                   (email-code only)
//   mfa@example.com / mfa12345        (TOTP enabled)
// The emulator accepts 424242 as the magic verification code.

// Tests run serially in one worker. The emulator's session store is global and
// persists across browser contexts, so each test starts by signing out (the
// emulator may still report an active session from the previous flow).
test.describe.configure({ mode: "serial" });

async function gotoSignedOut(page: Page) {
  await page.goto("/");
  // The app shows "Loading Clerk..." until clerk-js initializes, then the <h1>.
  await expect(page.locator("h1")).toBeVisible({ timeout: 20_000 });
  // Wait for clerk to resolve auth state: either the sign-in forms or the panel.
  await page
    .locator("[data-testid=pw-submit], [data-testid=sign-out]")
    .first()
    .waitFor({ timeout: 20_000 });
  const signOut = page.locator("[data-testid=sign-out]");
  if (await signOut.count()) {
    await signOut.click();
    await expect(page.locator("[data-testid=pw-submit]")).toBeVisible({ timeout: 10_000 });
  }
}

test("password sign-in shows the user and their org memberships", async ({ page }) => {
  await gotoSignedOut(page);
  await page.fill("[data-testid=pw-email]", "alice@example.com");
  await page.fill("[data-testid=pw-password]", "alice123");
  await page.click("[data-testid=pw-submit]");

  await expect(page.locator("[data-testid=signed-in]")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("body")).toContainText("Alice");
  await expect(page.locator("[data-testid=org-list]")).toContainText("Acme Corp", { timeout: 8_000 });
});

test("email-code (OTP) sign-in completes", async ({ page }) => {
  await gotoSignedOut(page);
  await page.fill("[data-testid=otp-email]", "bob@example.com");
  await page.click("[data-testid=otp-send]");
  await page.fill("[data-testid=otp-code]", "424242");
  await page.click("[data-testid=otp-verify]");

  await expect(page.locator("[data-testid=signed-in]")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("body")).toContainText("Bob");
});

test("password sign-in prompts for MFA and completes with TOTP", async ({ page }) => {
  await gotoSignedOut(page);
  await page.fill("[data-testid=pw-email]", "mfa@example.com");
  await page.fill("[data-testid=pw-password]", "mfa12345");
  await page.click("[data-testid=pw-submit]");

  await expect(page.locator("[data-testid=mfa-code]")).toBeVisible({ timeout: 12_000 });
  await page.fill("[data-testid=mfa-code]", "424242");
  await page.click("[data-testid=mfa-submit]");

  await expect(page.locator("[data-testid=signed-in]")).toBeVisible({ timeout: 15_000 });
});

test("sign-up with email verification completes", async ({ page }) => {
  await gotoSignedOut(page);
  await page.click("[data-testid=su-create]");
  await page.fill("[data-testid=su-code]", "424242");
  await page.click("[data-testid=su-verify]");

  await expect(page.locator("[data-testid=signed-in]")).toBeVisible({ timeout: 15_000 });
});
