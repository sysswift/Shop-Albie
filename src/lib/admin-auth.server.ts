import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseAdmin } from "./supabase-admin.server";

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function getAdminAllowlist(): string[] | null {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return null;
  const allowed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length > 0 ? allowed : null;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isEmailAllowed(email: string | undefined): boolean {
  const allowed = getAdminAllowlist();
  if (!allowed) {
    if (isProduction()) return false;
    console.warn(
      "[admin-auth] ADMIN_EMAILS is not set — allowing any authenticated user (development only).",
    );
    return true;
  }
  return allowed.includes((email ?? "").toLowerCase());
}

/** Validates the caller's Supabase JWT before any admin server action runs. */
export async function requireAdminSession() {
  if (!getAdminAllowlist() && isProduction()) {
    throw new Error("Forbidden — admin access is not configured.");
  }

  const token = parseBearerToken(getRequestHeader("authorization"));
  if (!token) {
    throw new Error("Unauthorized — admin sign-in required.");
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Unauthorized — invalid or expired session.");
  }

  if (!isEmailAllowed(data.user.email)) {
    throw new Error("Forbidden — this account is not allowed to access admin.");
  }

  return data.user;
}
