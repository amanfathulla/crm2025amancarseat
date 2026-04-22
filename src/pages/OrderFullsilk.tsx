import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, Star } from "lucide-react";
import heroBg from "@/assets/fullsilk-hero.png";

export default function OrderFullsilk() {
  const navigate = useNavigate();

  const goToOrder = () => navigate("/order?material=fullsilk");

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Hero */}
      <section
        className="relative w-full min-h-[100svh] flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={goToOrder}
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-16 pt-24 flex flex-col items-center text-center">
          <div className="flex-1" />

          <div className="mt-auto flex flex-col items-center gap-5 backdrop-blur-sm bg-black/40 rounded-2xl px-6 py-6 sm:px-10 sm:py-8 border border-white/10 shadow-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-300/40 text-purple-100 text-xs sm:text-sm font-medium uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Edisi Khas Kain Fullsilk
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Mewah, Lembut & <span className="text-purple-300">Tahan Panas</span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 max-w-xl">
              Tempahan khas hanya untuk material <strong className="text-white">Kain Fullsilk</strong> — 
              tekstur premium yang serlahkan gaya kereta anda.
            </p>

            <Button
              size="lg"
              onClick={(e) => { e.stopPropagation(); goToOrder(); }}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold text-base sm:text-lg px-8 py-6 rounded-xl shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.03]"
            >
              Tempah Fullsilk Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-white/60">Klik di mana-mana pada gambar untuk teruskan</p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-zinc-950 border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-400" />
            <h3 className="font-semibold text-sm">Kualiti Premium</h3>
            <p className="text-xs text-white/60">Tekstur silk yang lembut & tahan lama</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="h-6 w-6 text-purple-400" />
            <h3 className="font-semibold text-sm">Reka Bentuk Eksklusif</h3>
            <p className="text-xs text-white/60">Hanya tersedia melalui link khas ini</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <h3 className="font-semibold text-sm">Penghantaran Seluruh Malaysia</h3>
            <p className="text-xs text-white/60">Sabah & Sarawak juga tersedia</p>
          </div>
        </div>
      </section>
    </div>
  );
}
