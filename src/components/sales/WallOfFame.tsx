import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, ChevronRight, Image as ImageIcon } from "lucide-react";
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

// Featured brands to show on landing page

export const WallOfFame = ({ reviews }: WallOfFameProps) => {
  const { t } = useLanguage();
  
  // Latest 15 "pickup" reviews that have images (newest first).
  const getFeaturedReviews = () => {
    return reviews
      .filter(r => r.images && r.images.length > 0)
      .filter(r => r.car_model.toLowerCase().includes("pickup"))
      .slice(0, 15);
  };

  const featuredReviews = getFeaturedReviews();

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">WhatsApp Verified</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.wallOfFameTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.wallOfFameSubtitle}
          </p>
        </div>

        {/* Featured images grid */}
        {featuredReviews.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {featuredReviews.map((review) => (
                <div
                  key={review.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
                >
                  {review.images[0] ? (
                    <img
                      src={review.images[0]}
                      alt={`${review.name}'s car`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{review.name}</p>
                      <p className="text-white/70 text-[10px] truncate">{review.car_model}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2 h-2 ${i < review.rating ? 'fill-primary text-primary' : 'text-white/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single CTA button */}
        <div className="flex items-center justify-center mt-10">
          <Button asChild size="lg" className="min-w-[200px] rounded-full">
            <Link to="/testimoni" className="flex items-center gap-2">
              {t.viewAll}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
