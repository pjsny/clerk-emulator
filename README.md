# clerk-emulator

[![CI](https://github.com/pjsny/clerk-emulator/actions/workflows/ci.yml/badge.svg)](https://github.com/pjsny/clerk-emulator/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/clerk-emulator)](https://www.npmjs.com/package/clerk-emulator)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Socket Badge](https://socket.dev/api/badge/npm/package/clerk-emulator)](https://socket.dev/npm/package/clerk-emulator)

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

Configure via env: `PORT`, `HOST`, `CLERK_SECRET_KEY`, `CLERK_MACHINE_KEY`. Add `--persist <file>` (or `CLERK_PERSIST`) to keep state across restarts.

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

`app` is a [Hono](https://hono.dev) app — call `app.request(...)` in-memory, or `serve({ fetch: app.fetch, port })` (`@hono/node-server`) to bind a port.

Point the frontend (clerk-js) at it: set a **relative** `proxyUrl` so clerk-js sends Frontend API calls to a path your dev server forwards to the emulator (clerk-js forces `https` on _absolute_ proxy URLs, so it must be relative). Pin `clerkJSVersion` to skip the floating `@<major>` CDN redirect.

```tsx
// React entry
<ClerkProvider publishableKey="pk_test_..." proxyUrl="/__clerk" clerkJSVersion="6.17.0">
```

```ts
// vite.config.ts — forward the proxy path to the emulator
server: {
  proxy: {
    "/__clerk": { target: "http://localhost:4000", changeOrigin: true, rewrite: (p) => p.replace(/^\/__clerk/, "") },
  },
}
```

Vanilla clerk-js is the same idea: `new Clerk(pk, { proxyUrl: "/__clerk" })`. See [`e2e/`](./e2e) for complete React, `@clerk/clerk-react`, and vanilla setups.

## What's supported

| Capability | Details |
|---|---|
| Users & email addresses | full CRUD, ban / lock, metadata, verify password |
| Organizations | CRUD, memberships, invitations, domains |
| Sessions & tokens | session CRUD, JWT minting, v1/v2 negotiation (`clerk-api-version` / `__clerk_api_version`) |
| M2M tokens | create, verify, revoke |
| OAuth 2.0 / OIDC | authorize, token, userinfo, JWKS |
| Frontend API (FAPI) | sign-in, MFA (TOTP), sign-up |
| Webhooks | Clerk-shaped resource events |
| Testing tokens | `@clerk/testing` compatible — `POST /v1/testing_tokens`, `__clerk_testing_token` |
| _Out of scope_ | social sign-in, passkeys, SAML / enterprise SSO, multi-session, billing, profile management |

## Compatibility

Verified in CI against:

| Surface | SDK | Versions | Clerk core |
|---|---|---|---|
| Frontend (React) | `@clerk/react` | latest 6.x | Core 3 (Active) |
| Frontend (React) | `@clerk/clerk-react` | latest 5.x | Core 2 (LTS) |
| Frontend (vanilla) | `@clerk/clerk-js` | latest 5.x, 6.x | Core 2 (LTS), Core 3 |
| Backend | `@clerk/backend` | latest 2.x, 3.x | Core 3 |
| Runtime | Node.js | 20, 22, 24 | — |

Not yet tested: `@clerk/backend` 0.x (Core 2 LTS, pre-Core-3 API) and `@clerk/nextjs`.

## Tests

```bash
npm test             # unit + integration (Node, against a real server)
cd e2e && npm test   # browser e2e (Playwright, real clerk-js)
```

| Layer | Covers |
|---|---|
| Browser e2e — Playwright + clerk-js | sign-in (password / email-code / MFA-TOTP), sign-up, org listing |
| SDK e2e — `@clerk/backend` over HTTP | admin lifecycle: users, organizations, memberships, invitations, domains, M2M |
| HTTP integration — raw requests | OAuth / OIDC, webhooks, session-token v1/v2 negotiation |

Browser e2e and the backend SDK run across the version matrix in [Compatibility](#compatibility). See [`docs/testing.md`](./docs/testing.md) for Playwright/Cypress (`@clerk/testing`), backend-SDK, and in-process setups.

## License & attribution

[Apache-2.0](./LICENSE). The framework under `src/framework/` is adapted from [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) (Apache-2.0) with its HTTP layer swapped for Hono — see [`NOTICE`](./NOTICE).

"Clerk" is a trademark of Clerk, Inc. This is an independent, unofficial tool — not affiliated with, endorsed by, or sponsored by Clerk, Inc.
