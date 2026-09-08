import { Link, useRouterState } from "@tanstack/react-router";
import { Ghost } from "lucide-react";
import { useState } from "react";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BagDrawer } from "@/components/bag-drawer";
import { ShopAlbieLogo } from "@/components/shop-albie-logo";
import { useCart } from "@/lib/cart";
import { SNAPCHAT_URL, TIKTOK_URL, CONTACT_PHONE_NUMBER } from "@/lib/contact";
import { CATALOG_CATEGORY_PRESETS } from "@/lib/catalog-categories";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

type NavItem = {
  label: string;
  to: "/" | "/shop";
  hash?: string;
  search?: { view?: "new" };
  isActive: (pathname: string, hash: string, view?: string) => boolean;
};

const NAV_LINKS: NavItem[] = [
  {
    label: "Collections",
    to: "/",
    hash: "categories",
    isActive: (pathname, hash) => pathname === "/" && hash === "categories",
  },
  {
    label: "New Arrivals",
    to: "/shop",
    search: { view: "new" },
    isActive: (pathname, _hash, view) => pathname === "/shop" && view === "new",
  },
  {
    label: "All Pieces",
    to: "/shop",
    isActive: (pathname, _hash, view) => pathname === "/shop" && view !== "new",
  },
];

const navLinkCls =
  "group relative inline-block py-1 text-[11px] uppercase tracking-[0.18em] font-semibold text-foreground transition-colors duration-300 hover:text-foreground/70 after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 group-hover:after:scale-x-100";

const navLinkActiveCls = "after:scale-x-100 text-foreground";

const footerHeadingCls =
  "text-[10px] font-mono uppercase tracking-widest text-[#1c1917] font-bold";

function formatPhoneNumber(value: string) {
  if (value.startsWith("233") && value.length === 12) {
    return `+233 ${value.slice(3, 5)} ${value.slice(5, 8)} ${value.slice(8)}`;
  }
  return value;
}

function HeaderNavLink({
  link,
  className,
  onNavigate,
}: {
  link: NavItem;
  className: string;
  onNavigate?: () => void;
}) {
  const { pathname, hash, view } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      hash: state.location.hash.replace(/^#/, ""),
      view:
        state.location.pathname === "/shop"
          ? (state.location.search as { view?: string }).view
          : undefined,
    }),
  });
  const active = link.isActive(pathname, hash, view);

  return (
    <Link
      to={link.to}
      hash={link.hash}
      search={link.search}
      onClick={onNavigate}
      className={`${className} ${active ? navLinkActiveCls : ""}`}
    >
      {link.label}
    </Link>
  );
}

export function SiteHeader() {
  const [bagOpen, setBagOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <ShopAlbieLogo size="lg" />

          <nav className="hidden md:flex gap-8">
            {NAV_LINKS.map((link) => (
              <HeaderNavLink key={link.label} link={link} className={navLinkCls} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBagOpen(true)}
              className="text-[9px] sm:text-[10px] font-mono border border-border px-2 py-1 sm:px-2.5 sm:py-1.5 hover:bg-surface transition-colors relative"
              aria-label="Open shopping bag"
            >
              BAG ({totalItems})
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex flex-col gap-1.5 p-1"
              aria-label="Open menu"
            >
              <span className="w-5 h-px bg-foreground block" />
              <span className="w-5 h-px bg-foreground block" />
              <span className="w-3 h-px bg-foreground block" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-border">
            <ShopAlbieLogo size="lg" onClick={() => setMobileMenuOpen(false)} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl leading-none text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col px-5 py-8 gap-1">
            {NAV_LINKS.map((link) => (
              <HeaderNavLink
                key={link.label}
                link={link}
                onNavigate={() => setMobileMenuOpen(false)}
                className="text-2xl font-semibold tracking-tight py-3 border-b border-border text-foreground transition-colors duration-300 hover:text-foreground/70"
              />
            ))}
          </nav>
          <div className="mt-auto px-5 pb-10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setBagOpen(true);
              }}
              className="w-full border border-foreground py-4 text-xs uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background transition-colors"
            >
              View Bag ({totalItems})
            </button>
          </div>
        </div>
      )}

      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} />

      <WhatsAppFab />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 sm:mt-20 border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
        <div className="max-w-sm space-y-4">
          <ShopAlbieLogo size="xl" linked={false} />

          <p className="text-[12px] text-[#292524] leading-relaxed">
            Handmade fashion and accessories for soft everyday style, thoughtful gifting, and custom personal pieces.
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-widest text-[#44403c]">
            {CATALOG_CATEGORY_PRESETS.map((preset) => (
              <Link
                key={preset.key}
                to="/shop"
                search={{ category: preset.slugHints[0] }}
                className="hover:text-[#1c1917] transition-colors"
              >
                {preset.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 md:justify-self-end md:text-right">
          <div className="space-y-3">
            <p className={footerHeadingCls}>Find Us</p>
            <div className="space-y-1 text-[12px] text-[#292524] leading-relaxed">
              <p>UCC Campus - Cape Coast</p>
              <p>Agona Swedru</p>
              <p>Nationwide delivery across Ghana</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <p className={footerHeadingCls}>Contact</p>
              <a
                href={`tel:+${CONTACT_PHONE_NUMBER}`}
                className="inline-block text-[12px] font-semibold text-[#1c1917] hover:text-[#1c1917]/80 transition-colors"
              >
                {formatPhoneNumber(CONTACT_PHONE_NUMBER)}
              </a>
            </div>

            <div className="space-y-3">
              <p className={footerHeadingCls}>Social</p>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shop Albie on TikTok"
                  className="inline-flex items-center gap-2 border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#292524] transition-colors hover:border-[#1c1917] hover:text-[#1c1917]"
                >
                  <TikTokIcon className="size-3.5" />
                  TikTok
                </a>
                <a
                  href={SNAPCHAT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Shop Albie on Snapchat"
                  className="inline-flex items-center gap-2 border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#292524] transition-colors hover:border-[#1c1917] hover:text-[#1c1917]"
                >
                  <Ghost className="size-3.5" aria-hidden />
                  Snapchat
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-[9px] font-mono uppercase tracking-widest text-[#44403c]">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
          <span>© 2026 Shop Albie</span>
          <span aria-hidden className="text-[#a1a1aa]">·</span>
          <span>Handmade in Ghana</span>
        </div>

        <span className="justify-self-center inline-flex items-center gap-1.5">
          Developed by
          <a
            href="https://sysswift.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="sySSwift"
            className="inline-flex items-baseline whitespace-nowrap normal-case font-logo text-[#00A3FF] transition-opacity hover:opacity-80"
          >
            <span className="text-[12px] font-normal tracking-[-0.05em] leading-none">sy</span>
            <span className="text-[18px] font-normal tracking-[-0.07em] leading-none">SS</span>
            <span className="text-[12px] font-normal tracking-[-0.05em] leading-none">wift</span>
          </a>
        </span>

        <span className="hidden sm:block" aria-hidden />
      </div>
    </footer>
  );
}
