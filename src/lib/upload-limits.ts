/** Shared upload constraints used by both the client and server. */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_MB = 5;

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type.toLowerCase());
}

/** Returns an error message if the file is invalid, otherwise null. */
export function validateImageFile(file: { type: string; size: number; name: string }): string | null {
  if (!isAllowedImageType(file.type)) {
    return `"${file.name}" is not a supported image. Use JPG, PNG, WEBP, or GIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max is ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}
