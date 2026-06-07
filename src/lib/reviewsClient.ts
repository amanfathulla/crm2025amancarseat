import { createClient } from "@supabase/supabase-js";

const URL = "https://brxxmhnymhdlolelrjgy.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeHhtaG55bWhkbG9sZWxyamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTIzNjQsImV4cCI6MjA1NTcyODM2NH0.stdRgr4-_QkZDTBhZizXJM_npCN3JxhWXhSIarzHzk4";

export const REVIEWS_BUCKET = "reviews";
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

// 17 brand kereta utama di Malaysia
export const CAR_BRANDS = [
  { key: "perodua", label: "Perodua", regex: /perodua|myvi|axia|bezza|alza|aruz|kancil|kembara|kelisa|kenari|viva|ativa|nautica|rusa/i },
  { key: "proton", label: "Proton", regex: /proton|saga|waja|wira|persona|preve|inspira|exora|iriz|x50|x70|x90|s70|satria|gen-?2|perdana|tiara/i },
  { key: "toyota", label: "Toyota", regex: /toyota|vios|yaris|altis|corolla|camry|hilux|innova|fortuner|rush|sienta|avanza|estima|alphard|vellfire|harrier|rav4|prius|veloz/i },
  { key: "honda", label: "Honda", regex: /honda|civic|city|jazz|hrv|hr-v|brv|br-v|wrv|wr-v|accord|crv|cr-v|odyssey|stream|freed|insight/i },
  { key: "nissan", label: "Nissan", regex: /nissan|almera|sylphy|serena|navara|x-trail|xtrail|grand livina|latio|sentra|teana|murano|note|leaf/i },
  { key: "mazda", label: "Mazda", regex: /mazda|cx-?3|cx-?5|cx-?8|cx-?9|cx-?30|mazda2|mazda3|mazda6|biante|mx-?5|bt-?50/i },
  { key: "mitsubishi", label: "Mitsubishi", regex: /mitsubishi|triton|outlander|asx|xpander|lancer|attrage|pajero|mirage|colt|grandis/i },
  { key: "hyundai", label: "Hyundai", regex: /hyundai|i10|i20|i30|elantra|sonata|tucson|santa-?fe|kona|starex|getz|accent|matrix/i },
  { key: "kia", label: "Kia", regex: /\bkia\b|picanto|carnival|sorento|sportage|cerato|forte|rio|optima|sedona|stonic|niro|carens/i },
  { key: "ford", label: "Ford", regex: /\bford\b|ranger|everest|fiesta|focus|mondeo|mustang|escape|ecosport|territory/i },
  { key: "chevrolet", label: "Chevrolet", regex: /chevrolet|chevy|cruze|aveo|spark|optra|colorado|captiva|trailblazer|sonic/i },
  { key: "suzuki", label: "Suzuki", regex: /suzuki|swift|sx4|vitara|jimny|ertiga|alto|baleno|celerio|s-?presso/i },
  { key: "subaru", label: "Subaru", regex: /subaru|impreza|forester|outback|xv|legacy|brz|wrx|crosstrek/i },
  { key: "volkswagen", label: "Volkswagen", regex: /volkswagen|\bvw\b|polo|golf|jetta|passat|tiguan|touareg|vento|beetle/i },
  { key: "bmw", label: "BMW", regex: /\bbmw\b|\b[1-8]\s?series\b|\b(?:1|2|3|4|5|6|7|8)(?:18|20|25|28|30|35|40|50)i\b|\bx[1-7]\b|\bm[2-8]\b/i },
  { key: "mercedes", label: "Mercedes-Benz", regex: /mercedes|merc|benz|\b[acegs]-?class\b|\b[acegs]\d{3}\b|gla|glb|glc|gle|gls|cla|amg|sprinter|vito|viano/i },
  { key: "audi", label: "Audi", regex: /\baudi\b|\ba[1-8]\b|\bq[2-8]\b|\brs[3-7]\b|\bs[3-8]\b|tt\b/i },
];

export const BRANDS = [
  { key: "all", label: "Semua", match: () => true },
  ...CAR_BRANDS.map((b) => ({ key: b.key, label: b.label, match: (m: string) => b.regex.test(m || "") })),
  { key: "pickup", label: "Pickup", match: (m: string) => /pickup|hilux|navara|triton|ranger|d-?max|bt-?50|colorado/i.test(m || "") },
];

export function getBrandKeyFromSlug(slug?: string) {
  if (!slug) return "all";
  const found = BRANDS.find((b) => b.key === slug.toLowerCase());
  return found ? found.key : "all";
}
