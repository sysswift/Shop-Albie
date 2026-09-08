import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getProducts, getCategories } from "@/lib/api/products.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ProductCard } from "@/components/product-card";
import { buildPageHead } from "@/lib/seo";

const shopSearchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional(),
  view: z.enum(["new"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: shopSearchSchema,
  head: ({ search }) => {
    const isNew = search.view === "new";
    const title = isNew
      ? "New Arrivals — Shop Albie"
      : search.category
        ? "Shop Collection — Shop Albie"
        : "Shop All Pieces — Shop Albie";
    const description = isNew
      ? "Discover the latest handmade arrivals from Shop Albie — bonnets, beads, scrunchies, headbands, and dresses."
      : "Browse Shop Albie's handmade collection: hair bonnets, waist beads, scrunchies, headbands, and dresses. Order on WhatsApp.";

    const { meta, links } = buildPageHead({
      title,
      description,
      path: isNew ? "/shop?view=new" : search.category ? `/shop?category=${search.category}` : "/shop",
      image: "/og-image.svg",
    });

    return { meta, links };
  },
  loader: async () => {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return { products, categories };
  },
  component: Shop,
});

function Shop() {
  const { products, categories } = Route.useLoaderData();
  const { category: activeCategory, sort = "newest", view } = Route.useSearch();
  const navigate = useNavigate();
  const isNewArrivals = view === "new";

  const filtered = products
    .filter((p) => {
      if (isNewArrivals && !p.is_new) return false;
      if (!activeCategory) return true;
      const cat = typeof p.category === "object" && p.category !== null
        ? (p.category as { slug: string }).slug
        : "";
      return cat === activeCategory;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return Number(a.price) - Number(b.price);
      if (sort === "price-desc") return Number(b.price) - Number(a.price);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl mx-auto">
        {/* Header row */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight">
              {isNewArrivals ? "New Arrivals" : activeCategory ? "Collection" : "All Pieces"}
            </h1>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <p className="text-[10px] sm:text-xs font-mono uppercase text-muted-foreground tracking-widest">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </p>
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) =>
                navigate({
                  to: "/shop",
                  search: (prev) => ({
                    ...prev,
                    sort: e.target.value as "newest" | "price-asc" | "price-desc",
                  }),
                })
              }
              className="text-[10px] font-mono uppercase tracking-widest border border-border bg-background px-2.5 py-2 sm:px-3 focus:outline-none max-w-[55%] sm:max-w-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* Category filter chips — horizontal scroll on mobile */}
        {categories.length > 0 && (
          <div className="-mx-4 sm:mx-0 mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-border">
            <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 sm:px-0 sm:flex-wrap">
              <Link
                to="/shop"
                search={isNewArrivals ? { view: "new" } : {}}
                className={`shrink-0 text-[10px] font-mono uppercase tracking-widest px-3 py-2 border transition-colors ${
                  !activeCategory
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to="/shop"
                  search={isNewArrivals ? { view: "new", category: cat.slug } : { category: cat.slug }}
                  className={`shrink-0 text-[10px] font-mono uppercase tracking-widest px-3 py-2 border transition-colors ${
                    activeCategory === cat.slug
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-border">
            <p className="text-xl font-semibold tracking-tight mb-2">
              {isNewArrivals
                ? "No new arrivals yet"
                : activeCategory
                  ? "No products in this category yet"
                  : "Collection coming soon"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              {isNewArrivals
                ? "Check back soon for fresh pieces from the studio."
                : activeCategory
                  ? "Try browsing all pieces or check back soon."
                  : "Products will appear here once the catalog is live."}
            </p>
            {activeCategory && (
              <Link
                to="/shop"
                className="text-[10px] font-mono uppercase tracking-widest underline hover:text-accent"
              >
                View all pieces
              </Link>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
