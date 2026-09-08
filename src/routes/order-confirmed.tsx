import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { WHATSAPP_NUMBER } from "@/lib/contact";

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: z.object({ orderId: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Shop Albie" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmed,
});

function OrderConfirmed() {
  const { orderId } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[var(--whatsapp)] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" className="size-8 fill-white" aria-hidden>
              <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
            </svg>
          </div>
          <p className="text-[10px] font-mono uppercase text-accent tracking-widest mb-3">Order saved</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Thank you! 🎉
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your order has been saved. A WhatsApp message should have opened — please press <strong>Send</strong> to confirm your order with the studio.
          </p>
          {orderId && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-4">
              Reference: {orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[var(--whatsapp)] text-white py-4 text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
          >
            Open WhatsApp
          </a>
          <Link
            to="/shop"
            className="block w-full border border-border py-4 text-xs uppercase tracking-widest font-semibold hover:bg-surface transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground mt-8 leading-relaxed">
          If WhatsApp didn't open automatically, tap the button above. The studio will confirm your order and arrange delivery details with you.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
