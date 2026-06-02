const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca fail gambar"));
    reader.readAsDataURL(file);
  });

export async function uploadProductImage(authClient: any, file: File, prefix = "product") {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format gambar tidak disokong. Gunakan JPG, PNG, WEBP atau GIF.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Maksimum saiz fail 5MB.");
  }

  const fileBase64 = await fileToBase64(file);
  const { data, error } = await authClient.functions.invoke("admin-upload-product-image", {
    body: {
      fileName: file.name,
      contentType: file.type,
      fileBase64,
      prefix,
    },
  });

  if (error) throw new Error(error.message);

  const result = data as { publicUrl?: string; error?: string } | null;
  if (result?.error) throw new Error(result.error);
  if (!result?.publicUrl) throw new Error("URL gambar tidak diterima daripada server.");

  return result.publicUrl;
}