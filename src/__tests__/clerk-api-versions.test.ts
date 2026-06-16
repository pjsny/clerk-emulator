import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodeJwt } from "jose";
import { getClerkStore } from "../index.js";
import { clerkTestSecretKey, startClerkTestEmulator, type ClerkTestEmulator } from "./helpers.js";

// The emulator negotiates the session-token version from the clerk-api-version
// header: v2 (nested `o` org claim + `v` claim) for API version 2025-04-10 and
// later, v1 (flat org_* claims) otherwise. Alice is seeded as an admin of the
// "acme" organization, so org claims are always present.
describe("Clerk API version negotiation (session token v1 vs v2)", () => {
  let emulator: ClerkTestEmulator;
  let aliceId: string;
  let sessionId: string;

  beforeAll(async () => {
    emulator = await startClerkTestEmulator();
    aliceId = getClerkStore(emulator.store)
      .users.all()
      .find((u) => u.first_name === "Alice")!.clerk_id;

    const res = await fetch(`${emulator.url}/v1/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${clerkTestSecretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: aliceId }),
    });
    sessionId = ((await res.json()) as { id: string }).id;
  });

  afterAll(async () => {
    await emulator?.close();
  });

  async function mintClaims(apiVersion?: string): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${clerkTestSecretKey}` };
    if (apiVersion) headers["clerk-api-version"] = apiVersion;
    const res = await fetch(`${emulator.url}/v1/sessions/${sessionId}/tokens`, { method: "POST", headers });
    const { jwt } = (await res.json()) as { jwt: string };
    return decodeJwt(jwt) as Record<string, unknown>;
  }

  it("emits a v1 token (flat org claims) when no clerk-api-version is sent", async () => {
    const claims = await mintClaims();
    expect(claims.v).toBeUndefined();
    expect(claims.o).toBeUndefined();
    expect(claims.org_id).toMatch(/^org_/);
    expect(claims.org_slug).toBe("acme");
    expect(Array.isArray(claims.org_permissions)).toBe(true);
  });

  it("emits a v1 token for API versions before 2025-04-10", async () => {
    const claims = await mintClaims("2024-10-01");
    expect(claims.v).toBeUndefined();
    expect(claims.org_id).toMatch(/^org_/);
  });

  for (const apiVersion of ["2025-04-10", "2025-11-10", "2026-05-12"]) {
    it(`emits a v2 token (nested o claim) for API version ${apiVersion}`, async () => {
      const claims = await mintClaims(apiVersion);
      expect(claims.v).toBe(2);
      expect(claims.org_id).toBeUndefined();
      expect(claims.org_role).toBeUndefined();

      const o = claims.o as Record<string, unknown>;
      expect(o).toBeDefined();
      expect(o.id).toMatch(/^org_/);
      expect(o.slg).toBe("acme");
      expect(typeof o.rol).toBe("string");
      expect(o.rol).not.toMatch(/^org:/); // v2 strips the "org:" prefix
      expect(typeof o.per).toBe("string"); // comma-separated, not an array

      // Standard claims are preserved across versions.
      expect(claims.sub).toBe(aliceId);
      expect(claims.sid).toBe(sessionId);
    });
  }
});
