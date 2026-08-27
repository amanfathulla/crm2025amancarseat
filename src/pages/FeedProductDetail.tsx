import { Star, ShoppingCart, ChevronDown, X } from "lucide-react";

export interface DetailReview {
  id: string;
  name: string;
  car_model: string;
  rating: number;
  review: string;
  images: string[] | null;
  created_at: string;
  avatar_url: string | null;
}

export function FeedProductDetail({
  product,
  variations,
  reviews,
  selectedVarId,
  onSelectVar,
  onClose,
  ctaStyle,
  hexColor,
  theme,
  buyUrl,
}: {
  product: { id: string; name: string; price: number; category: string | null; image_url: string | null; description: string | null };
  variations: { id: string; name: string; price: number }[];
  reviews: DetailReview[];
  selectedVarId?: string;
  onSelectVar: (id: string) => void;
  onClose: () => void;
  ctaStyle?: React.CSSProperties;
  hexColor: string | null;
  theme: { cta: string; price: string };
  buyUrl: string;
}) {
  const selectedVar = variations.find(v => v.id === selectedVarId);
  const displayPrice = selectedVar?.price ?? product.price ?? 0;
  const canBuy = variations.length <= 1 || !!selectedVar;

  return (
    <div className="mt-3 bg-zinc-950/95 backdrop-blur rounded-xl border border-white/10 p-3 animate-[fadeIn_0.25s_ease]">
      {/* Header: close */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/60 text-[11px] uppercase tracking-wide">Detail Produk</p>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
          aria-label="Tutup detail"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Gambar besar */}
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full max-h-56 rounded-lg object-cover border border-white/10 mb-3" />
      ) : (
        <div className="w-full h-40 rounded-lg bg-white/5 border border-white/10 mb-3" />
      )}

      {/* Nama + harga */}
      <p className="text-white font-bold text-[15px] leading-tight">{product.name}</p>
      {product.category && <p className="text-white/40 text-[11px] mt-0.5">{product.category}</p>}
      <p className={`${!hexColor ? theme.price : ""} font-bold text-xl mt-1`} style={hexColor ? { color: hexColor } : undefined}>
        RM{displayPrice.toFixed(0)}
      </p>

      {/* Variasi / material */}
      {variations.length > 1 && (
        <div className="mt-3">
          <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1.5">Pilih Varian</p>
          <div className="flex flex-wrap gap-1.5">
            {variations.map(v => (
              <button
                key={v.id}
                onClick={() => onSelectVar(v.id)}
                style={selectedVar?.id === v.id ? ctaStyle : undefined}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                  selectedVar?.id === v.id
                    ? `${!hexColor ? theme.cta : ""} text-black border-transparent`
                    : "bg-white/5 text-white/80 border-white/15"
                }`}
              >
                {v.name} <span className="opacity-70">RM{v.price.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1.5">Penerangan</p>
        <p className="text-white/70 text-[12px] leading-relaxed whitespace-pre-wrap">
          {product.description || "Tiada penerangan untuk produk ini."}
        </p>
      </div>

      {/* Testimoni */}
      {reviews.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1.5">Testimoni ({reviews.length})</p>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {reviews.map(r => (
              <div key={r.id} className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.name} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-white text-[10px] font-semibold">{r.name}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-2 w-2 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-white/60 text-[10px] leading-snug line-clamp-2">{r.review}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Now */}
      {canBuy ? (
        <a
          href={buyUrl}
          style={ctaStyle}
          className={`mt-3 w-full h-14 rounded-2xl ${!hexColor ? theme.cta : ""} text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform`}
        >
          <ShoppingCart className="h-5 w-5" />
          Beli Sekarang • RM{displayPrice.toFixed(0)}
        </a>
      ) : (
        <div style={ctaStyle} className={`mt-3 w-full h-14 rounded-2xl ${!hexColor ? theme.cta : ""} opacity-60 text-black font-bold text-base flex items-center justify-center gap-2`}>
          Pilih Varian Dahulu
        </div>
      )}
    </div>
  );
}
