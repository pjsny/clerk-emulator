import { randomBytes } from "node:crypto";
import type { RouteContext } from "../framework/index.js";
import { nowUnix } from "../helpers.js";
import { requireSecretKey, isAuthResponse } from "../route-helpers.js";

// POST /v1/testing_tokens — used by @clerk/testing's clerkSetup() to obtain a
// token that bypasses Clerk's bot protection during automated tests. The
// emulator has no bot protection, so the token is cosmetic: any value works.
// @clerk/testing's setupClerkTestingToken() then injects it as a
// __clerk_testing_token query param on Frontend API requests, which the
// emulator simply ignores. This makes existing @clerk/testing-based Playwright
// and Cypress suites run against the emulator unchanged.
export function testingTokenRoutes({ app, tokenMap }: RouteContext): void {
  app.post("/v1/testing_tokens", (c) => {
    const auth = requireSecretKey(c, tokenMap);
    if (isAuthResponse(auth)) return auth;
    return c.json({
      object: "testing_token",
      token: randomBytes(16).toString("hex"),
      expires_at: nowUnix() + 60 * 60,
    });
  });
}
