# Changelog

## 1.0.0

Initial release.

### Backend API (BAPI)

- Users — full CRUD, ban / unban, lock / unlock, public/private metadata, verify password.
- Email addresses — CRUD.
- Organizations — CRUD and metadata.
- Organization memberships — add, list, update role, remove.
- Invitations — create, list, revoke, bulk.
- Organization domains — CRUD.
- Sessions and session tokens, with **v1/v2 negotiation** from the `clerk-api-version`
  header or `__clerk_api_version` query param (v2 for API version `2025-04-10`+).
- Machine-to-machine (M2M) tokens — create, verify, revoke.
- OAuth 2.0 / OIDC — authorize, token, userinfo, JWKS, OpenID configuration.
- Webhooks — emits Clerk-shaped resource events.
- `authenticateRequest` / `verifyToken` work against the emulator (real RSA-signed JWTs).

### Frontend API (FAPI)

- Sign-in (password, email code), MFA (TOTP), and sign-up flows.
- `environment`, `client`, and dev-browser endpoints; clerk-js bundle proxy.

### Testing & tooling

- **`@clerk/testing` compatible** — `POST /v1/testing_tokens` and the
  `__clerk_testing_token` query param are supported, so existing `@clerk/testing`
  Playwright/Cypress suites run against the emulator.
- `--persist <file>` (or `CLERK_PERSIST`) keeps the in-memory store on disk across restarts.
- CLI (`clerk-emulator`) with seeded fixtures; programmatic `createServer(clerkPlugin)`.

### Internals

- Built on [Hono](https://hono.dev); only runtime dependencies are `hono`,
  `@hono/node-server`, and `jose`. Framework adapted from
  [`vercel-labs/emulate`](https://github.com/vercel-labs/emulate) (Apache-2.0).
- CI: unit + HTTP-integration on Node 20/22/24; browser e2e against `@clerk/react` 6,
  `@clerk/clerk-react` 5, and vanilla `@clerk/clerk-js` 5/6; backend SDK matrix across
  `@clerk/backend` 2.x/3.x.
