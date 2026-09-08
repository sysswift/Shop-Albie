import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin.server";

type SitemapEntry = {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

function resolveSiteUrl(origin?: string): string {
  if (origin) return origin.replace(/\/$/, "");
  const fromEnv = process.env.VITE_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://shopalbie.com";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function buildSitemapXml(origin?: string): Promise<string> {
  const base = resolveSiteUrl(origin);
  const entries: SitemapEntry[] = [
    { loc: `${base}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${base}/shop`, changefreq: "daily", priority: "0.9" },
    { loc: `${base}/shop?view=new`, changefreq: "weekly", priority: "0.8" },
  ];

  if (isSupabaseAdminConfigured()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("slug, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        for (const product of data) {
          entries.push({
            loc: `${base}/product/${product.slug}`,
            changefreq: "weekly",
            priority: "0.8",
          });
        }
      }
    } catch {
      // Static sitemap entries still help crawlers.
    }
  }

  const body = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
