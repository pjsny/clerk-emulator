# clerk-emulator

**A local, offline emulator for [Clerk](https://clerk.com)'s Backend API and Frontend API (FAPI).** Develop and test Clerk authentication on your machine — no network, no cloud instance, no rate limits. It signs **real JWTs**, so the official `@clerk/backend` SDK talks to it unmodified.

> Run a fake Clerk server locally for development and integration tests: mock Clerk users, organizations, sessions, M2M tokens, OAuth, and webhooks — all in memory.

---

## Why

The hosted Clerk API is great in production but awkward for local dev and CI: it needs network access, real credentials, and shared state that tests trip over. `clerk-emulator` gives you a throwaway, in-memory Clerk that:

- starts in milliseconds and resets to a clean slate every run,
- needs no Clerk account, API key, or internet connection,
- signs session tokens with a real RSA keypair, so token verification in the SDK actually passes,
- is byte-compatible enough that the official **`@clerk/backend`** SDK works against it (the test suite proves it).

## Features

- **Backend API (BAPI)** — users, email addresses, organizations, memberships, invitations, organization domains, sessions.
- **Frontend API (FAPI)** — `/v1/environment`, `/v1/client`, session-token minting for browser flows.
- **Machine-to-machine (M2M) tokens** — create and verify `ak_`-style machine tokens.
- **OAuth / OpenID Connect** — authorize, token, userinfo, JWKS, and a rendered consent screen.
- **Webhooks** — emits Clerk-shaped events (e.g. `user.created`, `organization.created`) to your endpoint.
- **Real JWT signing** with `jose` — `verifyToken` / `authenticateRequest` from `@clerk/backend` succeed.
- **API version negotiation** — honors the `clerk-api-version` header and mints session-token **v1** (flat `org_*` claims) or **v2** (nested `o` claim + `v`, for API version `2025-04-10`+) accordingly.
- **Minimal dependencies** — built on [Hono](https://hono.dev); no database, no Docker.

## Install

```bash
npm install --save-dev clerk-emulator
# or: pnpm add -D clerk-emulator
```

## Quick start

### Run the server (CLI)

```bash
npx clerk-emulator
```

```
  clerk-emulator is running
  Backend API:  http://localhost:4000
  Secret key:   sk_test_emulate
```

Configure via env vars: `PORT`, `HOST`, `CLERK_SECRET_KEY`, `CLERK_MACHINE_KEY`.

### Point the Clerk SDK at it

```ts
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({
  secretKey: "sk_test_emulate",
  apiUrl: "http://localhost:4000",
});

const user = await clerk.users.createUser({
  emailAddress: ["dev@example.com"],
  password: "supersecret123",
});
```

### Use it directly in tests (no separate process)

```ts
import { createServer, clerkPlugin } from "clerk-emulator";

const { app } = createServer(clerkPlugin, {
  tokens: { sk_test_emulate: { login: "admin", id: 1, scopes: [] } },
});

const res = await app.request("http://localhost/v1/users", {
  headers: { Authorization: "Bearer sk_test_emulate" },
});
```

`app` is a standard [Hono](https://hono.dev) app — use `app.request(...)` for in-memory requests, or `serve({ fetch: app.fetch, port })` from `@hono/node-server` to bind a port.

## Status & compatibility

This emulates the slices of the Clerk API most used in app development and testing. It is **not** a complete reimplementation of Clerk, and response shapes track the API versions exercised by the test suite. PRs to widen coverage are welcome.

### What's emulated

| Capability | Endpoints | Coverage |
|---|---|---|
| Users — CRUD, ban/lock, metadata, verify password | `/v1/users*` | HTTP integration |
| Email addresses — CRUD | `/v1/email_addresses*` | HTTP integration |
| Organizations — CRUD, metadata | `/v1/organizations*` | HTTP integration |
| Organization memberships | `/v1/organizations/:id/memberships*` | HTTP integration + browser e2e |
| Invitations — create / list / revoke / bulk | `/v1/organizations/:id/invitations*` | HTTP integration |
| Organization domains — CRUD | `/v1/organizations/:id/domains*` | HTTP integration |
| Sessions + session tokens | `/v1/sessions*` | HTTP integration + browser e2e |
| Session token v1/v2 negotiation (`clerk-api-version` / `__clerk_api_version`) | token endpoints | HTTP integration |
| Machine-to-machine (M2M) tokens | `/m2m_tokens*` | HTTP integration |
| OAuth 2.0 / OIDC — authorize, token, userinfo, JWKS | `/oauth/*`, `/.well-known/*`, `/v1/jwks` | HTTP integration |
| FAPI sign-in — password, email code | `/v1/client/sign_ins*` | browser e2e |
| FAPI MFA — TOTP | `/v1/client/sign_ins/:id/attempt_second_factor` | browser e2e |
| FAPI sign-up | `/v1/client/sign_ups*` | browser e2e |
| FAPI environment / client / dev browser | `/v1/environment`, `/v1/client`, `/v1/dev_browser` | HTTP integration + browser e2e |
| Webhooks — resource events | configured endpoints | HTTP integration |
| `authenticateRequest` / `verifyToken` | token verification | HTTP integration (`@clerk/backend`) |

### Tested SDK & runtime versions (CI matrix)

| Surface | SDK | Versions | Clerk core | How |
|---|---|---|---|---|
| Frontend (React) | `@clerk/react` | 6.0.0, latest 6.x | Core 3 (Active) | Browser e2e |
| Frontend (React) | `@clerk/clerk-react` | latest 5.x | Core 2 (LTS) | Browser e2e |
| Frontend (vanilla) | `@clerk/clerk-js` | latest 6.x, 5.x | Core 3, Core 2 (LTS) | Browser e2e |
| Backend | `@clerk/backend` | latest 2.x, 3.x | Core 3 | HTTP integration |
| Runtime | Node.js | 20, 22, 24 | — | Unit + integration |

Clerk session token JWT v2 (nested `o` org claim + a `v` claim) shipped with API version `2025-04-10`; the emulator mints v2 for `2025-04-10`+ and v1 otherwise, negotiated from the `clerk-api-version` header (backend SDKs) or `__clerk_api_version` query param (clerk-js). This is covered across the `2025-04-10`, `2025-11-10`, and `2026-05-12` API versions.

### Is everything e2e tested?

There are two layers of coverage, and together they exercise the whole table above against a **running** emulator:

- **Browser e2e** (Playwright with real clerk-js / React / vanilla) covers the end-user auth flows: password / email-code / MFA-TOTP sign-in, sign-up, and org-membership listing.
- **HTTP integration** (the test suite runs against a real `@hono/node-server`, driven by `@clerk/backend` and raw `fetch`) covers the rest — BAPI CRUD, M2M, OAuth/OIDC, webhooks, organization domains, and session-token versioning.

So every capability the emulator offers is tested against a live server; the admin/BAPI operations are HTTP-integration tested rather than driven through a browser.

### Not yet covered

- **Core 2 (LTS) backend SDK** — `@clerk/backend` 0.x uses the pre-Core-3 API (array pagination, no `m2m`) and would need a separate test variant.
- **`@clerk/nextjs`** — not exercised (neither Core 2 nor Core 3).
- Social / OAuth sign-in, passkeys, SAML / enterprise SSO, multi-session, billing, and user-profile management are out of scope.

## Tests

```bash
npm test                  # unit + HTTP-integration suite (Node)
cd e2e && npm test         # browser e2e (Playwright) — defaults to the @clerk/react cell
```

Browser e2e runs as a CI matrix across the frontend SDKs in the table above. The React cells pin a full `clerkJSVersion` (overridable via `VITE_CLERK_JS_VERSION`) so the clerk-js bundle loads at an exact version rather than a floating `@<major>` range (which the CDN serves via a redirect chain); the emulator's clerk-js proxy also caches it in memory. The vanilla cell bundles clerk-js, so it needs no CDN fetch at all.

## Acknowledgements

The framework under `src/framework/` is adapted from the excellent
[`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) project (Apache-2.0),
with its custom HTTP layer swapped for Hono. See [`NOTICE`](./NOTICE).

## Disclaimer

"Clerk" is a trademark of Clerk, Inc. This is an independent, **unofficial** tool for
local development and testing. It is not affiliated with, endorsed by, or sponsored by Clerk, Inc.

## License

[Apache-2.0](./LICENSE)
