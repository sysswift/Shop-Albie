import { adminGetImageUploadUrl } from "@/lib/api/admin.functions";
import { supabase } from "@/lib/supabase";
import { validateImageFile } from "@/lib/upload-limits";

export type PendingImage = {
  id: string;
  file: File;
  preview: string;
  source: "new";
};

export type ExistingImage = {
  id: string;
  url: string;
  preview: string;
  source: "existing";
};

export type GalleryImage = PendingImage | ExistingImage;

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_") || "image.jpg";
}

/** Turn vague network errors into something actionable in the admin UI. */
export function formatActionError(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) {
    const cause = err.cause instanceof Error ? err.cause.message : "";
    const msg = [err.message, cause].filter(Boolean).join(" — ");

    if (/fetch failed/i.test(msg)) {
      return "Could not reach the server. Check your connection and try again.";
    }
    return msg || fallback;
  }
  return fallback;
}

/** @deprecated Use formatActionError */
export const formatUploadError = formatActionError;

/**
 * Upload via a short-lived signed URL so large photos never pass through the app server.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const fileName = safeFileName(file.name);
  const contentType = file.type || "image/jpeg";

  let signedUrl: string;
  let path: string;

  try {
    const result = await adminGetImageUploadUrl({
      data: { fileName, contentType, fileSize: file.size },
    });
    signedUrl = result.signedUrl;
    path = result.path;
  } catch (err) {
    throw new Error(formatActionError(err, `Could not upload "${file.name}"`));
  }

  let response: Response;
  try {
    response = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    throw new Error(formatActionError(err, `Could not upload "${file.name}"`));
  }

  if (!response.ok) {
    throw new Error(
      `Could not upload "${file.name}" (${response.status}). Confirm the product-images bucket is public in Supabase Storage.`
    );
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadProductImage(file));
  }
  return urls;
}

export function createPendingImages(files: FileList | File[]): PendingImage[] {
  return Array.from(files).map((file) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
    source: "new" as const,
  }));
}

export function createExistingImages(urls: string[]): ExistingImage[] {
  return urls.map((url, index) => ({
    id: `existing-${index}-${url.slice(-12)}`,
    url,
    preview: url,
    source: "existing" as const,
  }));
}

export async function resolveGalleryUrls(images: GalleryImage[]): Promise<string[]> {
  const urls: string[] = [];
  for (const img of images) {
    if (img.source === "existing") {
      urls.push(img.url);
    } else {
      urls.push(await uploadProductImage(img.file));
    }
  }
  return urls;
}

export function revokePendingPreviews(images: GalleryImage[]) {
  for (const img of images) {
    if (img.source === "new") URL.revokeObjectURL(img.preview);
  }
}
