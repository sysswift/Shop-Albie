import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { adminGetOrders, adminUpdateOrderStatus } from "@/lib/api/orders.functions";
import type { Order, OrderStatus } from "@/lib/database.types";

export const Route = createFileRoute("/pen/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "Orders — Admin" }, { name: "robots", content: "noindex" }] }),
  component: OrdersAdmin,
});

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  processing: "text-purple-600 bg-purple-50 border-purple-200",
  shipped: "text-indigo-600 bg-indigo-50 border-indigo-200",
  fulfilled: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

function OrderRow({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleStatusChange(newStatus: OrderStatus) {
    setUpdating(true);
    try {
      await adminUpdateOrderStatus({ data: { orderId: order.id, status: newStatus } });
      setStatus(newStatus);
    } finally {
      setUpdating(false);
    }
  }

  const items = order.order_items ?? [];

  return (
    <>
      <tr
        className="border-b border-border hover:bg-surface/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="p-4 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</td>
        <td className="p-4">
          <p className="font-medium text-sm">{order.customer_name}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{order.customer_phone}</p>
        </td>
        <td className="p-4 text-sm text-muted-foreground">{order.customer_location}</td>
        <td className="p-4 font-mono text-sm">₵{Number(order.total).toFixed(2)}</td>
        <td className="p-4">
          <select
            value={status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            disabled={updating}
            className={`text-[10px] uppercase tracking-widest font-bold border px-2 py-1 focus:outline-none cursor-pointer ${STATUS_COLORS[status]}`}
          >
            {(["pending", "confirmed", "processing", "shipped", "fulfilled", "cancelled"] as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </td>
        <td className="p-4 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
          {new Date(order.created_at).toLocaleDateString("en-GH")}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-surface">
          <td colSpan={6} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Items */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest mb-2">Order items</p>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="text-xs flex justify-between border-b border-border/50 pb-1">
                        <span>{item.product_name} · {item.size} · {item.color} ×{item.qty}</span>
                        <span className="font-mono">₵{(Number(item.unit_price) * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Customer note */}
              <div>
                {order.special_request && (
                  <>
                    <p className="text-[10px] uppercase font-bold tracking-widest mb-2">Special request</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{order.special_request}</p>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function OrdersAdmin() {
  return (
    <AdminShell>
      <OrdersContent />
    </AdminShell>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void adminGetOrders()
      .then((o) => {
        if (mounted) setOrders(o);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
      <div className="p-6 sm:p-10">
        <header className="mb-10">
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-2">Incoming</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-2">Click a row to expand order details.</p>
        </header>

        {loading ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest animate-pulse">Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-3">Empty</p>
            <p className="text-xl font-semibold">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">Orders will appear here once customers place requests via WhatsApp checkout.</p>
          </div>
        ) : (
          <div className="border border-border bg-background overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">ID</th>
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Customer</th>
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Location</th>
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Total</th>
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
