import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getCategories } from "@/lib/api/products.functions";
import { adminUpdateProduct, adminDeleteProduct, adminGetProduct } from "@/lib/api/admin.functions";
import type { Category, Product } from "@/lib/database.types";
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
  createExistingImages,
  resolveGalleryUrls,
  formatActionError,
  type GalleryImage,
} from "@/lib/upload-product-image";

export const Route = createFileRoute("/pen/products/$id/edit")({
  ssr: false,
  head: () => ({ meta: [{ title: "Edit Product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  return (
    <AdminShell>
      <EditProductLoader id={id} />
    </AdminShell>
  );
}

function EditProductLoader({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void Promise.all([adminGetProduct({ data: { id } }), getCategories()])
      .then(([p, c]) => {
        if (!mounted) return;
        setProduct((p as Product) ?? null);
        setCategories(c as Category[]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-[10px] font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-muted-foreground">
        Product not found.{" "}
        <Link to="/pen/products" className="underline hover:text-accent">
          Back to products
        </Link>
      </div>
    );
  }

  return <EditProductForm product={product} categories={categories} />;
}

function initialGallery(product: Product): GalleryImage[] {
  const urls =
    product.gallery_urls?.length > 0
      ? product.gallery_urls
      : product.image_url
        ? [product.image_url]
        : [];
  return createExistingImages(urls);
}

function EditProductForm({ product, categories }: { product: Product; categories: Category[] }) {
  const navigate = useNavigate();
  const initialImages = useMemo(() => initialGallery(product), [product]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [primaryId, setPrimaryId] = useState<string | null>(initialImages[0]?.id ?? null);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(
    Array.isArray(product.colors) ? (product.colors as { name: string; hex: string }[]) : []
  );
  const [sizes, setSizes] = useState<string[]>(product.sizes ?? []);

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

      await adminUpdateProduct({
        data: {
          id: product.id,
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
      navigate({ to: "/pen/products" });
    } catch (err) {
      setError(formatActionError(err, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminDeleteProduct({ data: { id: product.id } });
      navigate({ to: "/pen/products" });
    } catch (err) {
      setError(formatActionError(err, "Delete failed"));
      setDeleting(false);
    }
  }

  const currentCategoryId =
    typeof product.category === "object" && product.category !== null
      ? (product.category as { id: string }).id
      : product.category_id ?? "";

  return (
      <div className="p-4 sm:p-8 max-w-2xl">
        <Link
          to="/pen/products"
          className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent mb-6 inline-block"
        >
          ← Back to products
        </Link>
        <header className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-1">Edit Product</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{product.name}</h1>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="self-start text-[10px] uppercase tracking-widest font-bold text-destructive border border-destructive px-4 py-2.5 hover:bg-destructive hover:text-white disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <ProductImageUploader
            label="Product images"
            hint="Add more photos or set which one appears first. The first image is the main shop photo."
            images={images}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            onSetPrimary={setPrimaryId}
            primaryId={primaryId}
          />

          <ProductFormFields
            categories={categories}
            defaults={{
              name: product.name,
              price: Number(product.price),
              category_id: currentCategoryId,
              inventory: product.inventory,
            }}
          />
          <ProductDescriptionField defaultValue={product.description ?? ""} />
          <ProductSizesField selected={sizes} onChange={setSizes} />
          <ProductColorsField colors={colors} onChange={setColors} />
          <ProductFlagsField featured={product.featured} isNew={product.is_new} />

          {error && (
            <div className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-widest font-semibold hover:bg-accent disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
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
  );
}
