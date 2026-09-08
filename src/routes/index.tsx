import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getFeaturedProducts, getNewArrivals, getCategories } from "@/lib/api/products.functions";
import {
  buildHomeCategoryCards,
  CATALOG_CATEGORY_PRESETS,
  matchPresetToCategory,
  resolvePresetShopSlug,
} from "@/lib/catalog-categories";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ProductCard } from "@/components/product-card";
import {
  buildPageHead,
  jsonLdScript,
  localBusinessJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo";

const HERO_ROTATE_MS = 4800;

export const Route = createFileRoute("/")({
  head: () => {
    const { meta, links } = buildPageHead({
      title: "Shop Albie — Handmade Fashion & Accessories in Ghana",
      description:
        "Shop Albie — handmade hair bonnets, waist beads, scrunchies, headbands, and dresses. Crafted in Ghana. Order on WhatsApp with nationwide delivery.",
      path: "/",
      image: "/og-image.svg",
    });

    return {
      meta,
      links,
      scripts: [
        jsonLdScript([organizationJsonLd(), webSiteJsonLd(), localBusinessJsonLd()]),
      ],
    };
  },
  loader: async () => {
    const [featured, newArrivals, categories] = await Promise.all([
      getFeaturedProducts(),
      getNewArrivals(),
      getCategories(),
    ]);
    return { featured, newArrivals, categories };
  },
  component: Index,
});

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground py-12 border border-dashed border-border text-center rounded-sm">
      {message}
    </p>
  );
}

function Index() {
  const { featured, newArrivals, categories } = Route.useLoaderData();
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = useMemo(
    () =>
      CATALOG_CATEGORY_PRESETS.map((preset) => {
        const category = matchPresetToCategory(preset, categories);
        return {
          key: preset.key,
          label: preset.label,
          headline: preset.headline,
          description: preset.description,
          cta: preset.cta,
          image: preset.image,
          slug: resolvePresetShopSlug(preset, categories),
          count: category?.count ?? 0,
        };
      }),
    [categories],
  );

  const categoryCards = useMemo(() => buildHomeCategoryCards(categories), [categories]);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, HERO_ROTATE_MS);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[activeSlide] ?? heroSlides[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[min(78svh,640px)] sm:h-[min(85vh,760px)] md:h-[88vh] lg:h-[92vh] lg:min-h-[640px] overflow-hidden bg-foreground">
        {heroSlides.map((slide, i) => (
          <img
            key={slide.key}
            src={slide.image}
            alt={slide.label}
            className={`absolute inset-0 w-full h-full object-cover object-center sm:object-center transition-opacity duration-700 ${
              i === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 sm:from-black/80 sm:via-black/35 sm:to-black/15" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-5 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-xl">
            <h1 className="text-[1.625rem] leading-[1.05] sm:text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight sm:leading-[0.92] mb-3 sm:mb-6 text-balance text-background">
              {currentSlide?.headline ?? "Handmade fashion with care."}
            </h1>
            <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-8 text-background/80 max-w-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
              {currentSlide?.description ??
                "Every piece is crafted by her own hands in small, intentional batches."}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
              <Link
                to="/shop"
                search={{ category: currentSlide?.slug }}
                className="inline-block text-center bg-background text-foreground px-5 py-3 sm:px-8 sm:py-4 text-[10px] sm:text-xs uppercase tracking-widest font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {currentSlide?.cta ?? "Shop Collection"}
              </Link>
              <Link
                to="/shop"
                className="hidden sm:inline-block border border-background/50 text-background px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-background hover:text-foreground transition-colors"
              >
                View all categories
              </Link>
            </div>

            <div className="mt-3 sm:mt-5 flex gap-2">
              {heroSlides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={`Show ${slide.label}`}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1 sm:h-1.5 rounded-full transition-all ${
                    i === activeSlide ? "w-8 sm:w-10 bg-background" : "w-5 sm:w-6 bg-background/40 hover:bg-background/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="px-4 sm:px-6 py-10 sm:py-16 md:py-24 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6 sm:mb-10 gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Selected for the season</h2>
          </div>
          {featured.length > 0 && (
            <Link
              to="/shop"
              className="shrink-0 text-[10px] font-mono uppercase tracking-widest border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors"
            >
              View all →
            </Link>
          )}
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState message="Featured products will appear here once added by the studio." />
        )}
      </section>

      {/* Categories */}
      {categoryCards.length > 0 && (
        <section id="categories" className="border-t border-border bg-surface px-4 sm:px-6 py-10 sm:py-16 md:py-24 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Browse the catalog</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
              {categoryCards.map((cat, i) => (
                <Link
                  key={cat.key}
                  to="/shop"
                  search={{ category: cat.slug }}
                  className="group block aspect-[3/4] sm:aspect-[4/5] bg-background relative overflow-hidden border border-border"
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 bg-gradient-to-t from-black/65 via-transparent to-transparent">
                    <div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight transition-colors text-white leading-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest mt-1 text-white/70">
                        {cat.count} pieces
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="px-4 sm:px-6 py-10 sm:py-16 md:py-24 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">New this week</h2>
        </div>
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState message="New arrivals will appear here once products are added." />
        )}
      </section>

      {/* Brand story strip */}
      <section className="border-t border-border bg-foreground text-background py-10 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-background/50 mb-4 sm:mb-6">Our story</p>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-semibold tracking-tight mb-4 sm:mb-6 leading-snug">
            Handmade by her own hands,<br className="hidden sm:block" /> piece by piece.
          </h2>
          <p className="text-sm sm:text-base text-background/70 leading-relaxed max-w-xl mx-auto mb-8">
            Shop Albie is built on intention: every bonnet, bead, scrunchie, headband, and dress is crafted in small batches with care and detail.
          </p>
          <Link
            to="/shop"
            className="inline-block border border-background/40 text-background px-8 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-background hover:text-foreground transition-colors"
          >
            All Pieces
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
