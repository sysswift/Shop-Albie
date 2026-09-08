import { CONTACT_PHONE_NUMBER, TIKTOK_URL, SNAPCHAT_URL } from "@/lib/contact";

export const SITE_NAME = "Shop Albie";
export const SITE_TAGLINE = "Handmade Fashion & Accessories in Ghana";
export const DEFAULT_DESCRIPTION =
  "Shop Albie — handmade hair bonnets, waist beads, scrunchies, headbands, and dresses. Crafted in Ghana with care. Order on WhatsApp. Nationwide delivery.";

const DEFAULT_KEYWORDS =
  "Shop Albie, handmade fashion Ghana, hair bonnets, waist beads, scrunchies, headbands, dresses, Cape Coast, Agona Swedru, WhatsApp shop";

/** Public site URL for canonical links and sitemap. Set VITE_SITE_URL in production. */
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://shopalbie.com";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function formatPhoneForSchema(digits: string): string {
  if (digits.startsWith("233") && digits.length === 12) {
    return `+233-${digits.slice(3, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return `+${digits}`;
}

type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "product";
  noIndex?: boolean;
};

export function buildPageHead(input: PageSeoInput) {
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const url = absoluteUrl(input.path ?? "/");
  const image = input.image ? (input.image.startsWith("http") ? input.image : absoluteUrl(input.image)) : absoluteUrl("/og-image.svg");
  const ogType = input.type ?? "website";

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: description },
    { name: "keywords", content: DEFAULT_KEYWORDS },
    { name: "author", content: SITE_NAME },
    { name: "theme-color", content: "#0a0a0a" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: input.title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:locale", content: "en_GH" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  if (input.noIndex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({ name: "robots", content: "index, follow" });
  }

  const links = [{ rel: "canonical", href: url }];

  return { meta, links };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/icons/favicon.svg"),
    description: DEFAULT_DESCRIPTION,
    telephone: formatPhoneForSchema(CONTACT_PHONE_NUMBER),
    areaServed: { "@type": "Country", name: "Ghana" },
    sameAs: [TIKTOK_URL, SNAPCHAT_URL],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-GH",
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    image: absoluteUrl("/og-image.svg"),
    telephone: formatPhoneForSchema(CONTACT_PHONE_NUMBER),
    priceRange: "₵",
    address: [
      {
        "@type": "PostalAddress",
        addressLocality: "Cape Coast",
        addressRegion: "Central Region",
        addressCountry: "GH",
      },
      {
        "@type": "PostalAddress",
        addressLocality: "Agona Swedru",
        addressRegion: "Central Region",
        addressCountry: "GH",
      },
    ],
    areaServed: "Ghana",
    sameAs: [TIKTOK_URL, SNAPCHAT_URL],
  };
}

export function productJsonLd(product: {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  sku: string;
  categoryName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} — handmade by ${SITE_NAME}.`,
    image: product.image_url ? [product.image_url] : [absoluteUrl("/og-image.svg")],
    sku: product.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "GHS",
      price: Number(product.price).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}
