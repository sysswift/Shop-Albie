import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WhatsAppOrderForm, type WhatsAppOrderFormData } from "@/components/whatsapp-order-form";
import { useCart, formatVariantLabel } from "@/lib/cart";
import { whatsappUrl } from "@/lib/contact";
import { buildWhatsAppOrderMessage } from "@/lib/whatsapp-order-message";
import type { CartItem } from "@/lib/database.types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Shop Albie" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function cartItemsToProductLines(items: CartItem[]) {
  return items.map((item) => ({
    productName: item.productName,
    category: item.productCategory,
    size: item.size,
    color: item.color,
    quantity: item.qty,
  }));
}

function Checkout() {
  const { items, totalPrice, clearCart } = useCart();

  function onSubmit(data: WhatsAppOrderFormData) {
    if (items.length === 0) return;
    const message = buildWhatsAppOrderMessage(data, cartItemsToProductLines(items));
    clearCart();
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-2">Checkout</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Complete your order</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in your details and WhatsApp will open with your order ready to send.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border">
            <p className="text-xl font-semibold mb-4">Your bag is empty</p>
            <Link to="/shop" className="text-[10px] font-mono uppercase tracking-widest underline hover:text-accent">
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">
            {/* Form */}
            <div className="order-2 lg:order-1 space-y-3">
              <WhatsAppOrderForm onSubmit={onSubmit} submitLabel="Place Order via WhatsApp" />
              <p className="text-[11px] text-muted-foreground text-center">
                WhatsApp will open with your order details ready — just press Send.
              </p>
            </div>

            {/* Order summary */}
            <aside className="border border-border bg-surface p-4 sm:p-6 h-fit lg:sticky lg:top-24 order-1 lg:order-2">
              <h2 className="text-[10px] font-mono uppercase tracking-widest font-bold mb-5">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.productId}|${item.size}|${item.color}`} className="flex gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-14 h-16 object-cover shrink-0 bg-background" />
                    ) : (
                      <div className="w-14 h-16 bg-background shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatVariantLabel(item.size, item.color)} · ×{item.qty}
                      </p>
                      <p className="text-sm font-mono mt-1">₵{(item.unitPrice * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="text-xl font-mono font-semibold">₵{totalPrice().toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Final price confirmed by the studio via WhatsApp. Payment arranged on delivery or as agreed.
              </p>
            </aside>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
