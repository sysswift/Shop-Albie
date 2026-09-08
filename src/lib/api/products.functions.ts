import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase-admin.server";
import type { Product, Category } from "../database.types";

const db = () => getSupabaseAdmin();

/** Fetch all categories ordered by sort_order */
export const getCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    try {
      const { data, error } = await db()
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) { console.warn("[getCategories]", error.message); return []; }
      return data ?? [];
    } catch (err) {
      console.warn("[getCategories]", err);
      return [];
    }
  }
);

/** Fetch all products with their category */
export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    try {
      const { data, error } = await db()
        .from("products")
        .select("*, category:categories(*)")
        .order("created_at", { ascending: false });
      if (error) { console.warn("[getProducts]", error.message); return []; }
      return (data as Product[]) ?? [];
    } catch (err) {
      console.warn("[getProducts]", err);
      return [];
    }
  }
);

/** Fetch a single product by slug */
export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }): Promise<Product | null> => {
    try {
      const { data: product, error } = await db()
        .from("products")
        .select("*, category:categories(*)")
        .eq("slug", data.slug)
        .single();
      if (error) return null;
      return product as Product;
    } catch (err) {
      console.warn("[getProductBySlug]", err);
      return null;
    }
  });

/** Fetch featured products */
export const getFeaturedProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    try {
      const { data, error } = await db()
        .from("products")
        .select("*, category:categories(*)")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) { console.warn("[getFeaturedProducts]", error.message); return []; }
      return (data as Product[]) ?? [];
    } catch (err) {
      console.warn("[getFeaturedProducts]", err);
      return [];
    }
  }
);

/** Fetch new arrival products */
export const getNewArrivals = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    try {
      const { data, error } = await db()
        .from("products")
        .select("*, category:categories(*)")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) { console.warn("[getNewArrivals]", error.message); return []; }
      return (data as Product[]) ?? [];
    } catch (err) {
      console.warn("[getNewArrivals]", err);
      return [];
    }
  }
);

/** Fetch products filtered by category slug */
export const getProductsByCategory = createServerFn({ method: "GET" })
  .inputValidator(z.object({ categorySlug: z.string() }))
  .handler(async ({ data }): Promise<Product[]> => {
    try {
      const { data: cat } = await db()
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .single();
      if (!cat) return [];
      const { data: products, error } = await db()
        .from("products")
        .select("*, category:categories(*)")
        .eq("category_id", cat.id)
        .order("created_at", { ascending: false });
      if (error) { console.warn("[getProductsByCategory]", error.message); return []; }
      return (products as Product[]) ?? [];
    } catch (err) {
      console.warn("[getProductsByCategory]", err);
      return [];
    }
  });
