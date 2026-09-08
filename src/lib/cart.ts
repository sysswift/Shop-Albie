import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "./database.types";
import { displaySizeLabel } from "./product-sizes";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (productId: string, size: string, color: string, qty: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const key = (item: Pick<CartItem, "productId" | "size" | "color">) =>
  `${item.productId}|${item.size}|${item.color ?? ""}`;

/** Size + optional colour for bag/checkout labels */
export function formatVariantLabel(size: string, color?: string) {
  const label = displaySizeLabel(size);
  const c = color?.trim();
  return c ? `${label} · ${c}` : label;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) => {
        set((state) => {
          const existing = state.items.find(
            (i) => key(i) === key(incoming)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                key(i) === key(incoming)
                  ? { ...i, qty: i.qty + incoming.qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, incoming] };
        });
      },

      updateQty: (productId, size, color, qty) => {
        if (qty < 1) {
          get().removeItem(productId, size, color);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            key(i) === key({ productId, size, color }) ? { ...i, qty } : i
          ),
        }));
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (i) => key(i) !== key({ productId, size, color })
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((s, i) => s + i.qty, 0),

      totalPrice: () =>
        get().items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    }),
    {
      name: "shopalbie-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as Storage)
      ),
      skipHydration: true,
    }
  )
);
