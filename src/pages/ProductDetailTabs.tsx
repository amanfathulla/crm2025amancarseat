import React, { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

export interface DetailReview {
  id: string;
  name: string;
  car_model?: string | null;
  rating: number;
  review: string;
  images?: string[] | null;
  avatar_url?: string | null;
  created_at?: string;
  material?: string | null;
}

const MATERIALS = ["Kain Mesh", "Kain Nylon", "Kain Fullsilk", "Semi Leather Kalis Air"];

function ImageGallery({ images, fallback }: { images?: string[] | null; fallback?: string | null }) {
  const all = [...(images || [])];
  if (fallback && !all.includes(fallback)) all.unshift(fallback);
  const [idx, setIdx] = useState(0);
  if (all.length === 0) return <p className="text-white/40 text-[12px]">Tiada gambar produk.</p>;
  const go = (d: number) => setIdx(i => (i + d + all.length) % all.length);
  return (
    <div>
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30">
        <img src={all[idx]} alt={`Gambar ${idx + 1}`} className="w-full h-40 object-contain" />
        {all.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white/90">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white/90">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
              {all.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <p className="text-center text-white/40 text-[10px] mt-1">{idx + 1} / {all.length}</p>
    </div>
  );
}

export function ProductDetailTabs({
  description,
  reviews,
  image_url,
  images,
  allReviews,
  productMaterial,
  defaultMaterial,
  defaultProduk,
}: {
  description?: string | null;
  reviews: DetailReview[];
  image_url?: string | null;
  images?: string[] | null;
  allReviews?: any[];
  productMaterial?: string | null;
  defaultMaterial?: string | null;
  defaultProduk?: string | null; // product_id — kalau diset, feed TERUS filter produk ni
}) {
  const [tab, setTab] = useState<"desc" | "gambar" | "testimoni" | null>(null);
  const isLocked = !!(defaultMaterial && defaultMaterial !== "Semua");
  const isProdukLocked = !!defaultProduk && defaultProduk !== "all";
  const [matFilter, setMatFilter] = useState<string>(
    isLocked ? (defaultMaterial as string) : "Semua"
  );
  const list = (allReviews && allReviews.length ? allReviews : reviews) as any[];
  // SEMUA testimoni (bukan pinned sahaja) — unlimited ikut produk
  let filtered = matFilter === "Semua"
    ? list
    : list.filter(r => (r.material || "") === matFilter);
  // Kalau produk diset (admin pilih produk), TERUS filter produk tu
  if (isProdukLocked) {
    filtered = filtered.filter(r => r.warna === defaultProduk);
  }
  // Buang warnaOptions + warnaFilter — tak perlu lagi sebab auto-filter

  return (
    <div
      className="bg-zinc-950/95 backdrop-blur-sm"
      onWheel={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
    >
      {/* ── Tab bar (satu baris) ── */}
      <div className="flex border-b border-white/10">
        {[
          { key: "desc" as const, label: "Detail" },
          { key: "gambar" as const, label: "Gambar" },
          { key: "testimoni" as const, label: `Testimoni (${filtered.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(prev => prev === t.key ? null : t.key)}
            className={`flex-1 py-2 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-red-600 text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content (satu je, max-h, scroll dalam) ── */}
      {tab && (
        <div className="max-h-[40dvh] overflow-y-auto overscroll-contain px-1 py-2"
          style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
        >
        {tab === "desc" && (
          <div className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
            {description || "Tiada penerangan untuk produk ini."}
          </div>
        )}

        {tab === "gambar" && (
          <ImageGallery images={images} fallback={image_url} />
        )}

        {tab === "testimoni" && (
          <>
            {!isLocked && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button
                  onClick={() => setMatFilter("Semua")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                    matFilter === "Semua"
                      ? "border-red-600 bg-red-600/15 text-red-600"
                      : "border-white/15 bg-white/5 text-white/70"
                  }`}
                >
                  Semua
                </button>
                {MATERIALS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMatFilter(m)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                      matFilter === m
                        ? "border-red-600 bg-red-600/15 text-red-600"
                        : "border-white/15 bg-white/5 text-white/70"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {(isLocked || isProdukLocked) && (
              <div className="mb-2 text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold border border-red-600/40 bg-red-600/10 text-red-500">
                  {isProdukLocked ? defaultProduk : matFilter}
                </span>
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="text-white/40 text-[12px]">Tiada testimoni untuk bahan ini.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map(r => (
                  <div key={r.id} className="bg-white/5 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.name} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-white text-[11px] font-semibold">{r.name}</span>
                      {r.material && (
                        <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-full ml-1">{r.material}</span>
                      )}
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/60 text-[11px] leading-snug">{r.review}</p>
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto overscroll-contain">
                        {r.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt={`${r.name} - gambar ${i + 1}`}
                            className="h-16 w-16 rounded-md object-cover border border-white/10 shrink-0"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
