import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getCategories } from "@/lib/api/products.functions";
import { adminCreateCategory, adminDeleteCategory } from "@/lib/api/admin.functions";
import { useRouter } from "@tanstack/react-router";
import type { Category } from "@/lib/database.types";

export const Route = createFileRoute("/pen/categories")({
  ssr: false,
  head: () => ({ meta: [{ title: "Categories — Admin" }, { name: "robots", content: "noindex" }] }),
  loader: () => getCategories(),
  component: CategoriesAdmin,
});

const inputCls = "w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors";

function CategoriesAdmin() {
  const categories = Route.useLoaderData() as Category[];
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminCreateCategory({
        data: { name, slug, image_url: null, sort_order: sortOrder },
      });
      setName("");
      setSlug("");
      setSortOrder(0);
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Delete category "${catName}"? Products in this category will become uncategorised.`)) return;
    try {
      await adminDeleteCategory({ data: { id } });
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <div className="p-6 sm:p-10 max-w-5xl">
        <header className="mb-10">
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-2">Taxonomy</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Categories</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* List */}
          <div className="border border-border bg-background">
            {categories.length === 0 ? (
              <p className="p-10 text-sm text-muted-foreground text-center">
                No categories yet. Create your first one →
              </p>
            ) : (
              categories.map((c, i) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[40px_1fr_auto] items-center gap-4 p-4 border-b border-border last:border-b-0"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">/{c.slug}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-[10px] uppercase font-bold tracking-widest text-destructive hover:opacity-70 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Create form */}
          <aside className="border border-border bg-surface p-6 h-fit">
            <h2 className="text-[10px] uppercase font-bold tracking-widest mb-5">Add Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Hair Bonnets"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">Slug *</label>
                <input
                  className={inputCls}
                  placeholder="hair-bonnets"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest mb-2 block">Sort order</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10))}
                />
              </div>
              {error && <p className="text-[11px] text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-foreground text-background py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-accent disabled:opacity-60 transition-colors"
              >
                {saving ? "Creating…" : "Create category"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
