import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Volume2, VolumeX, Zap, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  // Detect desktop vs mobile
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

  // IntersectionObserver — main video yang nampak, pause yang lain
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || pages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          const video = videoRefs.current[idx];
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(idx);
            if (video) {
              video.muted = muted;
              video.play().catch(() => {});
            }
          } else {
            video?.pause();
          }
        });
      },
      { root: container, threshold: [0, 0.6, 1] }
    );
    container.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, loading]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      Object.values(videoRefs.current).forEach((v) => { if (v) v.muted = next; });
      return next;
    });
  }, []);

  // Navigasi arrow — scroll ke index tertentu
  const scrollToIndex = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(idx, pages.length - 1));
    const target = container.querySelector<HTMLElement>(`[data-index="${clamped}"]`);
    if (target) {
      // Desktop: scroll horizontal; Mobile: scroll vertical
      if (isDesktop) {
        container.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      } else {
        container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
      }
    }
  }, [pages.length, isDesktop]);

  const goNext = useCallback(() => scrollToIndex(activeIndex + 1), [activeIndex, scrollToIndex]);
  const goPrev = useCallback(() => scrollToIndex(activeIndex - 1), [activeIndex, scrollToIndex]);

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

  return (
    <div className="fixed inset-0 bg-black flex justify-center" style={{ height: "100dvh" }}>
      <div className="relative mx-auto w-full max-w-[420px] h-full">

        {/* Header — logo ACS + mute */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-6 w-6 object-contain" />
            <span className="text-white text-sm font-bold">AmanCarSeat</span>
          </div>
          <button onClick={toggleMute} className="pointer-events-auto h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            {muted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
          </button>
        </div>

        {/* Feed — mobile: vertical scroll; desktop: horizontal scroll */}
        <div
          ref={scrollRef}
          className="w-full h-full overflow-auto snap-y snap-mandatory md:snap-x md:overflow-x-auto md:overflow-y-hidden md:flex md:snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", height: "100dvh" }}
        >
          {pages.map((p, i) => {
            const playlist = p.video_urls?.filter(Boolean)?.length
              ? p.video_urls.filter(Boolean)
              : p.video_url ? [p.video_url] : [];
            const first = playlist[0] || null;
            return (
              <section
                key={p.id}
                data-index={i}
                className="relative w-full snap-start snap-always flex flex-col overflow-hidden shrink-0"
                style={{ height: "100dvh", width: isDesktop ? "420px" : "100%" }}
              >
                {/* Video — penuh section */}
                <div className="relative flex-1 min-h-0 bg-black">
                  {first ? (
                    <video
                      ref={(el) => { videoRefs.current[i] = el; }}
                      src={first}
                      poster={p.poster_url || undefined}
                      muted={muted}
                      loop
                      playsInline
                      preload={Math.abs(i - activeIndex) <= 1 ? "auto" : "none"}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : p.poster_url ? (
                    <img src={p.poster_url} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-10 w-10 text-white/20" />
                    </div>
                  )}

                  {/* Badge */}
                  {p.badge_text && (
                    <div className={`absolute top-14 left-3 ${THEME_DOTS[p.theme || "amber"] || "bg-amber-400"} text-black text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                      <Zap className="h-3 w-3" /> {p.badge_text}
                    </div>
                  )}

                  {/* Headline */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-16 pointer-events-none">
                    <h2 className="text-white font-bold text-lg leading-tight">{p.headline || p.title}</h2>
                    {p.subheadline && <p className="text-white/70 text-xs mt-1">{p.subheadline}</p>}
                    <p className="text-white/40 text-[10px] mt-1.5">
                      {p.views || 0} view • {i + 1}/{pages.length}
                    </p>
                  </div>
                </div>

                {/* Bar bawah — buka page penuh */}
                <Link
                  to={`/page/${p.slug}`}
                  className="shrink-0 bg-zinc-950 border-t border-white/10 flex items-center gap-3 px-3 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[13px] truncate">{p.title}</p>
                    <p className="text-white/40 text-[11px] truncate">Buka page penuh — pilih varian & tempahan</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/50 rotate-[-90deg] shrink-0" />
                </Link>
              </section>
            );
          })}
        </div>

        {/* ── Navigation arrows ── */}

        {/* Mobile: arrow bawah (scroll ke bawah untuk video seterusnya) */}
        {!isDesktop && pages.length > 1 && activeIndex < pages.length - 1 && (
          <button
            onClick={goNext}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-0.5 text-white/70 animate-bounce hover:text-white"
          >
            <ChevronDown className="h-5 w-5" />
            <span className="text-[10px]">Scroll video lain</span>
          </button>
        )}

        {/* Mobile: arrow atas (video sebelum) */}
        {!isDesktop && activeIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white/70 hover:text-white"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        )}

        {/* Desktop: arrow kanan (video seterusnya) */}
        {isDesktop && pages.length > 1 && activeIndex < pages.length - 1 && (
          <button
            onClick={goNext}
            className="absolute top-1/2 right-2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Desktop: arrow kiri (video sebelum) */}
        {isDesktop && activeIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute top-1/2 left-2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Dot indicators */}
        {pages.length > 1 && (
          <div className={`absolute z-30 flex gap-1.5 ${isDesktop ? "flex-col bottom-1/2 translate-y-1/2 right-4" : "horizontal bottom-3 left-1/2 -translate-x-1/2"}`}>
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "bg-white w-4"
                    : "bg-white/30 w-1.5 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
