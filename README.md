# clerk-emulator

A local, offline emulator for [Clerk](https://clerk.com)'s Backend API (BAPI) and Frontend API (FAPI). Develop and test Clerk auth with no network, no cloud instance, and no rate limits — it signs real JWTs, so `@clerk/backend` and `clerk-js` work against it unmodified. Built on [Hono](https://hono.dev); state is in-memory and resets every run.

## Install

```bash
npm install --save-dev clerk-emulator
```

## Quick start

Run the server:

```bash
npx clerk-emulator
# Backend API:  http://localhost:4000
# Secret key:   sk_test_emulate
```

Configure via env: `PORT`, `HOST`, `CLERK_SECRET_KEY`, `CLERK_MACHINE_KEY`.

Point the backend SDK at it:

```ts
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: "sk_test_emulate", apiUrl: "http://localhost:4000" });
await clerk.users.createUser({ emailAddress: ["dev@example.com"], password: "supersecret123" });
```

Or run it in-process for tests (no separate server):

```ts
import { createServer, clerkPlugin } from "clerk-emulator";

const { app } = createServer(clerkPlugin, {
  tokens: { sk_test_emulate: { login: "admin", id: 1, scopes: [] } },
});
const res = await app.request("/v1/users", { headers: { Authorization: "Bearer sk_test_emulate" } });
```

`app` is a [Hono](https://hono.dev) app — call `app.request(...)` in-memory, or `serve({ fetch: app.fetch, port })` (`@hono/node-server`) to bind a port. For frontend apps, point clerk-js at the emulator with a relative `proxyUrl` (see `e2e/` for working React and vanilla setups).

## What's supported

Users, email addresses, organizations, memberships, invitations, and org domains (full CRUD); sessions and session tokens (with v1/v2 negotiation via `clerk-api-version` / `__clerk_api_version`); M2M tokens; OAuth 2.0 / OIDC (authorize, token, userinfo, JWKS); FAPI sign-in / MFA (TOTP) / sign-up flows; and Clerk-shaped webhooks.

Out of scope: social sign-in, passkeys, SAML / enterprise SSO, multi-session, billing, profile management.

## Compatibility

Verified in CI against:

| Surface | SDK | Versions | Clerk core |
|---|---|---|---|
| Frontend (React) | `@clerk/react` | 6.0.0, latest 6.x | Core 3 (Active) |
| Frontend (React) | `@clerk/clerk-react` | latest 5.x | Core 2 (LTS) |
| Frontend (vanilla) | `@clerk/clerk-js` | latest 5.x, 6.x | Core 2 (LTS), Core 3 |
| Backend | `@clerk/backend` | latest 2.x, 3.x | Core 3 |
| Runtime | Node.js | 20, 22, 24 | — |

Not yet tested: `@clerk/backend` 0.x (Core 2 LTS, pre-Core-3 API) and `@clerk/nextjs`.

## Tests

```bash
npm test             # unit + HTTP-integration (driven against a real server)
cd e2e && npm test    # browser e2e (Playwright, real clerk-js)
```

**Browser e2e** covers the end-user auth flows (password / email-code / MFA-TOTP sign-in, sign-up, org listing). Everything else — BAPI CRUD, M2M, OAuth/OIDC, webhooks, token versioning — is **HTTP-integration** tested against a live server, not through a browser.

## License & attribution

[Apache-2.0](./LICENSE). The framework under `src/framework/` is adapted from [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) (Apache-2.0) with its HTTP layer swapped for Hono — see [`NOTICE`](./NOTICE).

"Clerk" is a trademark of Clerk, Inc. This is an independent, unofficial tool — not affiliated with, endorsed by, or sponsored by Clerk, Inc.
