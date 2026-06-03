import { useLanguage } from "@/contexts/LanguageContext";
import { Star, CheckCircle, MessageCircle } from "lucide-react";

interface Testimonial {
  name: string;
  car: string;
  text: string;
}

const testimonials: Testimonial[] = [
  { name: "Ahmad", car: "Proton X50", text: "Puas hati sangat! Kereta nampak mewah" },
  { name: "Siti", car: "Perodua Myvi", text: "Bini puji kereta nampak baru" },
  { name: "Rizal", car: "Honda City", text: "Material kalis air betul-betul berkesan" },
  { name: "Farah", car: "Toyota Vios", text: "Pasang sendiri dalam 45 minit je" },
  { name: "Hafiz", car: "Proton Saga", text: "Harga berbaloi dengan kualiti premium" },
  { name: "Ain", car: "Perodua Axia", text: "Nampak macam kereta baru!" },
  { name: "Azman", car: "Nissan Almera", text: "Anti-calar memang terbukti" },
  { name: "Lina", car: "Mazda 3", text: "Kualiti terbaik, highly recommend" },
];

export const SocialProofTicker = () => {
  const { t } = useLanguage();

  return (
    <section className="py-6 md:py-8 bg-secondary/30 border-y border-border overflow-hidden">
      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        {/* Ticker container */}
        <div className="flex animate-ticker">
          {/* Duplicate testimonials for seamless loop */}
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div 
              key={index}
              className="flex-shrink-0 mx-3 md:mx-4 bg-card border border-border rounded-lg px-4 md:px-6 py-3 md:py-4 min-w-[260px] md:min-w-[300px]"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{testimonial.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{testimonial.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{testimonial.car}</p>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-foreground truncate">"{testimonial.text}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="container mx-auto mt-4 md:mt-6 px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-center">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-primary text-primary" />
            <span className="text-sm font-medium text-foreground">4.9/5 Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">1,000+ {t.realTestimonials}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">WhatsApp Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
};
