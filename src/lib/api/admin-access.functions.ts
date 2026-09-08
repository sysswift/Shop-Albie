import { createServerFn } from "@tanstack/react-start";
import { adminAuthMiddleware } from "../admin-auth.middleware";

/**
 * Confirms the signed-in user is an allowed admin (valid session + on ADMIN_EMAILS).
 * Throws via the middleware when the caller is not authorized.
 */
export const checkAdminAccess = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(async () => ({ ok: true }));
