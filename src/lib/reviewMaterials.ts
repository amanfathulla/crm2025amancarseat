import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 4 kategori material produk ACS */
export const REVIEW_MATERIALS = [
  "Kain Mesh",
  "Kain Nylon",
  "Kain Fullsilk",
  "Semi Leather Kalis Air",
] as const;

export type ReviewMaterial = (typeof REVIEW_MATERIALS)[number];

/** Padankan slug material dari URL /order/material... kepada label rasmi */
export function matchMaterialLabel(input?: string | null): string | null {
  if (!input) return null;
  const s = input.toLowerCase().replace(/[^a-z]/g, "");
  if (s.includes("mesh")) return "Kain Mesh";
  if (s.includes("nylon")) return "Kain Nylon";
  if (s.includes("fullsilk") || s.includes("silk")) return "Kain Fullsilk";
  if (s.includes("leather") || s.includes("semileather")) return "Semi Leather Kalis Air";
  return null;
}

/** Ambil peta review_id -> material */
export async function fetchReviewMaterials(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("review_materials")
    .select("review_id, material")
    .limit(5000);
  if (error) {
    console.error("fetchReviewMaterials", error.message);
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.review_id] = row.material;
  return map;
}

/** Simpan / kemas kini material untuk satu review */
export async function saveReviewMaterial(
  reviewId: string,
  material: string,
  client: SupabaseClient<any> = supabase as unknown as SupabaseClient<any>
) {
  const { error } = await client
    .from("review_materials")
    .upsert({ review_id: reviewId, material }, { onConflict: "review_id" });
  if (error) throw error;
}

/** Slug URL untuk setiap material (untuk /testimoni/:slug) */
export const MATERIAL_SLUGS: Record<string, string> = {
  "Kain Mesh": "kainmesh",
  "Kain Nylon": "kainnylon",
  "Kain Fullsilk": "kainfullsilk",
  "Semi Leather Kalis Air": "semileather",
};

/** Dapatkan label material daripada slug URL (terima pelbagai variasi ejaan) */
export function materialFromSlug(slug?: string | null): string | null {
  if (!slug) return null;
  return matchMaterialLabel(slug);
}

/** Ambil peta review_id -> pin_order untuk review yang dipin */
export async function fetchPinnedReviews(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("review_materials")
    .select("review_id, pin_order, pinned")
    .eq("pinned", true)
    .limit(500);
  if (error) {
    console.error("fetchPinnedReviews", error.message);
    return {};
  }
  const map: Record<string, number> = {};
  for (const row of data ?? []) map[(row as any).review_id] = (row as any).pin_order ?? 0;
  return map;
}

/** Tetapkan status pin untuk satu review (perlu material) */
export async function setReviewPin(
  reviewId: string,
  material: string,
  pinned: boolean,
  pinOrder: number | null,
  client: SupabaseClient<any> = supabase as unknown as SupabaseClient<any>
) {
  const { error } = await client
    .from("review_materials")
    .upsert(
      { review_id: reviewId, material, pinned, pin_order: pinned ? pinOrder ?? 0 : null },
      { onConflict: "review_id" }
    );
  if (error) throw error;
}
