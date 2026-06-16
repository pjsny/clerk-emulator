#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { createServer } from "./framework/index.js";
import { clerkPlugin, seedFromConfig } from "./index.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
const secretKey = process.env.CLERK_SECRET_KEY ?? "sk_test_emulate";
const machineKey = process.env.CLERK_MACHINE_KEY ?? "ak_test_emulate";

const { app, store, baseUrl } = createServer(clerkPlugin, {
  port,
  tokens: {
    [secretKey]: { login: "admin", id: 1, scopes: [] },
    [machineKey]: { login: "machine", id: 2, scopes: [] },
  },
});

// Seed default fixtures so the emulator is usable the moment it boots.
clerkPlugin.seed?.(store, baseUrl);
seedFromConfig(store, baseUrl, {
  users: [
    { email_addresses: ["alice@example.com"], first_name: "Alice", last_name: "Smith", password: "alice123" },
    { email_addresses: ["bob@example.com"], first_name: "Bob", last_name: "Jones" },
  ],
  organizations: [
    {
      name: "Acme Corp",
      slug: "acme",
      members: [
        { email: "alice@example.com", role: "admin" },
        { email: "bob@example.com", role: "member" },
      ],
    },
  ],
});

serve({ fetch: app.fetch, port, hostname: host }, () => {
  process.stdout.write(
    [
      "",
      "  clerk-emulator is running",
      `  ➜ Backend API:  ${baseUrl}`,
      `  ➜ Secret key:   ${secretKey}`,
      `  ➜ Machine key:  ${machineKey}`,
      "",
      "  Point the Clerk SDK at it with:",
      `    CLERK_SECRET_KEY=${secretKey}`,
      `    CLERK_API_URL=${baseUrl}`,
      "",
    ].join("\n") + "\n",
  );
});
