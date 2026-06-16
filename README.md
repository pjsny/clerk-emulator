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

## How it works

The HTTP layer is the real **Hono** framework. Everything else — an in-memory store, a webhook dispatcher, secret-key auth, and JWT signing — lives in `src/framework/` with no third-party runtime dependency beyond `hono`, `@hono/node-server`, and `jose`. State is held in memory and discarded when the process exits, so every test run is isolated.

**Session token versions.** Clerk's API is versioned by date, and session token JWT v2 (nested `o` org claim + a `v` claim) shipped with API version `2025-04-10`. The session-token endpoints read the `clerk-api-version` request header and mint v2 for `2025-04-10` or later, v1 (flat `org_id`/`org_role`/`org_slug`/`org_permissions`) otherwise. Absent the header the emulator defaults to v1 for backward compatibility. The negotiation is covered by parametrized tests across the current API versions (`2025-04-10`, `2025-11-10`, `2026-05-12`).

## Status & compatibility

This emulates the slices of the Clerk API most used in app development and testing. It is **not** a complete reimplementation of Clerk, and response shapes track the API versions exercised by the test suite. PRs to widen coverage are welcome.

## Tests

Two suites, both run in CI:

```bash
npm test                 # unit + integration: runs @clerk/backend over a real HTTP server
cd e2e && npm test        # browser e2e: real clerk-js in Chromium against the FAPI (Playwright)
```

The browser e2e drives a React + `clerk-js` frontend (`e2e/frontend`) through password,
email-code (OTP), MFA/TOTP, and sign-up flows against the running emulator.

## Acknowledgements

The framework under `src/framework/` is adapted from the excellent
[`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) project (Apache-2.0),
with its custom HTTP layer swapped for Hono. See [`NOTICE`](./NOTICE).

## Disclaimer

"Clerk" is a trademark of Clerk, Inc. This is an independent, **unofficial** tool for
local development and testing. It is not affiliated with, endorsed by, or sponsored by Clerk, Inc.

## License

[Apache-2.0](./LICENSE)
