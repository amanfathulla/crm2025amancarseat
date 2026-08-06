import { useMemo, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";

interface Props {
  material: string;
  pageSize?: number;
}

export default function MaterialTestimonials({ material, pageSize = 6 }: Props) {
  const { reviews, loading, materials, pins } = useReviews();
  const [page, setPage] = useState(1);

  const list = useMemo(() => {
    const filtered = reviews.filter((r) => materials[r.id] === material);
    return filtered.sort((a, b) => {
      const pa = pins[a.id];
      const pb = pins[b.id];
      if (pa !== undefined && pb !== undefined) return pa - pb;
      if (pa !== undefined) return -1;
      if (pb !== undefined) return 1;
      return 0;
    });
  }, [reviews, materials, pins, material]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">Testimoni {material}</h3>
          <p className="text-white/50 text-xs">{list.length} review sebenar pelanggan</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-white/40 text-sm">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memuatkan testimoni...
        </div>
      ) : items.length === 0 ? (
        <p className="text-white/40 text-sm py-6 text-center bg-white/3 rounded-xl border border-white/8">
          Belum ada testimoni untuk material ini.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((r) => {
            const images = (r.images ?? []).filter(Boolean);
            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/4 p-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate text-sm">{r.name || "ACS Customer"}</p>
                    <p className="text-white/45 text-xs truncate">{r.car_model || "—"}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < (r.rating || 5) ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                      />
                    ))}
                  </div>
                </div>
                {r.review && <p className="text-white/70 text-sm italic line-clamp-3">"{r.review}"</p>}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {images.slice(0, 3).map((src, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-black/40 border border-white/5">
                        <img src={src} alt={`Testimoni ${material} ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="min-w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold disabled:opacity-40 hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-9 h-9 px-3 rounded-lg border text-sm font-semibold transition-colors ${
                p === currentPage
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="min-w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold disabled:opacity-40 hover:bg-white/10 transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
