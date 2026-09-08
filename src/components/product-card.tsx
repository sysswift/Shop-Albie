import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/database.types";
import { ShareButton } from "@/components/share-button";

export function ProductCard({ product }: { product: Product }) {
  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { name: string }).name
      : "";

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="aspect-[3/4] overflow-hidden bg-surface mb-2 sm:mb-3 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            width={600}
            height={800}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-surface flex items-center justify-center">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
              No image
            </span>
          </div>
        )}
        {product.is_new && (
          <span className="absolute top-3 left-3 text-[10px] font-mono uppercase bg-background/90 px-2 py-1 tracking-widest">
            New
          </span>
        )}
        <ShareButton slug={product.slug} title={product.name} variant="compact" />
      </div>
      <div className="flex justify-between items-baseline gap-4">
        <div className="min-w-0">
          {categoryName && (
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-1">
              {categoryName}
            </p>
          )}
          <h3 className="text-xs sm:text-sm font-medium truncate">{product.name}</h3>
        </div>
        <p className="text-xs sm:text-sm font-mono shrink-0">₵{Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
