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

| Capability | Details |
|---|---|
| Users & email addresses | full CRUD, ban / lock, metadata, verify password |
| Organizations | CRUD, memberships, invitations, domains |
| Sessions & tokens | session CRUD, JWT minting, v1/v2 negotiation (`clerk-api-version` / `__clerk_api_version`) |
| M2M tokens | create, verify, revoke |
| OAuth 2.0 / OIDC | authorize, token, userinfo, JWKS |
| Frontend API (FAPI) | sign-in, MFA (TOTP), sign-up |
| Webhooks | Clerk-shaped resource events |
| _Out of scope_ | social sign-in, passkeys, SAML / enterprise SSO, multi-session, billing, profile management |

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
npm test             # unit + integration (Node, against a real server)
cd e2e && npm test   # browser e2e (Playwright, real clerk-js)
```

| Layer | Covers |
|---|---|
| Browser e2e — Playwright + clerk-js | sign-in (password / email-code / MFA-TOTP), sign-up, org listing |
| SDK e2e — `@clerk/backend` over HTTP | admin lifecycle: users, organizations, memberships, invitations, domains, M2M |
| HTTP integration — raw requests | OAuth / OIDC, webhooks, session-token v1/v2 negotiation |

Browser e2e and the backend SDK run across the version matrix in [Compatibility](#compatibility).

## License & attribution

[Apache-2.0](./LICENSE). The framework under `src/framework/` is adapted from [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) (Apache-2.0) with its HTTP layer swapped for Hono — see [`NOTICE`](./NOTICE).

"Clerk" is a trademark of Clerk, Inc. This is an independent, unofficial tool — not affiliated with, endorsed by, or sponsored by Clerk, Inc.
