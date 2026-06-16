import type { RouteContext } from "../framework/index.js";

// Serves the clerk-js browser bundle by proxying jsDelivr, so a frontend app can
// load it from the emulator origin (via proxyUrl) instead of Clerk's CDN.
// Not part of the Clerk API surface — purely a dev convenience for browser demos.
//
// Successful responses are cached in memory for the life of the process so that
// repeated page loads (and e2e runs) don't re-hit the CDN — that both speeds
// things up and avoids transient CDN rate-limiting/failures.
export function clerkJsProxyRoutes({ app }: RouteContext): void {
  const cache = new Map<string, { body: string; contentType: string }>();

  app.get("/npm/:path{.+}", async (c) => {
    const path = c.req.param("path");
    const cached = cache.get(path);
    if (cached) {
      return c.body(cached.body, 200, { "Content-Type": cached.contentType, "Access-Control-Allow-Origin": "*" });
    }
    try {
      const cdnRes = await fetch(`https://cdn.jsdelivr.net/npm/${path}`);
      const body = await cdnRes.text();
      const contentType = cdnRes.headers.get("content-type") ?? "application/javascript";
      if (cdnRes.ok) cache.set(path, { body, contentType });
      return c.body(body, cdnRes.ok ? 200 : (cdnRes.status as 502), {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      });
    } catch {
      return c.text("Failed to load clerk-js", 502);
    }
  });
}
