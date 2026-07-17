const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Upload a product image via the admin-upload-product-image Edge Function.
 *
 * Uses the File/Blob directly as the request body (application/octet-stream)
 * instead of Base64-encoding it into JSON.  Base64 inflates the payload by ~33%
 * and forces the browser to hold the entire file as a string in memory, which
 * causes blank screens / auto-refreshes when uploading multiple 5 MB images.
 */
export async function uploadProductImage(authClient: any, file: File, prefix = "product") {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format gambar tidak disokong. Gunakan JPG, PNG, WEBP atau GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Maksimum saiz fail 5MB.");
  }

  // Send metadata via headers; the raw file goes as the body.
  const { data, error } = await authClient.functions.invoke("admin-upload-product-image", {
    headers: {
      "x-file-name": encodeURIComponent(file.name),
      "x-content-type": file.type,
      "x-prefix": prefix,
    },
    body: file, // Blob/File — supabase-js sets Content-Type: application/octet-stream
  });

  if (error) throw new Error(error.message);

  const result = data as { publicUrl?: string; error?: string } | null;
  if (result?.error) throw new Error(result.error);
  if (!result?.publicUrl) throw new Error("URL gambar tidak diterima daripada server.");

  return result.publicUrl;
}
