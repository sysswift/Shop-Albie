import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readPublicEnv } from "./supabase-env";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — use ONLY inside server functions / loaders, never in the browser.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  const url = readPublicEnv("VITE_SUPABASE_URL");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env (project root). Add it from Supabase → Project Settings → API → service_role key, then restart the dev server."
    );
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

export function isSupabaseAdminConfigured(): boolean {
  const url = readPublicEnv("VITE_SUPABASE_URL");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return Boolean(url && serviceKey && !serviceKey.includes("your-service-role"));
}
