import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Sparkles } from "lucide-react";
import beforeSeat from "@/assets/before-seat.jpg";
import afterSeat from "@/assets/after-seat.jpg";

export const BeforeAfterSection = () => {
  const { t } = useLanguage();
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t.transformIn} 30-60 {t.minutes}</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.beforeAfterTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lihat sendiri perbezaan dramatik antara seat lama dengan Aman Car Seat premium
          </p>
        </div>

        {/* Before/After comparison */}
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border bg-secondary">
            {/* Before image */}
            <div 
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderValue[0]}% 0 0)` }}
            >
              <img 
                src={beforeSeat} 
                alt="Seat sebelum - kotor dan rosak"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* After image */}
            <div 
              className="absolute inset-0"
              style={{ clipPath: `inset(0 0 0 ${sliderValue[0]}%)` }}
            >
              <img 
                src={afterSeat} 
                alt="Seat selepas - premium dengan AMANCARSEAT"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Slider line */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-primary z-10"
              style={{ left: `${sliderValue[0]}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-4 bg-primary-foreground rounded" />
                  <div className="w-0.5 h-4 bg-primary-foreground rounded" />
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-foreground">
              {t.before}
            </div>
            <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-primary-foreground">
              {t.after}
            </div>
          </div>

          {/* Slider control */}
          <div className="mt-6 px-4">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={10}
              max={90}
              step={1}
              className="w-full"
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              ↔ Geser untuk bandingkan
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
