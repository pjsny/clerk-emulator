import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClerkClient } from "@clerk/backend";
import { clerkTestSecretKey, startClerkTestEmulator, type ClerkTestEmulator } from "./helpers.js";

// "True professional" e2e for the admin/BAPI surface: drive the full lifecycle
// through the real @clerk/backend SDK (not raw fetch) against a real HTTP server.
// This is exactly how the Backend API is consumed in production (server-side, no
// browser), so it validates the emulator against the SDK's real request building
// and response parsing. Runs across the @clerk/backend version matrix in CI.
describe("Backend SDK lifecycle e2e (@clerk/backend over HTTP)", () => {
  let emulator: ClerkTestEmulator;
  let clerk: ReturnType<typeof createClerkClient>;

  beforeAll(async () => {
    emulator = await startClerkTestEmulator();
    clerk = createClerkClient({ secretKey: clerkTestSecretKey, apiUrl: emulator.url });
  });
  afterAll(async () => {
    await emulator?.close();
  });

  it("users: create -> get -> update -> metadata -> ban/lock -> delete", async () => {
    const created = await clerk.users.createUser({
      emailAddress: ["lifecycle@example.com"],
      password: "supersecret123",
      firstName: "Life",
      lastName: "Cycle",
    });
    expect(created.id).toMatch(/^user_/);

    const fetched = await clerk.users.getUser(created.id);
    expect(fetched.firstName).toBe("Life");

    const updated = await clerk.users.updateUser(created.id, { firstName: "Updated" });
    expect(updated.firstName).toBe("Updated");

    const withMeta = await clerk.users.updateUserMetadata(created.id, { publicMetadata: { plan: "pro" } });
    expect(withMeta.publicMetadata.plan).toBe("pro");

    const banned = await clerk.users.banUser(created.id);
    expect(banned.banned).toBe(true);
    const unbanned = await clerk.users.unbanUser(created.id);
    expect(unbanned.banned).toBe(false);

    const locked = await clerk.users.lockUser(created.id);
    expect(locked.locked).toBe(true);
    await clerk.users.unlockUser(created.id);

    const deleted = await clerk.users.deleteUser(created.id);
    expect(deleted.id).toBe(created.id);
  });

  it("organizations: create -> get -> list -> update -> delete", async () => {
    const owner = await clerk.users.createUser({ emailAddress: ["org-owner@example.com"], password: "supersecret123" });

    const org = await clerk.organizations.createOrganization({ name: "Lifecycle Org", createdBy: owner.id });
    expect(org.id).toMatch(/^org_/);

    const got = await clerk.organizations.getOrganization({ organizationId: org.id });
    expect(got.name).toBe("Lifecycle Org");

    const list = await clerk.organizations.getOrganizationList();
    const data = Array.isArray(list) ? list : (list as any).data;
    expect(data.some((o: any) => o.id === org.id)).toBe(true);

    const updated = await clerk.organizations.updateOrganization(org.id, { name: "Renamed Org" });
    expect(updated.name).toBe("Renamed Org");

    await clerk.organizations.deleteOrganization(org.id);
    await clerk.users.deleteUser(owner.id);
  });

  it("memberships: add -> list -> update role -> remove", async () => {
    const owner = await clerk.users.createUser({ emailAddress: ["m-owner@example.com"], password: "supersecret123" });
    const member = await clerk.users.createUser({ emailAddress: ["m-member@example.com"], password: "supersecret123" });
    const org = await clerk.organizations.createOrganization({ name: "Membership Org", createdBy: owner.id });

    const membership = await clerk.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: member.id,
      role: "org:member",
    });
    expect(membership.id).toBeTruthy();

    const list = await clerk.organizations.getOrganizationMembershipList({ organizationId: org.id });
    const members = Array.isArray(list) ? list : (list as any).data;
    expect(members.length).toBeGreaterThanOrEqual(1);

    const updated = await clerk.organizations.updateOrganizationMembership({
      organizationId: org.id,
      userId: member.id,
      role: "org:admin",
    });
    expect(updated.role).toBe("org:admin");

    await clerk.organizations.deleteOrganizationMembership({ organizationId: org.id, userId: member.id });
  });

  it("invitations: create -> list -> revoke", async () => {
    const owner = await clerk.users.createUser({ emailAddress: ["inv-owner@example.com"], password: "supersecret123" });
    const org = await clerk.organizations.createOrganization({ name: "Invite Org", createdBy: owner.id });

    const invite = await clerk.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: "invitee@example.com",
      role: "org:member",
      inviterUserId: owner.id,
    });
    expect(invite.id).toBeTruthy();

    const list = await clerk.organizations.getOrganizationInvitationList({ organizationId: org.id });
    const invites = Array.isArray(list) ? list : (list as any).data;
    expect(invites.some((i: any) => i.id === invite.id)).toBe(true);

    const revoked = await clerk.organizations.revokeOrganizationInvitation({
      organizationId: org.id,
      invitationId: invite.id,
      requestingUserId: owner.id,
    });
    expect(revoked.status).toBe("revoked");
  });

  it("organization domains: create -> list -> update -> delete", async () => {
    const owner = await clerk.users.createUser({ emailAddress: ["dom-owner@example.com"], password: "supersecret123" });
    const org = await clerk.organizations.createOrganization({ name: "Domain Org", createdBy: owner.id });

    const domain: any = await clerk.organizations.createOrganizationDomain({
      organizationId: org.id,
      name: "lifecycle.example.com",
      enrollmentMode: "manual_invitation",
    });
    expect(domain.id).toMatch(/^orgdom_/);

    const list: any = await clerk.organizations.getOrganizationDomainList({ organizationId: org.id });
    const domains = Array.isArray(list) ? list : list.data;
    expect(domains.length).toBeGreaterThanOrEqual(1);

    const updated: any = await clerk.organizations.updateOrganizationDomain({
      organizationId: org.id,
      domainId: domain.id,
      enrollmentMode: "automatic_invitation",
    });
    expect(updated.enrollment_mode ?? updated.enrollmentMode).toBe("automatic_invitation");

    await clerk.organizations.deleteOrganizationDomain({ organizationId: org.id, domainId: domain.id });
  });
});
