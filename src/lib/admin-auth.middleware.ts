import { createMiddleware } from "@tanstack/react-start";
import { requireAdminSession } from "./admin-auth.server";
import { getSupabase } from "./supabase";

/**
 * Attach the admin JWT on the client; verify it on the server before admin RPC runs.
 */
export const adminAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { data, error } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;

    if (error || !token) {
      throw new Error("You must be signed in to use admin tools.");
    }

    return next({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  })
  .server(async ({ next }) => {
    await requireAdminSession();
    return next();
  });
