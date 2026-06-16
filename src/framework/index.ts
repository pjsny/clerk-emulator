// Minimal service-emulator framework.
//
// The HTTP layer is the real Hono (https://hono.dev). Everything else here
// (in-memory Store, webhook dispatcher, auth middleware, plugin contract,
// server bootstrap, HTML/UI helpers) is local source with no third-party
// runtime dependency beyond `hono`, `@hono/node-server`, and `jose`.

// --- HTTP layer: real Hono ---
export { Hono } from "hono";
export { cors } from "hono/cors";
export { serve } from "@hono/node-server";
export type { Context, HonoRequest, ErrorHandler, Handler, MiddlewareHandler, Next } from "hono";
export type { ContentfulStatusCode } from "hono/utils/http-status";

// --- In-memory data store ---
export {
  Store,
  Collection,
  type Entity,
  type InsertInput,
  type QueryOptions,
  type PaginatedResult,
  type FilterFn,
  type SortFn,
  type CollectionSnapshot,
  type StoreSnapshot,
  serializeValue,
  deserializeValue,
} from "./store.js";

// --- Server bootstrap ---
export { createServer, type ServerOptions } from "./server.js";

// --- Plugin contract ---
export { type ServicePlugin, type RouteContext } from "./plugin.js";

// --- Webhooks ---
export { WebhookDispatcher, type WebhookSubscription, type WebhookDelivery } from "./webhooks.js";

// --- Errors ---
export {
  errorHandler,
  createErrorHandler,
  createApiErrorHandler,
  ApiError,
  notFound,
  validationError,
  unauthorized,
  forbidden,
  parseJsonBody,
} from "./middleware/error-handler.js";

// --- Auth ---
export {
  authMiddleware,
  requireAuth,
  requireAppAuth,
  serializeTokenMap,
  restoreTokenMap,
  type AuthUser,
  type AuthApp,
  type AuthInstallation,
  type AuthFallback,
  type TokenMap,
  type TokenEntry,
  type AppKeyResolver,
  type AppEnv,
} from "./middleware/auth.js";

// --- Pagination ---
export { parsePagination, setLinkHeader, type PaginationParams } from "./middleware/pagination.js";

// --- HTML / UI helpers (OAuth consent screens, etc.) ---
export {
  escapeHtml,
  escapeAttr,
  renderCardPage,
  renderErrorPage,
  renderSettingsPage,
  renderInspectorPage,
  renderFormPostPage,
  renderCheckoutPage,
  renderUserButton,
  type CheckoutLineItem,
  type CheckoutPageOptions,
  type UserButtonOptions,
  type InspectorTab,
} from "./ui.js";

// --- Static font/favicon routes referenced by rendered HTML ---
export { registerFontRoutes } from "./fonts.js";

// --- OAuth helpers ---
export { normalizeUri, matchesRedirectUri, constantTimeSecretEqual, bodyStr, parseCookies } from "./oauth-helpers.js";

// --- Misc ---
export { debug } from "./debug.js";
export { type PersistenceAdapter, filePersistence } from "./persistence.js";
