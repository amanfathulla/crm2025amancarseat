import { createClient } from "@supabase/supabase-js";

const URL = "https://brxxmhnymhdlolelrjgy.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHhtaG55bWhkbG9sZWxyamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTIzNjQsImV4cCI6MjA1NTcyODM2NH0.stdRgr4-_QkZDTBhZizXJM_npCN3JxhWXhSIarzHzk4";

export const reviewsSupabase = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface Review {
  id: string;
  name: string;
  car_model: string;
  rating: number;
  review: string;
  images: string[] | null;
  video: string | null;
  created_at: string;
  avatar_url: string | null;
  quality_rating: number | null;
  price_rating: number | null;
}

export const BRANDS = [
  { key: "all", label: "Semua", match: () => true },
  { key: "proton", label: "Proton", match: (m: string) => /proton|saga|waja|wira|persona|preve|inspira|exora|iriz|x50|x70|x90/i.test(m) },
  { key: "perodua", label: "Perodua", match: (m: string) => /perodua|myvi|axia|bezza|alza|aruz|kancil|kembara|kelisa|kenari|viva|ativa/i.test(m) },
  { key: "honda", label: "Honda", match: (m: string) => /honda|civic|city|jazz|hrv|hr-v|brv|br-v|accord|crv|cr-v|odyssey|stream/i.test(m) },
  { key: "toyota", label: "Toyota", match: (m: string) => /toyota|vios|yaris|altis|camry|hilux|innova|fortuner|rush|sienta|avanza|estima|alphard|vellfire|harrier/i.test(m) },
  { key: "nissan", label: "Nissan", match: (m: string) => /nissan|almera|sylphy|serena|navara|x-trail|xtrail|grand livina|latio|sentra/i.test(m) },
  { key: "kia", label: "Kia", match: (m: string) => /\bkia\b|picanto|carnival|sorento|sportage|cerato|forte/i.test(m) },
  { key: "pickup", label: "Pickup", match: (m: string) => /pickup|hilux|navara|triton|ranger|d-?max|bt-?50/i.test(m) },
];

export function getBrandKeyFromSlug(slug?: string) {
  if (!slug) return "all";
  const found = BRANDS.find((b) => b.key === slug.toLowerCase());
  return found ? found.key : "all";
}
