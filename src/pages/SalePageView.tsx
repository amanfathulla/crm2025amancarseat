import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Volume2, VolumeX, Play, Star, Zap, ChevronUp, ChevronDown } from "lucide-react";

interface SalePage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_url: string | null;
  video_urls: string[] | null;
  poster_url: string | null;
  product_id: string | null;
  cta_label: string | null;
  badge_text: string | null;
  theme: string | null;
  is_published: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  description: string | null;
}

interface Variation {
  id: string;
  name: string;
  price: number;
}

// Theme accent mapping — CTA button, badge, price & stars ikut warna theme
const THEME_STYLES: Record<string, { cta: string; badge: string; price: string; star: string }> = {
  amber:  { cta: "bg-amber-400 hover:bg-amber-300",      badge: "bg-amber-400",      price: "text-amber-400",      star: "text-amber-400 fill-amber-400" },
  red:    { cta: "bg-red-500 hover:bg-red-400",          badge: "bg-red-500",        price: "text-red-400",        star: "text-red-400 fill-red-400" },
  blue:   { cta: "bg-blue-500 hover:bg-blue-400",        badge: "bg-blue-500",       price: "text-blue-400",       star: "text-blue-400 fill-blue-400" },
  green:  { cta: "bg-emerald-500 hover:bg-emerald-400",  badge: "bg-emerald-500",    price: "text-emerald-400",    star: "text-emerald-400 fill-emerald-400" },
  pink:   { cta: "bg-pink-500 hover:bg-pink-400",        badge: "bg-pink-500",       price: "text-pink-400",       star: "text-pink-400 fill-pink-400" },
  purple: { cta: "bg-purple-500 hover:bg-purple-400",    badge: "bg-purple-500",     price: "text-purple-400",     star: "text-purple-400 fill-purple-400" },
};

export default function SalePageView() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SalePage | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false); // product info sheet (arrow toggle)
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const { data: pg } = await supabase
          .from("sale_pages")
          .select("id, slug, title, headline, subheadline, video_url, video_urls, poster_url, product_id, cta_label, badge_text, theme, is_published")
          .eq("slug", slug).single();
        if (!pg || !pg.is_published) {
          setLoading(false);
          return;
        }
        setPage(pg as SalePage);
        // bump views via SECURITY DEFINER RPC (anon tak boleh UPDATE jadual terus)
        supabase.rpc("bump_sale_page_views", { p_slug: pg.slug }).then(() => {});
        if (pg.product_id) {
          const { data: prod } = await supabase
            .from("public_products")
            .select("id, name, price, category, image_url, description, status")
            .eq("id", pg.product_id).single();
          if (prod) {
            setProduct(prod as Product);
            const { data: vars } = await supabase
              .from("public_product_variations")
              .select("id, name, price")
              .eq("product_id", pg.product_id)
              .order("price");
            const v = (vars || []) as Variation[];
            setVariations(v);
            if (v.length === 1) setSelectedVar(v[0]);
          }
        }
      } catch (e) {
        console.error("salepage load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Playlist: video_urls (array, main ikut turutan + loop) — fallback ke video_url tunggal
  const playlist: string[] = page?.video_urls?.filter(Boolean)?.length
    ? (page!.video_urls as string[]).filter(Boolean)
    : page?.video_url
    ? [page.video_url]
    : [];

  const currentVideo = playlist[videoIndex % Math.max(1, playlist.length)] || null;

  // Video ended → next in playlist; at end → loop back to first
  const handleVideoEnded = () => {
    if (playlist.length <= 1) {
      videoRef.current?.play().catch(() => {});
      return;
    }
    setVideoIndex(i => (i + 1) % playlist.length);
  };

  useEffect(() => {
    if (!currentVideo || !videoRef.current) return;
    videoRef.current.load();
    if (started) {
      videoRef.current.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIndex]);

  const handleStart = () => {
    setStarted(true);
    setMuted(false);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const buyUrl = product
    ? `/order?product=${product.id}${selectedVar ? `&variation=${selectedVar.id}` : ""}`
    : "/order";

  // Boleh beli terus hanya jika: tiada varian, 1 varian (auto), atau dah pilih varian
  const canBuyDirect = product && (variations.length <= 1 || !!selectedVar);

  // loading
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60 text-sm animate-pulse">Memuatkan...</div>
      </div>
    );
  }

  // not found / unpublished
  if (!page) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white/80 text-lg font-semibold">Page tidak dijumpai</p>
        <p className="text-white/40 text-xs">
          Page ini mungkin masih Draf (belum Publish) atau link salah.
        </p>
        <Link to="/" className="text-amber-400 underline text-sm mt-2">Kembali ke laman utama</Link>
      </div>
    );
  }

  const displayPrice = selectedVar?.price ?? product?.price ?? 0;
  const theme = THEME_STYLES[page.theme || "amber"] || THEME_STYLES.amber;

  return (
    <div className="fixed inset-0 bg-black flex justify-center overflow-hidden">
      {/* Phone-width container 375px — video 80%+, product bar kompak di bawah */}
      <div className="relative w-full max-w-[375px] h-full flex flex-col overflow-hidden">

        {/* ── Video section — flex-1 (±80% skrin) ──────────── */}
        <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
          {currentVideo ? (
            <>
              <video
                ref={videoRef}
                src={currentVideo}
                poster={page.poster_url || undefined}
                muted={muted}
                loop={false}
                playsInline
                autoPlay
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
              >
                <source src={currentVideo} type="video/mp4" />
              </video>
              {/* Tap-to-start overlay */}
              {!started && (
                <button
                  onClick={handleStart}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                    <span className="text-white/90 text-xs font-medium bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <VolumeX className="h-3.5 w-3.5" /> Tekan untuk main video
                    </span>
                  </div>
                </button>
              )}
              {/* Mute toggle */}
              {started && (
                <button
                  onClick={toggleMute}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                >
                  {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
                </button>
              )}
              {/* Playlist position indicator */}
              {playlist.length > 1 && (
                <div className="absolute bottom-4 right-3 bg-black/50 backdrop-blur text-white/80 text-[10px] px-2 py-1 rounded-full">
                  {videoIndex + 1}/{playlist.length}
                </div>
              )}
            </>
          ) : page.poster_url ? (
            <img src={page.poster_url} alt={page.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/40 text-sm">Tiada video</span>
            </div>
          )}

          {/* Badge (top-left) */}
          {page.badge_text && (
            <div className={`absolute top-3 left-3 ${theme.badge} text-black text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}>
              <Zap className="h-3 w-3" /> {page.badge_text}
            </div>
          )}

          {/* Headline overlay on video */}
          {page.headline && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-16 pointer-events-none">
              <h1 className="text-white font-bold text-lg leading-tight">{page.headline}</h1>
              {page.subheadline && (
                <p className="text-white/70 text-xs mt-1">{page.subheadline}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Product bar kompak (±15-20% skrin) ──────────── */}
        {product && (
          <div className="shrink-0 bg-zinc-950 border-t border-white/10">
            {/* Collapsed row: thumbnail + nama + harga + Buy kecil + arrow */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[13px] leading-tight truncate">{product.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`${theme.price} font-bold text-sm`}>RM{displayPrice.toFixed(0)}</span>
                  {selectedVar && selectedVar.price !== product.price && (
                    <span className="text-white/30 text-[10px] line-through">RM{product.price.toFixed(0)}</span>
                  )}
                  {selectedVar && (
                    <span className="text-white/50 text-[10px] truncate">• {selectedVar.name}</span>
                  )}
                </div>
              </div>
              {/* Buy kecil — buka sheet jika belum pilih varian */}
              {canBuyDirect ? (
                <a
                  href={buyUrl}
                  className={`shrink-0 h-9 px-4 rounded-lg ${theme.cta} text-black font-bold text-sm flex items-center`}
                >
                  {page.cta_label || "Buy"}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setInfoOpen(true)}
                  className={`shrink-0 h-9 px-4 rounded-lg ${theme.cta} opacity-80 text-black font-bold text-[12px] flex items-center`}
                >
                  Pilih Varian
                </button>
              )}
              {/* Arrow toggle — buka/tutup info produk penuh */}
              <button
                type="button"
                onClick={() => setInfoOpen(o => !o)}
                className="shrink-0 h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70"
                aria-label={infoOpen ? "Tutup info produk" : "Buka info produk"}
              >
                {infoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>

            {/* Expanded info sheet — muncul bila arrow ditekan */}
            {infoOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 max-h-[42vh] overflow-y-auto border-t border-white/5">
                {/* Detail produk */}
                <div className="flex items-start justify-between gap-3 pt-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight">{product.name}</p>
                    {product.category && (
                      <p className="text-white/40 text-[11px] mt-0.5">{product.category}</p>
                    )}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className={`${theme.price} font-bold text-lg`}>RM{displayPrice.toFixed(0)}</span>
                      {selectedVar && selectedVar.price !== product.price && (
                        <span className="text-white/30 text-xs line-through">RM{product.price.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-3 w-3 ${theme.star}`} />
                    ))}
                  </div>
                </div>

                {/* Variations */}
                {variations.length > 1 && (
                  <div id="salepage-varians">
                    <p className="text-white/60 text-[11px] font-medium uppercase tracking-wide mb-2">Pilih Varian</p>
                    <div className="flex flex-wrap gap-2">
                      {variations.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVar(v)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            selectedVar?.id === v.id
                              ? `${theme.cta} text-black border-transparent`
                              : "bg-white/5 text-white/80 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {v.name}
                          <span className="ml-1.5 opacity-70">RM{v.price.toFixed(0)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust badges */}
                <div className="flex items-center gap-4 text-white/50 text-[11px]">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Tempahan Selamat</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Siap 10–14 hari</span>
                </div>

                {/* Buy Now besar — disabled jika belum pilih varian */}
                {canBuyDirect ? (
                  <a
                    href={buyUrl}
                    className={`block w-full h-12 rounded-xl ${theme.cta} text-black font-bold text-base flex items-center justify-center transition-colors`}
                  >
                    {page.cta_label || "Buy Now"}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("salepage-varians");
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className={`w-full h-12 rounded-xl ${theme.cta} opacity-70 text-black font-bold text-base flex items-center justify-center`}
                  >
                    Pilih Varian Dahulu
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tiada produk — bar branding kecil sahaja */}
        {!product && (
          <div className="shrink-0 bg-zinc-950 px-4 py-3 flex items-center justify-center gap-2 border-t border-white/5">
            <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-5 w-5 object-contain" />
            <span className="text-white/30 text-[11px]">AmanCarSeat</span>
          </div>
        )}
      </div>
    </div>
  );
}
