import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reviewsSupabase } from "@/lib/reviewsClient";
import { fetchReviewMaterials, fetchPinnedReviews, fetchReviewWarna } from "@/lib/reviewMaterials";
import { Play, Volume2, VolumeX, Zap, ChevronRight, ChevronLeft, ChevronDown, Eye, Star, ShoppingCart, Check } from "lucide-react";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { trackSalePageEvent } from "@/lib/salePageEvents";
import seat2 from "@/assets/seat-png/2-seater.png";
import seat5 from "@/assets/seat-png/5-seater.png";
import seat7 from "@/assets/seat-png/7-seater.png";
import verifiedBadge from "@/assets/verified-badge.png";

// ── Icon ikut seat count: 2=seat, 5=sedan, 7=mpv ──
function SeatIcon({ count }: { count: number }) {
  const src = count <= 2 ? seat2 : count <= 5 ? seat5 : seat7;
  return <img src={src} alt={`${count} seater`} className="block w-full h-auto object-contain" />;
}

function parseSeatCount(name: string): number {
  const m = name.match(/(\d+)\s*seater/i);
  if (m) return parseInt(m[1], 10);
  const n = name.match(/(\d+)/);
  return n ? parseInt(n[1], 10) : 5;
}

function seatSubtext(name: string): string {
  const n = parseSeatCount(name);
  if (n <= 2) return "Kereta 2 tempat duduk";
  if (n <= 5) return "Kereta 5 tempat duduk";
  return "MPV / SUV 7 tempat duduk";
}

interface FeedPage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_urls: string[] | null;
  video_url: string | null;
  poster_url: string | null;
  product_id: string | null;
  product_mode: string | null;
  product_category: string | null;
  cta_label: string | null;
  badge_text: string | null;
  theme: string | null;
  is_published: boolean;
  views: number;
}

interface FeedProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  description: string | null;
}

interface FeedVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
}

interface Review {
  id: string;
  name: string;
  car_model: string;
  rating: number;
  review: string;
  images: string[] | null;
  created_at: string;
  avatar_url: string | null;
}

const THEME_STYLES: Record<string, { cta: string; price: string; badge: string }> = {
  amber:  { cta: "bg-amber-400",     price: "text-amber-400",     badge: "bg-amber-400" },
  red:    { cta: "bg-red-500",       price: "text-red-400",       badge: "bg-red-500" },
  blue:   { cta: "bg-blue-500",      price: "text-blue-400",      badge: "bg-blue-500" },
  green:  { cta: "bg-emerald-500",   price: "text-emerald-400",   badge: "bg-emerald-500" },
  pink:   { cta: "bg-pink-500",      price: "text-pink-400",      badge: "bg-pink-500" },
  purple: { cta: "bg-purple-500",    price: "text-purple-400",    badge: "bg-purple-500" },
};

/** Dapatkan style theme — support nama preset ATAU hex color (#f70c0c) */
function getThemeStyle(theme: string | null | undefined): { cta: string; price: string; badge: string } {
  if (!theme) return THEME_STYLES.amber;
  if (THEME_STYLES[theme]) return THEME_STYLES[theme];
  // Hex custom — guna inline style untuk CTA & badge, price guna hex terus
  if (/^#([0-9a-f]{6})$/i.test(theme)) {
    return { cta: "", price: "", badge: "" }; // marker — caller guna style obj
  }
  return THEME_STYLES.amber;
}

export default function SalePagesFeed() {
  const [pages, setPages] = useState<FeedPage[]>([]);
  const [productMap, setProductMap] = useState<Record<string, FeedProduct>>({});
  const [variationMap, setVariationMap] = useState<Record<string, FeedVariation[]>>({}); // productId → variations
  const [addonMap, setAddonMap] = useState<Record<string, FeedProduct[]>>({}); // pageId → addon products
  const [reviewMap, setReviewMap] = useState<Record<string, Review[]>>({}); // productId → 10 reviews terawal
  const [reviewCountMap, setReviewCountMap] = useState<Record<string, number>>({}); // productId → total count mengikut material
  const [reviewsMap, setReviewsMap] = useState<Record<string, any[]>>({}); // productId → 6 reviews terawal ikut material
  const [allReviews, setAllReviews] = useState<any[]>([]); // SEMUA reviews (dengan material) untuk filter testimoni
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedVars, setSelectedVars] = useState<Record<string, string>>({}); // productId → variationId
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [materialTab, setMaterialTab] = useState<string>("all"); // all | Kain Mesh | Kain Nylon | Kain Fullsilk | Semi Leather Kalis Air
  const [infoOpen, setInfoOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCatProduct, setSelectedCatProduct] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch semua published pages
        const { data: pg } = await supabase
          .from("sale_pages")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        const pagesData = (pg || []) as FeedPage[];
        setPages(pagesData);

        // 2. Kumpul product_id (mode single) + kategori (mode category)
        const mainProductIds = pagesData.map(p => p.product_id).filter(Boolean) as string[];
        const categories = pagesData
          .filter(p => (p.product_mode || "single") === "category" && p.product_category)
          .map(p => p.product_category as string);
        const categoryProds: FeedProduct[] = [];

        if (categories.length > 0) {
          const { data: catProds } = await supabase
            .from("public_products")
            .select("id, name, price, category, image_url, image_urls, description")
            .in("category", categories)
            .eq("status", "active");
          categoryProds.push(...((catProds || []) as FeedProduct[]));
        }

        if (mainProductIds.length > 0 || categoryProds.length > 0) {
          // Produk utama by id
          if (mainProductIds.length > 0) {
            const { data: prods } = await supabase
              .from("public_products")
              .select("id, name, price, category, image_url, image_urls, description")
              .in("id", mainProductIds);
            const pMap: Record<string, FeedProduct> = {};
            (prods || []).forEach((p: any) => { pMap[p.id] = p; });
            // Append produk category (key by id jugak)
            categoryProds.forEach(p => { if (!pMap[p.id]) pMap[p.id] = p; });
            // Fetch SEMUA produk untuk lookup nama produk (warna design testimonio)
            const { data: allProds } = await supabase
              .from("public_products")
              .select("id, name, category")
              .eq("status", "active");
            (allProds || []).forEach((p: any) => { if (!pMap[p.id]) pMap[p.id] = p as any; });
            setProductMap(pMap);

            // 3. Fetch variations untuk semua produk (utama + category)
            const allIds = [...mainProductIds, ...categoryProds.map(p => p.id)];
            const { data: vars } = await supabase
              .from("public_product_variations")
              .select("id, product_id, name, price")
              .in("product_id", allIds)
              .order("price");
            const vMap: Record<string, FeedVariation[]> = {};
            (vars || []).forEach((v: any) => {
              if (!vMap[v.product_id]) vMap[v.product_id] = [];
              vMap[v.product_id].push(v);
            });
            setVariationMap(vMap);

            // 4. Fetch SEMUA reviews (untuk kiraan total mengikut bahan)
            const matMap = await fetchReviewMaterials();
            const pinMap = await fetchPinnedReviews();
            const warnaMap = await fetchReviewWarna();
            const allReviewsAll: any[] = [];
            let fromR = 0;
            while (true) {
              const { data: batch, error: rErr } = await reviewsSupabase
                .from("reviews")
                .select("id, name, car_model, rating, review, images, created_at, avatar_url")
                .order("created_at", { ascending: false })
                .range(fromR, fromR + 999);
              if (rErr || !batch || batch.length === 0) break;
              allReviewsAll.push(...batch);
              if (batch.length < 1000) break;
              fromR += 1000;
            }
            const rMap: Record<string, Review[]> = {};
            const rCountMap: Record<string, number> = {};
            // Reviews ikut produk utama sahaja
            mainProductIds.forEach(pid => {
              const prod = pMap[pid];
              if (!prod?.category) return;
              const matched = allReviewsAll.filter((r: any) => matMap[r.id] === prod.category);
              rCountMap[pid] = matched.length;
              if (matched.length > 0) {
                const earliest = [...matched].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ).slice(0, 10) as Review[];
                rMap[pid] = earliest;
              }
            });
            // Untuk mode category: guna produk pertama dalam category untuk review count
            pagesData.filter(p => (p.product_mode || "single") === "category").forEach(p => {
              const firstCatProd = categoryProds.find(pr => pr.category === p.product_category);
              if (!firstCatProd?.category) return;
              const matched = allReviewsAll.filter((r: any) => matMap[r.id] === firstCatProd.category);
              rCountMap[`cat_${p.id}`] = matched.length;
              if (matched.length > 0) {
                const earliest = [...matched].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ).slice(0, 10) as Review[];
                rMap[`cat_${p.id}`] = earliest;
              }
            });
            setReviewMap(rMap);
            setReviewCountMap(rCountMap);
            // 6 reviews terawal ikut material untuk tab Testimoni
            const sixMap: Record<string, any[]> = {};
            Object.entries(rMap).forEach(([k, arr]) => { sixMap[k] = (arr as any[]).slice(0, 6); });
            setReviewsMap(sixMap);
            // SEMUA reviews enriched dengan material + pinned status untuk filter testimoni
            const enriched = allReviewsAll.map((r: any) => ({
              ...r,
              material: matMap[r.id] || "Lain-lain",
              pinned: !!pinMap[r.id],
              pin_order: pinMap[r.id] ?? 999,
              warna: warnaMap[r.id] ? (pMap[warnaMap[r.id]]?.name || warnaMap[r.id]) : null,
            }));
            setAllReviews(enriched);
          }
        }

        // 5. Fetch add-on products bagi setiap page
        const addonPromises = pagesData.map(async p => {
          try {
            const { data } = await supabase
              .from("sale_page_products")
              .select("product_id")
              .eq("sale_page_id", p.id)
              .order("sort_order");
            const ids = ((data || []) as any[]).map(r => r.product_id);
            if (ids.length === 0) return { pageId: p.id, addons: [] as FeedProduct[] };
            const { data: prods } = await supabase
              .from("public_products")
              .select("id, name, price, category, image_url, image_urls, description")
              .in("id", ids);
            // Filter keluar produk utama di frontend (bukan di query)
            const addons = (prods || []).filter((pr: any) => pr.id !== p.product_id) as FeedProduct[];
            return { pageId: p.id, addons };
          } catch { return { pageId: p.id, addons: [] as FeedProduct[] }; }
        });
        const addonResults = await Promise.all(addonPromises);
        const aMap: Record<string, FeedProduct[]> = {};
        addonResults.forEach(r => { aMap[r.pageId] = r.addons; });
        setAddonMap(aMap);
      } catch (e) {
        console.error("feed load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goNext = useCallback(() => {
    setIndex(i => i + 1);
    setShowSizePicker(false);
  }, []);
  const goPrev = useCallback(() => {
    setIndex(i => i - 1);
    setShowSizePicker(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    setStarted(false);
    setInfoOpen(false);
    setCatOpen(false);
    setSelectedCatProduct(null);
    const v = videoRef.current;
    if (v) { v.currentTime = 0; v.muted = true; v.play().catch(() => {}); }
    // Bump views untuk page yang jadi aktif (scroll = view, macam buka page sebenar)
    const pg = pages[index];
    if (pg) {
      supabase.rpc("bump_sale_page_views", { p_slug: pg.slug }).then(({ data }: any) => {
        // Guna nilai return RPC (views baru dari DB) supaya konsisten dengan page sebenar
        const newViews = typeof data === "number" ? data : (pg.views || 0) + 1;
        setPages(prev => prev.map((p, i) => i === index ? { ...p, views: newViews } : p));
      }).catch(() => {});
      trackSalePageEvent(pg.id, "view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, pages.length]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const TH = 50;
    if (isDesktop) {
      if (dx < -TH) goNext(); else if (dx > TH) goPrev();
    } else {
      if (dy < -TH) goNext(); else if (dy > TH) goPrev();
    }
    touchStartY.current = null; touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60 text-sm animate-pulse">Memuatkan...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white/80 text-lg font-semibold">Tiada page lagi</p>
      </div>
    );
  }

  // Filter pages ikut material tab (kalau bukan "all")
  // Ambil category dari produk utama (public_products), bukan testimonial_material
  const filteredPages = materialTab === "all"
    ? pages
    : pages.filter(p => {
        let mat: string | null = null;
        if (p.product_id && productMap[p.product_id]) {
          mat = productMap[p.product_id].category || null;
        } else if ((p.product_mode || "single") === "category" && p.product_category) {
          mat = p.product_category as string;
        }
        return mat === materialTab;
      });
  const active = filteredPages[index] || filteredPages[0] || pages[0];
  const isCategoryMode = (active.product_mode || "single") === "category";
  const categoryProducts = isCategoryMode
    ? (Object.values(productMap).filter(p => p.category === active.product_category))
    : [];
  const product = !isCategoryMode && active.product_id ? productMap[active.product_id] : null;
  const variations = active.product_id ? (variationMap[active.product_id] || []) : [];
  const selectedVarId = active.product_id ? selectedVars[active.product_id] : undefined;
  const selectedVar = variations.find(v => v.id === selectedVarId);
  const addons = addonMap[active.id] || [];
  const reviews = isCategoryMode ? (reviewMap[`cat_${active.id}`] || []) : (active.product_id ? (reviewMap[active.product_id] || []) : []);
  const reviewCount = isCategoryMode ? (reviewCountMap[`cat_${active.id}`] || 0) : (active.product_id ? (reviewCountMap[active.product_id] || 0) : 0);
  const theme = getThemeStyle(active.theme);
  const hexColor = /^#([0-9a-f]{6})$/i.test(active.theme || "") ? (active.theme as string) : null;
  const ctaStyle = hexColor ? { backgroundColor: hexColor } : undefined;
  const priceStyle = hexColor ? { color: hexColor } : undefined;
  const badgeStyle = hexColor ? { backgroundColor: hexColor } : undefined;
  const displayPrice = selectedVar?.price ?? product?.price ?? 0;
  const canBuyDirect = product && (variations.length <= 1 || !!selectedVar);
  const buyUrl = `/order?product=${product?.id || ""}${selectedVar ? `&variation=${selectedVar.id}` : ""}&sp=${active.id}`;
  const playlist = active.video_urls?.filter(Boolean)?.length
    ? active.video_urls.filter(Boolean)
    : active.video_url ? [active.video_url] : [];
  const src = playlist[0] || null;
  const hasNext = index < pages.length - 1;
  const hasPrev = index > 0;

  return (
    <div className="fixed inset-0 bg-black flex justify-center select-none md:items-center md:bg-zinc-950" style={{ height: "100dvh" }}>
      <div
        className="relative w-full max-w-[420px] h-full overflow-hidden touch-pan-y md:flex md:max-w-[1000px] md:w-full md:h-auto md:items-center md:justify-center md:gap-6 md:overflow-visible"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Video ── */}
        <div className="absolute inset-0 bg-black md:relative md:inset-auto md:w-[400px] md:h-[82vh] md:max-h-[820px] md:rounded-2xl md:overflow-hidden md:shadow-2xl md:ring-1 md:ring-white/10">
          {src ? (
            <video
              ref={videoRef}
              key={active.id}
              src={src}
              poster={active.poster_url || undefined}
              muted
              loop
              playsInline
              autoPlay
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (!v.duration) return;
                if (v.currentTime / v.duration >= 0.75 && !(videoRef.current as any)?._completeTracked) {
                  (videoRef.current as any)._completeTracked = true;
                  trackSalePageEvent(active.id, "video_complete");
                }
              }}
            />
          ) : active.poster_url ? (
            <img src={active.poster_url} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-10 w-10 text-white/20" />
            </div>
          )}
          {!started && (
            <button
              onClick={() => {
                setStarted(true);
                const v = videoRef.current;
                if (v) { v.muted = false; setMuted(false); v.play().catch(() => {}); }
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
              <span className="absolute top-20 left-1/2 -translate-x-1/2 text-white text-[12px] font-semibold bg-black/70 backdrop-blur px-3 py-1.5 rounded-full whitespace-nowrap">
                Klik untuk dengar suara
              </span>
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none md:hidden" />
        </div>

        {/* ── Header ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-7 w-7 object-contain rounded-full" />
            <span className="text-white text-sm font-bold">AMANCARSEAT</span>
            <img src={verifiedBadge} alt="Verified" className="h-4 w-4 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-black/50 backdrop-blur px-2 py-1 rounded-full">
              <Eye className="h-3 w-3" /> {(active.views || 0).toLocaleString()}
            </span>
            <span className="text-white/90 text-sm font-bold font-mono bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
              {index + 1}/{filteredPages.length}
            </span>
            <button onClick={toggleMute} className="pointer-events-auto h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>

        {/* ── Material Tabs (macam TikTok: For You / Following) ── */}
        <div className="absolute top-14 left-0 right-0 z-25 flex items-center justify-center gap-4 px-4">
          {[
            { k: "all", l: "Semua" },
            { k: "Kain Mesh", l: "Mesh" },
            { k: "Kain Nylon", l: "Nylon" },
            { k: "Kain Fullsilk", l: "Silk" },
            { k: "Semi Leather Kalis Air", l: "Semi Leather" },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => { setMaterialTab(t.k); setIndex(0); setShowSizePicker(false); }}
              className={`text-[12px] font-bold pb-1 border-b-2 transition-colors whitespace-nowrap ${
                materialTab === t.k
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Bottom: info produk + Buy Now TERUS ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5 md:relative md:inset-auto md:px-0 md:pb-0 md:w-[380px] md:shrink-0 overscroll-contain"
          style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
          onWheel={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* Badge */}
          {active.badge_text && (
            <div style={badgeStyle} className={`inline-flex ${!hexColor ? theme.badge : ""} text-black text-[11px] font-bold px-2.5 py-1 rounded-full items-center gap-1 mb-2`}>
              <Zap className="h-3 w-3" /> {active.badge_text}
            </div>
          )}

          {/* Headline */}
          <h2 className="text-white font-bold text-lg leading-tight">{active.headline || active.title}</h2>

          {/* Meta — testimoni count (bawah headline) */}
          <div className="flex items-center gap-2 mt-2">
            {product && reviewCountMap[product.id] > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/70 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {reviewCountMap[product.id]} testimoni
              </span>
            )}
          </div>

          {/* Produk card — TERUS di sini, bukan pergi page lain */}
          {isCategoryMode ? (
            /* MODE KATEGORI: step 1 pilih produk, step 2 pilih varian */
            <div className="mt-3 bg-zinc-950/80 backdrop-blur rounded-xl border border-white/10 p-3">
              <button
                onClick={() => { setCatOpen(o => !o); if (catOpen) setSelectedCatProduct(null); }}
                className={`w-full h-10 rounded-lg ${!hexColor ? theme.cta : ""} text-black font-bold text-[13px] flex items-center justify-center gap-2`}
                style={ctaStyle}
              >
                <ShoppingCart className="h-5 w-5" />
                {catOpen ? "Tutup Produk" : `Lihat ${categoryProducts.length} Produk (${active.product_category})`}
              </button>
              {catOpen && (
                <div className="mt-2">
                  {!selectedCatProduct ? (
                    /* STEP 1: senarai produk (tiada varian) */
                    <div className="space-y-2">
                      <p className="text-white/50 text-[10px] uppercase tracking-wide">Pilih Produk</p>
                      {categoryProducts.map(cp => (
                        <button
                          key={cp.id}
                          onClick={() => setSelectedCatProduct(cp.id)}
                          className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg p-2 text-left transition-colors"
                        >
                          {cp.image_url ? (
                            <img src={cp.image_url} alt={cp.name} className="h-10 w-10 rounded-md object-contain border border-white/10 shrink-0 bg-white/5" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-white/10 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[12px] font-medium truncate">{cp.name}</p>
                            <p style={priceStyle} className={`${!hexColor ? theme.price : ""} text-[12px] font-bold`}>RM{cp.price.toFixed(0)}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* STEP 2: varian untuk produk terpilih */
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCatProduct(null)}
                        className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white mb-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Semua Produk
                      </button>
                      {(() => {
                        const cp = categoryProducts.find(p => p.id === selectedCatProduct)!;
                        const cpVars = variationMap[cp.id] || [];
                        const selVar = cpVars.find(v => v.id === selectedVars[cp.id]);
                        return (
                          <Fragment>
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                              {cp.image_url ? (
                                <img src={cp.image_url} alt={cp.name} className="h-10 w-10 rounded-md object-contain border border-white/10 shrink-0 bg-white/5" />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-white/10 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-[12px] font-medium truncate">{cp.name}</p>
                                <p style={priceStyle} className={`${!hexColor ? theme.price : ""} text-[12px] font-bold`}>RM{cp.price.toFixed(0)}</p>
                              </div>
                            </div>
                            {cpVars.length > 1 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {cpVars.map(v => {
                                  const sel = selectedVars[cp.id] === v.id;
                                  return (
                                    <button
                                      key={v.id}
                                      onClick={() => setSelectedVars(s => ({ ...s, [cp.id]: v.id }))}
                                      className={`relative rounded-xl border transition-colors ${
                                        sel
                                          ? "border-white bg-white text-black"
                                          : "border-white/15 bg-white/5 hover:border-white/30"
                                      }`}
                                    >
                                      <SeatIcon count={parseSeatCount(v.name)} />
                                      <div className={`flex items-center justify-between gap-1 px-1.5 py-1 text-[11px] font-bold leading-none ${sel ? "text-black" : "text-white/85"}`}>
                                        <span className="truncate">{v.name}</span>
                                        <span className={sel ? "text-black" : "text-green-400"}>RM{v.price.toFixed(0)}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : cpVars.length === 1 ? (
                              <a
                                href={`/order?product=${cp.id}${cpVars[0] ? `&variation=${cpVars[0].id}` : ""}&sp=${active.id}`}
                                style={ctaStyle}
                                className={`block w-full h-10 rounded-lg ${!hexColor ? theme.cta : ""} text-black font-bold text-[13px] flex items-center justify-center gap-1`}
                              >
                                <ShoppingCart className="h-5 w-5" /> Tempah Sekarang • RM{(cpVars[0]?.price ?? cp.price).toFixed(0)}
                              </a>
                            ) : null}
                            {/* Buy Now untuk mode kategori — jika dah pilih saiz */}
                            {selVar && (
                              <a
                                href={`/order?product=${cp.id}&variation=${selVar.id}&sp=${active.id}`}
                                onClick={() => trackSalePageEvent(active.id, "buy_click")}
                                style={ctaStyle}
                                className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg ${!hexColor ? theme.cta : ""} text-black font-bold text-[13px]`}
                              >
                                <span className="flex items-center gap-1.5"><ShoppingCart className="h-4 w-4" /> Buy Now</span>
                                <span className="text-[11px]">{selVar.name} • RM{selVar.price.toFixed(0)}</span>
                              </a>
                            )}
                          </Fragment>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : product && (
            /* MODE SINGLE: satu produk utama */
            <div className="mt-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 px-3 py-2 md:mt-0 md:bg-zinc-900/90 md:backdrop-blur-xl md:p-5 md:rounded-2xl md:border-white/10 md:shadow-2xl">
              <div className="flex items-start gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-12 w-12 rounded-lg object-contain border border-white/10 shrink-0 bg-white/5" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-[13px] leading-tight">{product.name}</p>
                  {product.category && <p className="text-white/40 text-[10px] mt-0.5">{product.category}</p>}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span style={priceStyle} className={`${!hexColor ? theme.price : ""} font-bold text-lg`}>RM{displayPrice.toFixed(0)}</span>
                    {selectedVar && selectedVar.price !== product.price && (
                      <span className="text-white/30 text-xs line-through">RM{product.price.toFixed(0)}</span>
                    )}
                  </div>
                </div>
                </div>

              {/* Variations — segmented control satu baris */}
              {variations.length > 1 && showSizePicker && (
                <div className="mt-1.5">
                  <p className="text-white/90 text-[11px] font-bold uppercase tracking-wide mb-1.5">Pilih Saiz Kereta</p>
                  <div className="flex gap-1.5">
                    {variations.map(v => {
                      const sel = selectedVar?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => { setSelectedVars(s => ({ ...s, [product.id]: v.id })); setShowSizePicker(false); }}
                          className={`relative flex-1 rounded-xl border overflow-visible transition-colors ${
                            sel
                              ? "border-red-600 bg-red-600/15"
                              : "border-white/15 bg-white/5 hover:border-white/30"
                          }`}
                        >
                          {sel && (
                            <Check className="absolute top-0.5 left-0.5 z-10 h-3 w-3 text-red-600 drop-shadow" />
                          )}
                          <SeatIcon count={parseSeatCount(v.name)} />
                          <span className="block text-center text-[11px] font-bold leading-tight py-1 text-white/90">{v.name}</span>
                          {v.name.toLowerCase().includes("5 seater") && (
                            <span className="absolute -top-3 right-0 bg-amber-500 text-black text-[7px] font-bold px-1.5 py-0.5 rounded-full whitespace-normal">POPULAR</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Buy Now — TERUS ke order form */}
              {variations.length > 1 && !selectedVar ? (
                <button
                  type="button"
                  onClick={() => { setShowSizePicker(true); }}
                  style={ctaStyle}
                  className={`mt-2.5 w-full h-14 rounded-2xl ${!hexColor ? theme.cta : ""} text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform`}
                >
                  <ShoppingCart className="h-5 w-5" /> Pilih Saiz Kereta
                </button>
              ) : canBuyDirect ? (
                <div className="mt-2.5 flex gap-2">
                  <a
                    href={buyUrl}
                    onClick={() => trackSalePageEvent(active.id, "cta_click", { variation_id: selectedVar?.id })}
                    style={ctaStyle}
                    className={`flex-1 h-14 rounded-2xl ${!hexColor ? theme.cta : ""} text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {selectedVar ? (
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-[10px] font-medium opacity-80">{active.cta_label || "Buy Now"}</span>
                        <span className="text-sm">{selectedVar.name} • RM{displayPrice.toFixed(0)}</span>
                      </span>
                    ) : (
                      <>{active.cta_label || "Buy Now"} • RM{displayPrice.toFixed(0)}</>
                    )}
                  </a>
                  {variations.length > 1 && selectedVar && (
                    <button
                      type="button"
                      onClick={() => { setShowSizePicker(true); }}
                      className="h-14 px-3 rounded-2xl bg-white/10 border border-white/15 text-white/70 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 active:scale-[0.97] transition-transform shrink-0"
                      title="Tukar saiz"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Tukar
                    </button>
                  )}
                </div>
              ) : (
                <div style={ctaStyle} className={`mt-2.5 w-full h-14 rounded-2xl ${!hexColor ? theme.cta : ""} opacity-60 text-black font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-transform`}>
                  Pilih Varian Dahulu
                </div>
              )}

              {/* Tab Penerangan + Testimoni */}
              <ProductDetailTabs
                key={`${active.id}-${selectedVar?.id || "none"}`}
                description={product?.description || (isCategoryMode ? (categoryProducts[0]?.description ?? null) : null)}
                reviews={isCategoryMode ? (reviewsMap[`cat_${active.id}`] || []) : (product ? (reviewsMap[product.id] || []) : [])}
                image_url={product?.image_url || (isCategoryMode ? (categoryProducts[0]?.image_url ?? null) : null)}
                images={product?.image_urls || (isCategoryMode ? (categoryProducts[0]?.image_urls ?? null) : null)}
                allReviews={allReviews}
                productMaterial={product?.category || (isCategoryMode ? active.product_category : null)}
                defaultMaterial={(active as any).testimonial_material || "Semua"}
                defaultProduk={
                  (active as any).testimonial_product && (active as any).testimonial_product !== "all"
                    ? (productMap[(active as any).testimonial_product]?.name || null)
                    : null
                }
              />
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 z-40 h-1 bg-white/10">
          <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${((index + 1) / pages.length) * 100}%` }} />
        </div>

        {/* ── Navigation ── */}
        {isDesktop && hasNext && (
          <button onClick={goNext} className="absolute top-1/2 right-3 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/90 hover:bg-black/80">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        {isDesktop && hasPrev && (
          <button onClick={goPrev} className="absolute top-1/2 left-3 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/90 hover:bg-black/80">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {!isDesktop && hasNext && (
          <button onClick={goNext} className="absolute top-20 left-1/2 -translate-x-1/2 z-40 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70 animate-bounce">
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
        {!isDesktop && hasPrev && (
          <button onClick={goPrev} className="absolute top-16 left-1/2 -translate-x-1/2 z-40 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70">
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        )}
        {pages.length > 1 && pages.length <= 10 && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 z-30 flex flex-col gap-2">
            {pages.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? "bg-white w-5" : "bg-white/30 w-2 hover:bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
