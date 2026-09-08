import { Link } from "@tanstack/react-router";
import { useCart, formatVariantLabel } from "@/lib/cart";

interface BagDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function BagDrawer({ open, onClose }: BagDrawerProps) {
  const { items, updateQty, removeItem, totalPrice, clearCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-background z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-[var(--ease-out-expo)] pb-[env(safe-area-inset-bottom,0px)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your</p>
            <h2 className="text-lg font-semibold tracking-tight">Bag ({items.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
              <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Empty</p>
              <p className="text-base font-semibold">Your bag is empty</p>
              <p className="text-sm text-muted-foreground">Browse our collection and add a product.</p>
              <Link
                to="/shop"
                onClick={onClose}
                className="mt-2 text-[10px] font-mono uppercase tracking-widest border border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors"
              >
                Shop now
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}|${item.size}|${item.color}`}
                className="flex gap-3 pb-5 border-b border-border last:border-b-0"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-20 h-24 object-cover shrink-0 bg-surface"
                  />
                ) : (
                  <div className="w-20 h-24 shrink-0 bg-surface" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-0.5">
                    {item.productCategory}
                  </p>
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {formatVariantLabel(item.size, item.color)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex border border-border">
                      <button
                        onClick={() =>
                          updateQty(item.productId, item.size, item.color, item.qty - 1)
                        }
                        className="w-8 h-8 hover:bg-surface transition-colors text-sm"
                      >
                        −
                      </button>
                      <span className="w-8 h-8 grid place-items-center font-mono text-xs border-x border-border">
                        {item.qty}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.productId, item.size, item.color, item.qty + 1)
                        }
                        className="w-8 h-8 hover:bg-surface transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-mono">
                      ₵{(item.unitPrice * item.qty).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive mt-2 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t border-border space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="text-lg font-mono font-semibold">₵{totalPrice().toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full bg-foreground text-background py-4 text-xs uppercase tracking-widest font-semibold text-center hover:bg-accent transition-colors"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={() => { clearCart(); onClose(); }}
              className="block w-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-destructive text-center py-2 transition-colors"
            >
              Clear bag
            </button>
          </div>
        )}
      </div>
    </>
  );
}
