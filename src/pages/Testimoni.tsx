import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Star, Search, Plus, Loader2 } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { BRANDS, getBrandKeyFromSlug, type Review } from "@/lib/reviewsClient";
import { ReviewSubmitDialog } from "@/components/sales/ReviewSubmitDialog";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import { Footer } from "@/components/sales/Footer";

const PAGE_SIZE = 12;

export default function Testimoni() {
  const { brand: brandSlug } = useParams<{ brand?: string }>();
  const navigate = useNavigate();
  const { reviews, loading, error } = useReviews();

  const activeBrand = getBrandKeyFromSlug(brandSlug);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of BRANDS) c[b.key] = 0;
    for (const r of reviews) {
      for (const b of BRANDS) {
        if (b.key === "all") c.all += 1;
        else if (b.match(r.car_model || "")) c[b.key] += 1;
      }
    }
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    const brand = BRANDS.find((b) => b.key === activeBrand)!;
    const term = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (!brand.match(r.car_model || "")) return false;
      if (term && !(r.car_model || "").toLowerCase().includes(term) && !(r.name || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [reviews, activeBrand, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleBrandChange = (key: string) => {
    setPage(1);
    if (key === "all") navigate("/testimoni");
    else navigate(`/testimoni/${key}`);
  };

  const handleReview = () => {
    const msg = encodeURIComponent("Hi ACS, saya nak hantar review & gambar seat saya 🙌");
    window.open(`https://wa.me/60194503184?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/acs-logo.png" alt="ACS" className="h-7" />
            <span className="font-bold tracking-wide hidden sm:inline">AMANCARSEAT®</span>
          </div>
          <Button onClick={handleReview} className="bg-[#FFC107] hover:bg-[#FFD54F] text-black font-bold rounded-full hidden md:inline-flex">
            <MessageCircle className="w-4 h-4 mr-2" /> Tulis Review
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10 md:py-14 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-2">Galeri Testimoni</h1>
        <p className="text-gray-400">{counts.all}+ Testimoni Sebenar</p>

        {/* Brand chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {BRANDS.map((b) => {
            const isActive = activeBrand === b.key;
            return (
              <button
                key={b.key}
                onClick={() => handleBrandChange(b.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition border ${
                  isActive
                    ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/40"
                    : "bg-neutral-900 text-gray-300 border-white/10 hover:bg-neutral-800"
                }`}
              >
                {b.label}
                <span className={`text-xs rounded-full px-2 py-0.5 ${isActive ? "bg-black/30" : "bg-black/60"}`}>
                  {counts[b.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mt-6 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari model kereta (cth: Myvi, Civic, Vios)..."
            className="pl-10 bg-neutral-900 border-white/10 text-white placeholder:text-gray-500 rounded-full h-11"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">{filtered.length} testimoni ditemui</p>
          <Button onClick={handleReview} className="bg-red-600 hover:bg-red-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Tulis Review Anda
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat testimoni...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">{error}</div>
        ) : pageItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Tiada testimoni dijumpai.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pageItems.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        )}
      </section>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const images = (review.images ?? []).filter(Boolean);
  return (
    <div className="bg-neutral-950 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold truncate">{review.name || "ACS Customer"}</p>
          <p className="text-xs text-gray-400 truncate">{review.car_model || "—"}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? "fill-red-500 text-red-500" : "text-white/20"}`}
            />
          ))}
        </div>
      </div>
      {review.review && (
        <p className="text-sm text-gray-300 line-clamp-3 italic">"{review.review}"</p>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between bg-neutral-900 rounded-md px-2 py-1.5">
          <span className="text-gray-400">Kualiti</span>
          <span className="flex items-center gap-1 font-semibold">
            <Star className="w-3 h-3 fill-red-500 text-red-500" /> {review.quality_rating ?? 5}
          </span>
        </div>
        <div className="flex items-center justify-between bg-neutral-900 rounded-md px-2 py-1.5">
          <span className="text-gray-400">Harga</span>
          <span className="flex items-center gap-1 font-semibold">
            <Star className="w-3 h-3 fill-red-500 text-red-500" /> {review.price_rating ?? 5}
          </span>
        </div>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {images.slice(0, 3).map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-md overflow-hidden bg-neutral-900 border border-white/5">
              <img src={src} alt={`${review.name} ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const pages: (number | "...")[] = [];
  const add = (n: number | "...") => pages.push(n);
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      add(i);
    } else if (pages[pages.length - 1] !== "...") {
      add("...");
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 rounded-md bg-neutral-900 border border-white/10 disabled:opacity-40 hover:bg-neutral-800"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`d-${i}`} className="px-2 text-gray-500">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-9 h-9 px-3 rounded-md border text-sm font-semibold ${
              p === page
                ? "bg-red-600 text-white border-red-600"
                : "bg-neutral-900 text-gray-300 border-white/10 hover:bg-neutral-800"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-md bg-neutral-900 border border-white/10 disabled:opacity-40 hover:bg-neutral-800"
      >
        ›
      </button>
    </div>
  );
}
