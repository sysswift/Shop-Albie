/**
 * Database types for Shop Albie — Supabase PostgreSQL schema.
 *
 * SQL to create these tables is in supabase/schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          price: number;
          category_id: string | null;
          description: string | null;
          sizes: string[];
          colors: Json;
          inventory: number;
          featured: boolean;
          is_new: boolean;
          image_url: string | null;
          gallery_urls: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_phone: string;
          customer_location: string;
          special_request: string | null;
          total: number;
          status: "pending" | "confirmed" | "processing" | "shipped" | "fulfilled" | "cancelled";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_sku: string;
          size: string;
          color: string;
          qty: number;
          unit_price: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "fulfilled" | "cancelled";
    };
  };
}

/* ─── Convenience types used across the app ─── */

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Category;
};

export type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items?: OrderItem[];
};

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type OrderStatus = Database["public"]["Enums"]["order_status"];

/** A cart item stored in localStorage */
export type CartItem = {
  productId: string;
  productName: string;
  productSku: string;
  productCategory: string;
  imageUrl: string;
  size: string;
  color: string;
  unitPrice: number;
  qty: number;
};
