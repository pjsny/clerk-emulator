import type { RouteContext } from "../framework/index.js";

// Serves the clerk-js browser bundle by proxying jsDelivr, so a frontend app can
// load it from the emulator origin (via proxyUrl) instead of Clerk's CDN.
// Not part of the Clerk API surface — purely a dev convenience for browser demos.
//
// Successful responses are cached in memory for the life of the process, and the
// CDN fetch is retried a few times (with a per-attempt timeout), so transient CDN
// blips or rate-limiting don't leave clerk-js failing to load.
const CDN = "https://cdn.jsdelivr.net/npm";

async function fetchWithRetry(url: string, attempts = 3): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (res.ok) return res;
    } catch {
      // network error / timeout — fall through to retry
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  return null;
}

export function clerkJsProxyRoutes({ app }: RouteContext): void {
  const cache = new Map<string, { body: string; contentType: string }>();

  app.get("/npm/:path{.+}", async (c) => {
    const path = c.req.param("path");
    const cors = { "Access-Control-Allow-Origin": "*" };

    const cached = cache.get(path);
    if (cached) return c.body(cached.body, 200, { "Content-Type": cached.contentType, ...cors });

    const res = await fetchWithRetry(`${CDN}/${path}`);
    if (!res) return c.text("Failed to load clerk-js", 502);

    const body = await res.text();
    const contentType = res.headers.get("content-type") ?? "application/javascript";
    cache.set(path, { body, contentType });
    return c.body(body, 200, { "Content-Type": contentType, ...cors });
  });
}
