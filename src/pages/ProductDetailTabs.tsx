import React, { useState } from "react";
import { Star, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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

function AccordionSection({
  title,
  count,
  children,
  defaultOpen,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-t border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 text-left"
      >
        <span className="text-white font-semibold text-[12px]">
          {title}{count != null ? ` (${count})` : ""}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${open ? "max-h-[55dvh] opacity-100 overflow-y-auto overscroll-contain" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div className="pb-3 pt-1">{children}</div>
      </div>
    </div>
  );
}

function ImageGallery({ images, fallback }: { images?: string[] | null; fallback?: string | null }) {
  const all = [...(images || [])];
  if (fallback && !all.includes(fallback)) all.unshift(fallback);
  const [idx, setIdx] = useState(0);
  if (all.length === 0) return <p className="text-white/40 text-[12px]">Tiada gambar produk.</p>;
  const go = (d: number) => setIdx(i => (i + d + all.length) % all.length);
  return (
    <div>
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30">
        <img src={all[idx]} alt={`Gambar ${idx + 1}`} className="w-full h-44 object-contain" />
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
}: {
  description?: string | null;
  reviews: DetailReview[];
  image_url?: string | null;
  images?: string[] | null;
  allReviews?: any[];
  productMaterial?: string | null;
  defaultMaterial?: string | null;
}) {
  // Kalau admin set material khusus (bukan "Semua"), feed TERUS filter — tak tunjuk picker "Semua"
  const isLocked = !!(defaultMaterial && defaultMaterial !== "Semua");
  const [matFilter, setMatFilter] = useState<string>(
    isLocked ? (defaultMaterial as string) : "Semua"
  );
  const list = (allReviews && allReviews.length ? allReviews : reviews) as any[];
  const filtered = matFilter === "Semua"
    ? list
    : list.filter(r => (r.material || "") === matFilter);

  return (
    <div className="bg-zinc-950 border-t border-white/10">
      <AccordionSection title="Penerangan Produk">
        <div className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
          {description || "Tiada penerangan untuk produk ini."}
        </div>
      </AccordionSection>

      <AccordionSection title="Gambar Produk">
        <ImageGallery images={images} fallback={image_url} />
      </AccordionSection>

      <AccordionSection title="Testimoni" count={filtered.length}>
        {/* Selector material — hanya tunjuk kalau admin set "Semua".
            Kalau admin set material khusus, feed TERUS filter (locked, tak boleh tukar) */}
        {!isLocked && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
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
        {isLocked && (
          <div className="mb-2.5 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold border border-red-600/40 bg-red-600/10 text-red-500">
              {matFilter}
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-white/40 text-[12px]">Tiada testimoni untuk bahan ini.</p>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto overscroll-contain">
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
              </div>
            ))}
          </div>
        )}
      </AccordionSection>
    </div>
  );
}
