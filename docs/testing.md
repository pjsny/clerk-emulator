# Testing with clerk-emulator

Run the emulator (`npx clerk-emulator`, default `http://localhost:4000`) and point your
tests at it instead of the real Clerk API — no network, no credentials, no rate limits.

## Playwright + `@clerk/testing`

The emulator implements the testing-token endpoint that [`@clerk/testing`](https://www.npmjs.com/package/@clerk/testing)
relies on, so existing suites work unchanged. Point `@clerk/testing` at the emulator with
`CLERK_API_URL` (used to fetch the testing token) and `frontendApiUrl` (used by clerk-js).

```ts
// global.setup.ts — Playwright globalSetup
import { clerkSetup } from "@clerk/testing/playwright";

export default async function () {
  process.env.CLERK_API_URL = "http://localhost:4000"; // emulator, not api.clerk.com
  await clerkSetup({
    publishableKey: "pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ",
    frontendApiUrl: "http://localhost:4000",
  });
}
```

Set `CLERK_SECRET_KEY=sk_test_emulate` (any value the emulator's `tokens` map accepts). Then in a test:

```ts
import { test } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

test("authenticated flow", async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  // your app, with clerk-js pointed at the emulator via a relative proxyUrl
});
```

Cypress is analogous — call `clerkSetup()` in `cypress.config` and `setupClerkTestingToken()`
in a command (`@clerk/testing/cypress`), with the same `CLERK_API_URL` / `frontendApiUrl`.

For the clerk-js side, point the SDK at the emulator with a **relative** `proxyUrl` (clerk-js
forces `https` on absolute proxy URLs) and let your dev server forward it to the emulator.

### React (`@clerk/react` or `@clerk/clerk-react`)

```tsx
// main.tsx
import { ClerkProvider } from "@clerk/react"; // or "@clerk/clerk-react"

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey="pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ"
    proxyUrl="/__clerk"           // relative: clerk-js force-upgrades absolute proxy URLs to https
    clerkJSVersion="6.17.0"       // pin a full version; the floating @<major> range 301-redirects on the CDN
  >
    <App />
  </ClerkProvider>,
);
```

```ts
// vite.config.ts — forward the proxy path to the emulator
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/__clerk": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/__clerk/, ""),
      },
    },
  },
});
```

> Core 2 (`@clerk/clerk-react` v5) additionally requires the dev server to use **https** —
> clerk-js v5 force-upgrades the bundle URL. Add `@vitejs/plugin-basic-ssl` and run Playwright
> with `ignoreHTTPSErrors: true`. (Core 3 / v6 works over http.)

### Vanilla `@clerk/clerk-js`

```ts
import { Clerk } from "@clerk/clerk-js";

const clerk = new Clerk("pk_test_ZW11bGF0ZS5leGFtcGxlLmNvbSQ", { proxyUrl: "/__clerk" });
await clerk.load();
const res = await clerk.client.signIn.create({ identifier: "alice@example.com", strategy: "password", password: "alice123" });
await clerk.setActive({ session: res.createdSessionId });
```

See [`e2e/`](../e2e) for complete, runnable setups of all three.

## Backend SDK (server-side)

```ts
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: "sk_test_emulate", apiUrl: "http://localhost:4000" });
await clerk.users.createUser({ emailAddress: ["dev@example.com"], password: "supersecret123" });
```

## In-process (no separate server)

```ts
import { createServer, clerkPlugin } from "clerk-emulator";

const { app } = createServer(clerkPlugin, {
  tokens: { sk_test_emulate: { login: "admin", id: 1, scopes: [] } },
});
const res = await app.request("/v1/users", { headers: { Authorization: "Bearer sk_test_emulate" } });
```

## Persisting state

By default the store is in-memory and resets each run. To keep it across restarts:

```bash
npx clerk-emulator --persist ./clerk-state.json   # or CLERK_PERSIST=./clerk-state.json
```
