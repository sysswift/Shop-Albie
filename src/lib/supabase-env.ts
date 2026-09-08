/** Read VITE_* public env vars on both client and SSR server. */
export function readPublicEnv(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string {
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImport?.trim()) return fromImport.trim();

  if (typeof process !== "undefined") {
    const fromProcess = process.env[name];
    if (fromProcess?.trim()) return fromProcess.trim();
  }

  return "";
}

export function getSupabasePublicConfig() {
  return {
    url: readPublicEnv("VITE_SUPABASE_URL"),
    anonKey: readPublicEnv("VITE_SUPABASE_ANON_KEY"),
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicConfig();
  return Boolean(
    url &&
      anonKey &&
      !url.includes("your-project-ref") &&
      !url.includes("placeholder")
  );
}
