import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getProducts } from "@/lib/api/products.functions";
import { adminDeleteProduct } from "@/lib/api/admin.functions";
import type { Product } from "@/lib/database.types";

export const Route = createFileRoute("/pen/products/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: () => getProducts(),
  component: ProductsList,
});

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const categoryName =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { name: string }).name
      : null;

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminDeleteProduct({ data: { id: product.id } });
      router.invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 border-b border-border last:border-b-0 hover:bg-surface/40 transition-colors">
      {/* Image */}
      <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 bg-surface overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center text-[9px] text-muted-foreground font-mono uppercase">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
        {categoryName && (
          <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{categoryName}</p>
        )}
        <p className="font-mono text-sm mt-1">₵{Number(product.price).toFixed(2)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-block size-2 rounded-full ${
            product.inventory > 10 ? "bg-green-500" : product.inventory > 3 ? "bg-yellow-500" : "bg-red-500"
          }`} />
          <span className="text-[10px] text-muted-foreground">{product.inventory} in stock</span>
          {product.featured && <span className="text-[9px] font-mono uppercase tracking-widest text-accent ml-2">Featured</span>}
          {product.is_new && <span className="text-[9px] font-mono uppercase tracking-widest text-accent ml-1">New</span>}
        </div>
        {(product.sizes ?? []).length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1">{(product.sizes ?? []).join(" · ")}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        <Link
          to="/pen/products/$id/edit"
          params={{ id: product.id }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity"
        >
          ✏️ Edit
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {deleting ? "…" : "🗑 Delete"}
        </button>
      </div>
    </div>
  );
}

function ProductsList() {
  const products = Route.useLoaderData();

  return (
    <AdminShell>
      <div className="p-4 sm:p-8">
        <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-1">Catalog</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Products</h1>
          </div>
          <Link
            to="/pen/products/new"
            className="bg-foreground text-background px-4 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-accent transition-colors text-center whitespace-nowrap"
          >
            + Add Product
          </Link>
        </header>

        <div className="border border-border bg-background">
          {products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No products yet</p>
              <p className="text-sm mb-6">Add your first product to get started.</p>
              <Link
                to="/pen/products/new"
                className="inline-block bg-foreground text-background px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-accent transition-colors"
              >
                + Add First Product
              </Link>
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 border-b border-border bg-surface flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
