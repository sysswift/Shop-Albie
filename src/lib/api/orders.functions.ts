import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../supabase-admin.server";
import { adminAuthMiddleware } from "../admin-auth.middleware";
import { throwServerError } from "../server-errors";
import type { Order } from "../database.types";

const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200),
  productSku: z.string().min(1).max(64),
  size: z.string().min(1).max(40),
  color: z.string().max(40).optional().default(""),
  qty: z.number().int().min(1).max(999),
  unitPrice: z.number().positive().max(1_000_000),
});

const CreateOrderSchema = z.object({
  customerName: z.string().min(2, "Full name is required").max(120),
  customerPhone: z.string().min(7, "Phone number is required").max(30),
  customerLocation: z.string().min(2, "Location is required").max(200),
  specialRequest: z.string().max(1000).optional(),
  items: z
    .array(OrderItemSchema)
    .min(1, "At least one item is required")
    .max(100, "Too many items in one order"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

/** Disabled — checkout is WhatsApp-only. Prevents unauthenticated order spam and price tampering. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(CreateOrderSchema)
  .handler(async () => {
    throw new Error("Online order submission is not available. Please order via WhatsApp.");
  });

/** Admin — list all orders with items */
export const adminGetOrders = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .handler(
  async (): Promise<Order[]> => {
    try {
      if (!isSupabaseAdminConfigured()) return [];
      const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) { console.warn("[adminGetOrders]", error.message); return []; }
      return (data as Order[]) ?? [];
    } catch {
      return [];
    }
  }
);

/** Admin — update order status */
export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "processing", "shipped", "fulfilled", "cancelled"]),
    })
  )
  .handler(async ({ data }) => {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throwServerError("adminUpdateOrderStatus", error, "Could not update order status.");
    return { success: true };
  });
