import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-session",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitizeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-80);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSession = req.headers.get("x-admin-session") || "";

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: adminId } = await supabase.rpc("validate_admin_session", { p_token: adminSession });
    if (!adminId) return json({ error: "Sesi admin tidak sah. Sila login semula." }, 401);

    const { fileName, contentType, fileBase64, prefix = "product" } = await req.json().catch(() => ({}));
    if (!fileName || !contentType || !fileBase64) return json({ error: "Fail gambar tidak lengkap." }, 400);
    if (!ALLOWED_TYPES.has(contentType)) return json({ error: "Format gambar tidak disokong." }, 400);

    const bytes = Uint8Array.from(atob(fileBase64), (char) => char.charCodeAt(0));
    if (bytes.byteLength > MAX_IMAGE_SIZE) return json({ error: "Maksimum saiz fail 5MB." }, 400);

    const safePrefix = String(prefix).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "product";
    const path = `${safePrefix}/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(fileName)}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, bytes, { contentType, upsert: false });

    if (uploadError) return json({ error: uploadError.message }, 400);

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return json({ path, publicUrl: data.publicUrl });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Ralat muat naik gambar." }, 500);
  }
});