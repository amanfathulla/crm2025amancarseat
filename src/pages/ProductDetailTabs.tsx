import React, { useState } from "react";
import { Star, Check } from "lucide-react";

export interface DetailReview {
  id: string;
  name: string;
  car_model?: string | null;
  rating: number;
  review: string;
  images?: string[] | null;
  avatar_url?: string | null;
  created_at?: string;
}

export function ProductDetailTabs({
  description,
  reviews,
  image_url,
  defaultTab = "desc",
}: {
  description?: string | null;
  reviews: DetailReview[];
  image_url?: string | null;
  defaultTab?: "desc" | "review";
}) {
  const [tab, setTab] = useState<"desc" | "review">(defaultTab);
  return (
    <div className="bg-zinc-950 border-t border-white/10">
      <div className="flex">
        <button
          onClick={() => setTab("desc")}
          className={`flex-1 py-2 text-[12px] font-semibold ${tab === "desc" ? "text-white border-b-2 border-white" : "text-white/50"}`}
        >
          Penerangan Produk
        </button>
        <button
          onClick={() => setTab("review")}
          className={`flex-1 py-2 text-[12px] font-semibold ${tab === "review" ? "text-white border-b-2 border-white" : "text-white/50"}`}
        >
          Testimoni ({reviews.length})
        </button>
      </div>
      <div className="p-3 max-h-[40vh] overflow-y-auto">
        {tab === "desc" ? (
          <div>
            {image_url && (
              <img src={image_url} alt="Produk" className="w-full max-h-52 rounded-lg object-cover mb-3 border border-white/10" />
            )}
            <div className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
              {description || "Tiada penerangan untuk produk ini."}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-white/40 text-[12px]">Tiada testimoni lagi.</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-white/5 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60">
                        {r.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[12px] font-medium truncate">{r.name}</p>
                      {r.car_model && <p className="text-white/40 text-[10px] truncate">{r.car_model}</p>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">{r.review}</p>
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {r.images.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} alt="" className="h-12 w-12 rounded-md object-cover border border-white/10" />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
