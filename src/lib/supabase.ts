import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicConfig, isSupabaseConfigured } from "./supabase-env";

export { isSupabaseConfigured };

let browserClient: SupabaseClient<Database> | null = null;

/** Browser + public storefront client (anon key, persists auth session). */
export function getSupabase(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabasePublicConfig();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env at the project root, then restart the dev server."
    );
  }

  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

/** Direct export for auth and client-side usage */
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  get storage() {
    return getSupabase().storage;
  },
  from(table: "products" | "categories") {
    return getSupabase().from(table);
  },
};
