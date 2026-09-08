import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { buildSitemapXml } from "./lib/seo-sitemap.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function siteOrigin(request: Request): string {
  const fromEnv = process.env.VITE_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

const PRIVATE_PATH_PREFIXES = ["/pen", "/checkout", "/order-confirmed"];

function supabaseOrigins(): string[] {
  const raw = process.env.VITE_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const wsOrigin = url.origin.replace(/^https:/, "wss:");
    return [url.origin, wsOrigin];
  } catch {
    return [];
  }
}

function buildContentSecurityPolicy(): string {
  const supabase = supabaseOrigins();
  // ws/wss: Vite HMR + Supabase Realtime. unsafe-inline/eval: Vite/React hydration.
  const connect = ["'self'", "ws:", "wss:", "http:", "https:", ...supabase].join(" ");
  const img = ["'self'", "data:", "blob:", "https:", ...supabase].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Allow preview/embedded browsers (Cursor Simple Browser, IDE iframes).
    // SAMEORIGIN / frame-ancestors 'self' blocked the admin portal in those UIs.
    "frame-ancestors *",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src ${img}`,
    `connect-src ${connect}`,
    `worker-src 'self' blob:`,
  ].join("; ");
}

/**
 * Apply baseline security headers to every response. Re-wraps the response so
 * the streaming SSR body is preserved (no buffering).
 */
function withSecurityHeaders(response: Response, request: Request): Response {
  const secured = new Response(response.body, response);

  secured.headers.set("X-Content-Type-Options", "nosniff");
  // Do not set X-Frame-Options — it blocks IDE / preview browsers from loading /pen.
  secured.headers.delete("X-Frame-Options");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secured.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  // HSTS is honoured only over HTTPS; harmless on local HTTP.
  secured.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  secured.headers.set("Content-Security-Policy", buildContentSecurityPolicy());

  // Keep private areas out of search indexes at the header level too.
  const { pathname } = new URL(request.url);
  if (PRIVATE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    secured.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return secured;
}

async function seoAssetResponse(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);

  if (pathname === "/sitemap.xml") {
    const xml = await buildSitemapXml(siteOrigin(request));
    return new Response(xml, {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
    });
  }

  if (pathname === "/robots.txt") {
    const origin = siteOrigin(request);
    const body = `User-agent: *
Allow: /
Disallow: /pen
Disallow: /pen/
Disallow: /checkout
Disallow: /order-confirmed

Sitemap: ${origin}/sitemap.xml
`;
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
    });
  }

  return null;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const seoResponse = await seoAssetResponse(request);
      if (seoResponse) return withSecurityHeaders(seoResponse, request);

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withSecurityHeaders(normalized, request);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        request,
      );
    }
  },
};
