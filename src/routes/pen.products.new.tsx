import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getCategories } from "@/lib/api/products.functions";
import { adminCreateProduct } from "@/lib/api/admin.functions";
import {
  ProductImageUploader,
  ProductColorsField,
  ProductFormFields,
  ProductDescriptionField,
  ProductFlagsField,
  ProductSizesField,
  orderGalleryImages,
} from "@/components/admin-product-form";
import {
  createPendingImages,
  resolveGalleryUrls,
  formatActionError,
  type GalleryImage,
} from "@/lib/upload-product-image";

export const Route = createFileRoute("/pen/products/new")({
  ssr: false,
  head: () => ({ meta: [{ title: "Add Product — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: () => getCategories(),
  component: NewProduct,
});

function NewProduct() {
  const categories = Route.useLoaderData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  function handleAddImages(files: FileList | File[]) {
    const added = createPendingImages(files);
    setImages((prev) => [...prev, ...added]);
    if (!primaryId && added[0]) setPrimaryId(added[0].id);
  }

  function handleRemoveImage(id: string) {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (primaryId === id) setPrimaryId(next[0]?.id ?? null);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const ordered = orderGalleryImages(images, primaryId);
      const galleryUrls = ordered.length > 0 ? await resolveGalleryUrls(ordered) : [];

      const name = (form.get("name") as string).trim();
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      await adminCreateProduct({
        data: {
          name,
          slug,
          price: parseFloat(form.get("price") as string),
          category_id: (form.get("category_id") as string) || null,
          description: ((form.get("description") as string) || "").trim() || null,
          sizes,
          colors,
          inventory: parseInt(form.get("inventory") as string, 10) || 0,
          featured: form.get("featured") === "on",
          is_new: form.get("is_new") === "on",
          image_url: galleryUrls[0] ?? null,
          gallery_urls: galleryUrls,
        },
      });

      window.location.href = "/pen/products";
    } catch (err) {
      setError(formatActionError(err, "Failed to create product"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 sm:p-8 max-w-2xl">
        <Link
          to="/pen/products"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent mb-6 inline-block"
        >
          ← Back to products
        </Link>
        <header className="mb-8">
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-1">New Product</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Add new product</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <ProductImageUploader
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            onSetPrimary={setPrimaryId}
            primaryId={primaryId}
          />

          <ProductFormFields categories={categories} />
          <ProductDescriptionField />
          <ProductSizesField selected={sizes} onChange={setSizes} />
          <ProductColorsField colors={colors} onChange={setColors} />
          <ProductFlagsField />

          {error && (
            <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive rounded">{error}</div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-widest font-semibold hover:bg-accent disabled:opacity-60 transition-colors"
            >
              {saving ? "Publishing…" : "Publish Product"}
            </button>
            <Link
              to="/pen/products"
              className="w-full py-4 text-xs uppercase tracking-widest font-semibold border border-border hover:bg-surface text-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
