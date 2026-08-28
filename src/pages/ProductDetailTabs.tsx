import React, { useState } from "react";
import { Star, ChevronDown } from "lucide-react";

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

function AccordionSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
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

export function ProductDetailTabs({
  description,
  reviews,
  image_url,
}: {
  description?: string | null;
  reviews: DetailReview[];
  image_url?: string | null;
}) {
  return (
    <div className="bg-zinc-950 border-t border-white/10">
      <AccordionSection title="Penerangan Produk">
        {image_url && (
          <img src={image_url} alt="Produk" className="w-full max-h-52 rounded-lg object-cover mb-3 border border-white/10" />
        )}
        <div className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
          {description || "Tiada penerangan untuk produk ini."}
        </div>
      </AccordionSection>

      <AccordionSection title="Testimoni" count={reviews.length}>
        {reviews.length === 0 ? (
          <p className="text-white/40 text-[12px]">Tiada testimoni lagi.</p>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto overscroll-contain">
            {reviews.map(r => (
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
