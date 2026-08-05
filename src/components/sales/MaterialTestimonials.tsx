import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2, ArrowRight } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { MATERIAL_SLUGS } from "@/lib/reviewMaterials";

interface Props {
  material: string;
  limit?: number;
}

export default function MaterialTestimonials({ material, limit = 6 }: Props) {
  const { reviews, loading, materials } = useReviews();

  const list = useMemo(
    () => reviews.filter((r) => materials[r.id] === material),
    [reviews, materials, material]
  );

  const slug = MATERIAL_SLUGS[material];
  const items = list.slice(0, limit);

  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">Testimoni {material}</h3>
          <p className="text-white/50 text-xs">{list.length} review sebenar pelanggan</p>
        </div>
        {slug && (
          <Link
            to={`/testimoni/${slug}`}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 transition-colors"
          >
            Lihat semua <ArrowRight className="h-3 w-3" />
          </Link>
        )}
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

      {slug && (
        <Link
          to={`/testimoni/${slug}`}
          className="mt-4 flex items-center justify-center gap-2 h-11 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
        >
          Lihat semua testimoni {material} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
