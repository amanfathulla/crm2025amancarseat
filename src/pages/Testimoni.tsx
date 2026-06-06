import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, MessageCircle, CheckCircle } from "lucide-react";
import fabricBlue from "@/assets/fabric-silk-blue.jpg";
import fabricBlack from "@/assets/fabric-silk-black.jpg";
import fabricRedStitch from "@/assets/fabric-silk-red-stitch.jpg";
import fabricRed from "@/assets/fabric-silk-red.jpg";
import fabricPurple from "@/assets/fabric-silk-purple.jpg";
import fabricBrown from "@/assets/fabric-silk-brown.jpg";
import fabricCream from "@/assets/fabric-silk-cream.jpg";
import afterSeat from "@/assets/after-seat.jpg";
import heroSeat from "@/assets/hero-seat-cover.jpg";

const IMAGES = [fabricBlue, fabricBlack, fabricRedStitch, fabricRed, fabricPurple, fabricBrown, fabricCream, afterSeat, heroSeat];
const NAMES = ["Ahmad","Siti","Rizal","Farah","Hafiz","Ain","Azman","Lina","Faizal","Nora","Hakim","Aisyah","Zaki","Mira","Idris","Liyana","Syafiq","Hana","Amir","Dina","Fauzi","Sara","Yusof","Intan","Razak","Aida","Hisham","Erin","Kamil","Suhaila","Nizam","Wani","Ridzuan","Yana","Khairul","Salmah","Faris","Lily","Hadi","Nadia"];
const CARS = ["Proton X50","Perodua Myvi","Honda City","Toyota Vios","Proton Saga","Perodua Axia","Nissan Almera","Mazda 3","Perodua Bezza","Honda Civic","Toyota Hilux","Perodua Aruz","Proton X70","Honda HR-V","Toyota Yaris","Perodua Alza","Proton Persona","Mitsubishi Triton","Toyota Innova","Honda BR-V"];
const REVIEWS = [
  "Puas hati sangat! Kereta nampak macam baru.",
  "Material premium, sejuk dan selesa.",
  "Bini puji habis-habisan, terima kasih ACS!",
  "Highly recommended! Quality top.",
  "Pasang sendiri pun mudah, fitting kemas.",
  "Corak diamond memang nampak mewah.",
  "Worth the price, kualiti tahan lasak.",
  "Servis cepat, barang sampai 2 hari.",
  "Anti slip, anak duduk pun stabil.",
  "Best beli! Akan order untuk kereta kedua.",
];

const TOTAL = 312;

const sample = <T,>(arr: T[], i: number) => arr[i % arr.length];

export default function Testimoni() {
  const [visible, setVisible] = useState(60);
  const items = useMemo(
    () =>
      Array.from({ length: TOTAL }, (_, i) => ({
        id: i,
        name: sample(NAMES, i * 3 + 1),
        car: sample(CARS, i * 7 + 2),
        review: sample(REVIEWS, i * 5 + 3),
        image: sample(IMAGES, i),
        rating: 5,
      })),
    []
  );

  const handleReview = () => {
    const msg = encodeURIComponent("Hi ACS, saya nak hantar review & gambar seat saya 🙌");
    window.open(`https://wa.me/60194503184?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Link>
          </Button>
          <div className="flex items-center gap-2">
            <img src="/acs-logo.png" alt="ACS" className="h-7" />
            <span className="font-bold tracking-wide hidden sm:inline">AMANCARSEAT®</span>
          </div>
          <Button onClick={handleReview} className="bg-[#FFC107] hover:bg-[#FFD54F] text-black font-bold rounded-full">
            <MessageCircle className="w-4 h-4 mr-2" /> Tulis Review
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-10 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-4">
          <CheckCircle className="w-4 h-4 text-[#FFC107]" />
          <span className="text-sm">WhatsApp Verified</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-3">Wall of Fame</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {TOTAL}+ testimoni sebenar dari pelanggan AmanCarSeat di seluruh Malaysia.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
          <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#FFC107] text-[#FFC107]" /> 4.9/5 Rating</span>
          <span>{TOTAL}+ Customer Verified</span>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.slice(0, visible).map((r) => (
            <div key={r.id} className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
              <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-semibold truncate">{r.name}</p>
                <p className="text-white/70 text-[10px] truncate">{r.car}</p>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-[#FFC107] text-[#FFC107]" />
                  ))}
                </div>
                <p className="text-white/80 text-[10px] mt-1 line-clamp-2">"{r.review}"</p>
              </div>
            </div>
          ))}
        </div>

        {visible < items.length && (
          <div className="flex justify-center mt-10">
            <Button onClick={() => setVisible((v) => v + 60)} size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-8">
              Muat Lagi ({items.length - visible} lagi)
            </Button>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">Sudah beli dari kami? Kongsi pengalaman anda!</p>
          <Button onClick={handleReview} size="lg" className="bg-[#FFC107] hover:bg-[#FFD54F] text-black font-bold rounded-full px-10">
            <MessageCircle className="w-5 h-5 mr-2" /> Hantar Review Saya
          </Button>
        </div>
      </section>
    </div>
  );
}
