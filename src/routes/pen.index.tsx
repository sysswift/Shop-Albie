import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getProducts } from "@/lib/api/products.functions";
import { adminGetOrders } from "@/lib/api/orders.functions";
import type { Order, Product } from "@/lib/database.types";

export const Route = createFileRoute("/pen/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — Shop Albie Admin" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}

function DashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void Promise.all([getProducts(), adminGetOrders()])
      .then(([p, o]) => {
        if (!mounted) return;
        setProducts(p as Product[]);
        setOrders(o);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totalInventory = products.reduce((s, p) => s + p.inventory, 0);
  const lowStock = products.filter((p) => p.inventory < 10);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const stats = [
    { label: "Total Products", value: `${products.length}` },
    { label: "Total Inventory", value: `${totalInventory}` },
    { label: "Total Orders", value: `${orders.length}` },
    { label: "Revenue (non-cancelled)", value: `₵${totalRevenue.toFixed(2)}` },
  ];

  return (
    <div className="p-6 sm:p-10 max-w-6xl">
        <header className="mb-10">
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-2">Overview</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Studio dashboard</h1>
          {loading && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2 animate-pulse">
              Loading…
            </p>
          )}
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="p-6 border border-border bg-surface">
              <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2">{s.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Low stock */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm uppercase font-bold tracking-widest">Low stock</h2>
            <Link to="/pen/products" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground border border-dashed border-border text-center">
              All products are well-stocked.
            </p>
          ) : (
            <div className="border border-border bg-background">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-4 min-w-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" loading="lazy" className="size-12 object-cover shrink-0" />
                    ) : (
                      <div className="size-12 bg-surface shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-destructive shrink-0">{p.inventory} left</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending orders */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm uppercase font-bold tracking-widest">
              Pending orders {pendingOrders.length > 0 && <span className="text-accent">({pendingOrders.length})</span>}
            </h2>
            <Link to="/pen/orders" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors">
              View all →
            </Link>
          </div>
          {pendingOrders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground border border-dashed border-border text-center">
              No pending orders.
            </p>
          ) : (
            <div className="border border-border bg-background">
              {pendingOrders.slice(0, 5).map((o) => (
                <div key={o.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-border last:border-b-0 items-center">
                  <div>
                    <p className="text-sm font-medium">{o.customer_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{o.customer_phone} · {o.customer_location}</p>
                  </div>
                  <span className="font-mono text-sm">₵{Number(o.total).toFixed(2)}</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-yellow-600 border border-yellow-200 bg-yellow-50 px-2 py-1">
                    pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
  );
}
