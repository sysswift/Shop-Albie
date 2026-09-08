import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProductBySlug } from "@/lib/api/products.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useCart } from "@/lib/cart";
import { whatsappUrl } from "@/lib/contact";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp-order-message";
import { WhatsAppOrderForm, type WhatsAppOrderFormData } from "@/components/whatsapp-order-form";
import { ShareButton } from "@/components/share-button";
import { displaySizeLabel, sizeFieldLabel } from "@/lib/product-sizes";
import type { Product } from "@/lib/database.types";
import { buildPageHead, jsonLdScript, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) {
      return { meta: [{ title: "Product — Shop Albie" }] };
    }

    const { product } = loaderData;
    const categoryName =
      typeof product.category === "object" && product.category !== null
        ? (product.category as { name: string }).name
        : undefined;
    const description =
      product.description?.slice(0, 160) ??
      `${product.name} — handmade by Shop Albie. Order on WhatsApp with nationwide delivery in Ghana.`;

    const { meta, links } = buildPageHead({
      title: `${product.name} — Shop Albie`,
      description,
      path: `/product/${product.slug}`,
      image: product.image_url ?? "/og-image.svg",
      type: "product",
    });

    return {
      meta,
      links,
      scripts: [
        jsonLdScript(
          productJsonLd({
            name: product.name,
            slug: product.slug,
            description: product.description,
            image_url: product.image_url,
            price: Number(product.price),
            sku: product.sku,
            categoryName,
          }),
        ),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-3">404</p>
        <p className="text-2xl font-semibold mb-6">Product not found</p>
        <Link to="/shop" className="text-xs uppercase tracking-widest underline hover:text-accent">
          Back to shop
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <p className="text-muted-foreground">Something went wrong loading this product. Please try again.</p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { addItem } = useCart();

  const sizes = product.sizes ?? [];
  const colors = Array.isArray(product.colors)
    ? (product.colors as { name: string; hex: string }[])
    : [];
  const gallery = product.gallery_urls?.length ? product.gallery_urls : product.image_url ? [product.image_url] : [];

  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? { name: "", hex: "" });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [orderFormOpen, setOrderFormOpen] = useState(false);

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { name: string }).name
      : "";

  function handleWhatsAppOrder(data: WhatsAppOrderFormData) {
    if (sizes.length > 0 && !size) return;

    const message = buildWhatsAppOrderMessage(data, [
      {
        productName: product.name,
        category: categoryName,
        size: sizes.length > 0 ? size : undefined,
        color: color.name.trim() || undefined,
        quantity: qty,
      },
    ]);

    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  function handleAddToBag() {
    if (sizes.length > 0 && !size) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productCategory: categoryName,
      imageUrl: product.image_url ?? "",
      size: size || "One Size",
      color: color.name.trim(),
      unitPrice: Number(product.price),
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 text-[10px] font-mono uppercase text-muted-foreground tracking-widest flex gap-2 overflow-x-auto scrollbar-none">
        <Link to="/" className="shrink-0 hover:text-accent transition-colors">Home</Link>
        <span className="shrink-0">/</span>
        <Link to="/shop" className="shrink-0 hover:text-accent transition-colors">Shop</Link>
        <span className="shrink-0">/</span>
        <span className="text-foreground truncate">{product.name}</span>
      </div>

      <section className="py-6 sm:py-8 md:py-14 px-4 sm:px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-2 sm:space-y-3">
          <div className="aspect-[4/5] sm:aspect-[3/4] bg-surface overflow-hidden max-h-[70vh] sm:max-h-none mx-auto w-full">
            {gallery[activeImg] ? (
              <img
                src={gallery[activeImg]}
                alt={product.name}
                width={900}
                height={1200}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">No image</span>
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-[3/4] bg-surface overflow-hidden border-2 transition-colors ${
                    activeImg === i ? "border-foreground" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col animate-fade-up [animation-delay:100ms] lg:sticky lg:top-20 lg:self-start">
          <span className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-widest">
            {categoryName || "Product"}
          </span>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-tight">{product.name}</h1>
            <ShareButton slug={product.slug} title={product.name} variant="full" />
          </div>
          <p className="text-xl sm:text-2xl font-mono mb-3 sm:mb-4">₵{Number(product.price).toFixed(2)}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            Handmade in Ghana · Nationwide delivery · Order via WhatsApp
          </p>

          {/* Color */}
          {colors.length > 0 && (
            <div className="mb-7">
              <label className="text-[10px] uppercase font-bold tracking-widest mb-3 block">
                Color: <span className="text-muted-foreground font-medium ml-1">{color.name}</span>
              </label>
              <div className="flex gap-3 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c)}
                    aria-label={c.name}
                    title={c.name}
                    className={`size-8 rounded-sm transition-all ${
                      color.name === c.name
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : "ring-1 ring-border hover:ring-foreground/40"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size / measurement */}
          {sizes.length > 0 && (
            <div className="mb-7">
              <label className="text-[10px] uppercase font-bold tracking-widest mb-3 block">
                {sizeFieldLabel(sizes)}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-h-10 sm:min-h-12 px-2 flex items-center justify-center text-[11px] sm:text-xs border transition-colors ${
                      size === s
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {displaySizeLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <label className="text-[10px] uppercase font-bold tracking-widest mb-3 block">Quantity</label>
            <div className="inline-flex border border-border">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="size-12 hover:bg-surface transition-colors text-lg"
              >
                −
              </button>
              <div className="size-12 grid place-items-center font-mono text-sm border-x border-border">
                {qty}
              </div>
              <button
                onClick={() => setQty(qty + 1)}
                className="size-12 hover:bg-surface transition-colors text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={handleAddToBag}
              className={`w-full py-3.5 sm:py-4 text-[10px] sm:text-xs uppercase tracking-widest font-semibold transition-colors ${
                added
                  ? "bg-green-600 text-white"
                  : "bg-foreground text-background hover:bg-accent"
              }`}
            >
              {added ? "Added to Bag ✓" : `Add to Bag — ₵${(Number(product.price) * qty).toFixed(2)}`}
            </button>
            {!orderFormOpen ? (
              <button
                type="button"
                onClick={() => setOrderFormOpen(true)}
                className="w-full bg-[var(--whatsapp)] text-white py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                  <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
                </svg>
                Order via WhatsApp
              </button>
            ) : (
              <div className="space-y-2">
                <WhatsAppOrderForm onSubmit={handleWhatsAppOrder} />
                <button
                  type="button"
                  onClick={() => setOrderFormOpen(false)}
                  className="w-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              {product.inventory > 10
                ? "In stock · Ships within 48 hours"
                : product.inventory > 0
                ? `Only ${product.inventory} left · Ships within 48 hours`
                : "Contact us for availability"}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-[10px] uppercase font-bold tracking-widest mb-3">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Details accordion */}
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <details className="group">
              <summary className="text-[10px] uppercase font-bold tracking-widest cursor-pointer flex justify-between items-center list-none">
                Sizing &amp; fit
                <span className="group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Sizing depends on the product category. If a product supports size options, choose the best fit before adding to bag. You can request custom preferences in WhatsApp.
              </p>
            </details>
            <details className="group">
              <summary className="text-[10px] uppercase font-bold tracking-widest cursor-pointer flex justify-between items-center list-none">
                Delivery &amp; returns
                <span className="group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Once an order is placed, please allow 2–3 working days for preparation before shipping. Delivery within Ghana takes 2–5 business days. International shipping available. Contact us on WhatsApp for return requests.
              </p>
            </details>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
