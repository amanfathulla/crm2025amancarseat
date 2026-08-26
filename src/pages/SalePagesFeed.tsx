import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Volume2, VolumeX, Zap, ChevronRight, ChevronLeft, ChevronDown, ExternalLink, Eye } from "lucide-react";

interface FeedPage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_urls: string[] | null;
  video_url: string | null;
  poster_url: string | null;
  badge_text: string | null;
  theme: string | null;
  views: number;
}

const THEME_DOTS: Record<string, string> = {
  amber: "bg-amber-400", red: "bg-red-500", blue: "bg-blue-500",
  green: "bg-emerald-500", pink: "bg-pink-500", purple: "bg-purple-500",
};

export default function SalePagesFeed() {
  const [pages, setPages] = useState<FeedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
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
        const { data } = await supabase
          .from("sale_pages")
          .select("id, slug, title, headline, subheadline, video_urls, video_url, poster_url, badge_text, theme, views")
          .eq("is_published", true)
          .order("created_at", { ascending: false });
        setPages((data || []) as FeedPage[]);
      } catch (e) {
        console.error("feed load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goNext = useCallback(() => {
    setIndex(i => Math.min(i + 1, pages.length - 1));
  }, [pages.length]);

  const goPrev = useCallback(() => {
    setIndex(i => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Bila tukar video: reset started, auto-play muted
  useEffect(() => {
    setStarted(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.muted = true;
      v.play().catch(() => {});
    }
  }, [index]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  // Swipe (mobile) — swipe atas/bawah tukar video
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 50;
    if (isDesktop) {
      if (dx < -THRESHOLD) goNext();
      else if (dx > THRESHOLD) goPrev();
    } else {
      if (dy < -THRESHOLD) goNext();
      else if (dy > THRESHOLD) goPrev();
    }
    touchStartY.current = null;
    touchStartX.current = null;
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
        <Link to="/" className="text-amber-400 underline text-sm mt-2">Kembali ke laman utama</Link>
      </div>
    );
  }

  const active = pages[index];
  const playlist = active.video_urls?.filter(Boolean)?.length
    ? active.video_urls.filter(Boolean)
    : active.video_url ? [active.video_url] : [];
  const src = playlist[0] || null;
  const hasNext = index < pages.length - 1;
  const hasPrev = index > 0;

  return (
    <div className="fixed inset-0 bg-black flex justify-center select-none" style={{ height: "100dvh" }}>
      <div
        className="relative w-full max-w-[420px] h-full overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* ── Video aktif ── */}
        <div className="absolute inset-0 bg-black">
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
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : active.poster_url ? (
            <img src={active.poster_url} alt={active.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-10 w-10 text-white/20" />
            </div>
          )}

          {/* Tekan untuk buka suara */}
          {!started && (
            <button
              onClick={() => {
                setStarted(true);
                const v = videoRef.current;
                if (v) { v.muted = false; setMuted(false); v.play().catch(() => {}); }
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
                <span className="text-white/90 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                  Tekan untuk main dengan suara
                </span>
              </div>
            </button>
          )}

          {/* Gradient bawah supaya teks jelas */}
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        </div>

        {/* ── Header: logo ACS + counter + mute ── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-7 w-7 object-contain" />
            <span className="text-white text-sm font-bold">AmanCarSeat</span>
          </div>
          {/* Counter besar: 1/100 */}
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-sm font-bold font-mono bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
              {index + 1}/{pages.length}
            </span>
            <button onClick={toggleMute} className="pointer-events-auto h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>

        {/* ── Info video aktif: tajuk page + views + link ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5 pointer-events-none">
          {/* Badge */}
          {active.badge_text && (
            <div className={`inline-flex ${THEME_DOTS[active.theme || "amber"] || "bg-amber-400"} text-black text-[11px] font-bold px-2.5 py-1 rounded-full items-center gap-1 mb-2`}>
              <Zap className="h-3 w-3" /> {active.badge_text}
            </div>
          )}
          <h2 className="text-white font-bold text-lg leading-tight">{active.headline || active.title}</h2>
          {active.subheadline && <p className="text-white/70 text-xs mt-1">{active.subheadline}</p>}

          {/* Meta: views + tajuk page */}
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="flex items-center gap-1 text-white/60">
              <Eye className="h-3.5 w-3.5" /> {active.views || 0} view
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/60 font-mono truncate">/page/{active.slug}</span>
          </div>

          {/* Butang buka page penuh — PENTING supaya tahu page mana */}
          <Link
            to={`/page/${active.slug}`}
            className="pointer-events-auto mt-3 w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {active.title} — Tempahan
          </Link>
        </div>

        {/* ── Progress bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-40 h-1 bg-white/10">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${((index + 1) / pages.length) * 100}%` }}
          />
        </div>

        {/* ── Navigation arrows ── */}

        {/* Desktop: kiri/kanan */}
        {isDesktop && hasNext && (
          <button onClick={goNext} className="absolute top-1/2 right-3 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/90 hover:bg-black/80 transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        {isDesktop && hasPrev && (
          <button onClick={goPrev} className="absolute top-1/2 left-3 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/90 hover:bg-black/80 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Mobile: hint swipe bawah (video seterusnya) */}
        {!isDesktop && hasNext && (
          <button onClick={goNext} className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-0.5 text-white/70 animate-bounce">
            <ChevronDown className="h-5 w-5" />
            <span className="text-[10px]">Swipe video lain</span>
          </button>
        )}
        {/* Mobile: arrow atas (video sebelum) */}
        {!isDesktop && hasPrev && (
          <button onClick={goPrev} className="absolute top-16 left-1/2 -translate-x-1/2 z-40 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70">
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        )}

        {/* Mini thumbnail nav (kalau page sikit sahaja) */}
        {pages.length > 1 && pages.length <= 10 && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2 z-30 flex flex-col gap-2">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "bg-white w-5" : "bg-white/30 w-2 hover:bg-white/60"}`}
                title={p.title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
