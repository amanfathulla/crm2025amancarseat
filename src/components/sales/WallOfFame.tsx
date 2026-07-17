import { useLanguage } from "@/contexts/LanguageContext";
import { Star, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Review {
  id: string;
  name: string;
  car_model: string;
  rating: number;
  review: string;
  images: string[];
  avatar_url?: string | null;
}

interface WallOfFameProps {
  reviews: Review[];
}

export const WallOfFame = ({ reviews }: WallOfFameProps) => {
  const { t } = useLanguage();
  
  const getFeaturedReviews = () => {
    return reviews
      .filter(r => r.images && r.images.length > 0)
      .filter(r => r.car_model.toLowerCase().includes("pickup"))
      .slice(0, 6);
  };

  const featuredReviews = getFeaturedReviews();

  return (
    <section className="py-[72px] bg-acs-ink">
      <div className="max-w-[1120px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <div className="acs-eyebrow justify-center mb-3.5">Bukti Pelanggan</div>
          <h2 className="font-display text-acs-paper mb-2.5" style={{ fontSize: 'clamp(30px,5vw,44px)' }}>
            {t.wallOfFameTitle}
          </h2>
          <p className="text-acs-ash text-[15px] leading-relaxed">
            {t.wallOfFameSubtitle}
          </p>
        </div>

        {/* Testimonial grid */}
        {featuredReviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {featuredReviews.map((review) => (
              <div
                key={review.id}
                className="group relative aspect-[4/5] rounded-md overflow-hidden border cursor-pointer"
                style={{ borderColor: 'var(--acs-line)', background: 'linear-gradient(160deg,#2b2622,#141110)' }}
              >
                {review.images[0] ? (
                  <img
                    src={review.images[0]}
                    alt={`${review.name}'s car`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--acs-panel)' }}>
                    <ImageIcon className="w-8 h-8 text-acs-ash" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
                {/* Tag */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 font-mono-acs text-[10px] text-acs-paper opacity-85">
                  <span className="text-acs-brass block text-[11px] font-bold mb-0.5">{review.name} · {review.car_model}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-[var(--acs-brass)] text-[var(--acs-brass)]' : 'text-white/30'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center">
          <Link to="/testimoni" className="btn-acs-ghost flex items-center gap-2">
            {t.viewAll}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
