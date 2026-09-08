import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase-admin.server";
import { adminAuthMiddleware } from "../admin-auth.middleware";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "../upload-limits";
import { throwServerError } from "../server-errors";

const ImageContentTypeSchema = z
  .string()
  .refine((t) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(t.toLowerCase()), {
    message: "Unsupported image type. Use JPG, PNG, WEBP, or GIF.",
  });

/* ─── Products ─────────────────────────────────────────────────────────────── */

const ProductUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().positive(),
  category_id: z.union([z.string().uuid(), z.literal(""), z.null()]).transform((v) => v || null),
  description: z.string().nullable(),
  sizes: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  inventory: z.number().int().min(0),
  featured: z.boolean(),
  is_new: z.boolean(),
  image_url: z.string().nullable(),
  gallery_urls: z.array(z.string()),
});

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(ProductUpsertSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const autoSku = `ALB-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      ...data,
      sku: data.sku?.trim() || autoSku,
      category_id: data.category_id || null,
      colors: data.colors ?? [],
    };
    const { data: product, error } = await getSupabaseAdmin()
      .from("products")
      .insert(payload)
      .select()
      .single();
    if (error) throwServerError("adminCreateProduct", error, "Could not create product.");
    return product;
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(ProductUpsertSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      category_id: rest.category_id || null,
      colors: rest.colors ?? [],
    };
    const { data: product, error } = await getSupabaseAdmin()
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throwServerError("adminUpdateProduct", error, "Could not update product.");
    return product;
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await getSupabaseAdmin().from("products").delete().eq("id", data.id);
    if (error) throwServerError("adminDeleteProduct", error, "Could not delete product.");
    return { success: true };
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: product, error } = await getSupabaseAdmin()
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", data.id)
      .single();
    if (error) throwServerError("adminGetProduct", error, "Could not load product.");
    return product;
  });

/* ─── Categories ───────────────────────────────────────────────────────────── */

const CategoryUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  image_url: z.string().nullable(),
  sort_order: z.number().int().min(0),
});

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(CategoryUpsertSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const { data: cat, error } = await getSupabaseAdmin()
      .from("categories")
      .insert(data)
      .select()
      .single();
    if (error) throwServerError("adminCreateCategory", error, "Could not create category.");
    return cat;
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(CategoryUpsertSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const { data: cat, error } = await getSupabaseAdmin()
      .from("categories")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throwServerError("adminUpdateCategory", error, "Could not update category.");
    return cat;
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await getSupabaseAdmin().from("categories").delete().eq("id", data.id);
    if (error) throwServerError("adminDeleteCategory", error, "Could not delete category.");
    return { success: true };
  });

/* ─── Image Upload (Supabase Storage) ─────────────────────────────────────── */

/** Signed upload URL — client PUTs the file directly to Supabase Storage (best for large photos). */
export const adminGetImageUploadUrl = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(
    z.object({
      fileName: z.string().min(1).max(200),
      contentType: ImageContentTypeSchema,
      fileSize: z.number().int().min(1).max(MAX_IMAGE_BYTES),
    }),
  )
  .handler(async ({ data }) => {
    if (data.fileSize > MAX_IMAGE_BYTES) {
      throw new Error(`Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`);
    }

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${safeName}`;

    const { data: signed, error } = await getSupabaseAdmin().storage
      .from("product-images")
      .createSignedUploadUrl(path);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("does not exist") || msg.includes("bucket")) {
        throw new Error(
          'Storage bucket "product-images" is missing. Run supabase/storage-setup.sql in the Supabase SQL Editor, then try again.',
        );
      }
      throwServerError("adminGetImageUploadUrl", error, "Could not prepare image upload.");
    }

    return { signedUrl: signed.signedUrl, path };
  });

/** Server-side upload for small payloads only (kept as fallback). */
export const adminUploadProductImage = createServerFn({ method: "POST" })
  .middleware([adminAuthMiddleware])
  .inputValidator(
    z.object({
      fileName: z.string().min(1).max(200),
      contentType: ImageContentTypeSchema,
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(data.base64, "base64");

    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`);
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from("product-images").upload(path, bytes, {
      contentType: data.contentType,
      upsert: false,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("does not exist") || msg.includes("bucket")) {
        throw new Error(
          'Storage bucket "product-images" is missing. In Supabase go to Storage → New bucket → name it "product-images" and set it to Public, then try again.',
        );
      }
      throwServerError("adminUploadProductImage", error, "Could not upload image.");
    }

    const { data: urlData } = admin.storage.from("product-images").getPublicUrl(path);
    return { publicUrl: urlData.publicUrl, path };
  });

export const adminGetPublicImageUrl = (path: string): string => {
  const { data } = getSupabaseAdmin().storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};
