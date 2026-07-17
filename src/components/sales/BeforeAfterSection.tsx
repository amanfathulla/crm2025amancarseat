import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Slider } from "@/components/ui/slider";
import beforeSeat from "@/assets/before-seat.jpg";
import afterSeat from "@/assets/after-seat.jpg";

export const BeforeAfterSection = () => {
  const { t } = useLanguage();
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <section className="py-[72px] bg-acs-ink">
      <div className="max-w-[1120px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <div className="acs-eyebrow justify-center mb-3.5">Transformasi 30–60 minit</div>
          <h2 className="font-display text-acs-paper mb-2.5" style={{ fontSize: 'clamp(30px,5vw,44px)' }}>Sebelum. Selepas.</h2>
          <p className="text-acs-ash text-[15px] leading-relaxed">Geser untuk lihat sendiri perbezaan seat lama vs Aman Car Seat premium.</p>
        </div>

        {/* Before/After comparison */}
        <div className="max-w-[760px] mx-auto">
          <div className="relative aspect-[16/10] rounded-md overflow-hidden border" style={{ borderColor: 'var(--acs-line)' }}>
            {/* Before image */}
            <div 
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderValue[0]}% 0 0)` }}
            >
              <img 
                src={beforeSeat} 
                alt="Seat sebelum"
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
                alt="Seat selepas dengan AMANCARSEAT"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Slider line with brass handle */}
            <div 
              className="absolute top-0 bottom-0 w-[2px] z-10"
              style={{ left: `${sliderValue[0]}%`, background: 'var(--acs-brass)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full flex items-center justify-center text-[var(--acs-ink)] font-extrabold text-base shadow-lg" style={{ background: 'var(--acs-brass)' }}>
                ↔
              </div>
            </div>

            {/* Labels */}
            <span className="absolute top-3.5 left-3.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', color: 'var(--acs-ash)' }}>Sebelum</span>
            <span className="absolute top-3.5 right-3.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full" style={{ background: 'var(--acs-brass)', color: 'var(--acs-ink)' }}>Selepas</span>
          </div>

          {/* Slider control */}
          <div className="mt-4 px-4">
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={10}
              max={90}
              step={1}
              className="w-full"
            />
            <p className="text-center text-xs text-acs-ash mt-2">Seret slider untuk bandingkan</p>
          </div>
        </div>
      </div>
    </section>
  );
};
