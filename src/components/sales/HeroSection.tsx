import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroSeatCover from "@/assets/hero-seat-cover.jpg";

interface HeroSectionProps {
  onCTAClick: () => void;
  totalReviews: number;
}

export const HeroSection = ({ onCTAClick, totalReviews }: HeroSectionProps) => {
  const scrollToColors = () => {
    document.getElementById('color-gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroSeatCover} 
          alt="Premium Diamond Stitch Seat Covers"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>
      
      {/* Minimalist Centered Logo */}
      <header className="relative z-20 pt-4 md:pt-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <img 
              src="/acs-logo.png" 
              alt="AmanCarSeat Logo" 
              className="h-6 md:h-8 object-contain"
            />
            <span className="font-bold text-white text-sm tracking-wide">AMANCARSEAT®</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-6">
        
        {/* MASSIVE HEADLINE - 15% of screen */}
        <div className="text-center max-w-4xl mx-auto mb-6 md:mb-8">
          <h1 
            className="font-black text-white tracking-tight leading-[0.95] uppercase"
            style={{ 
              fontSize: 'clamp(2rem, 8vw, 4.5rem)',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            LINDUNGI SEAT ORIGINAL<br />
            KEKALKAN VALUE KERETA
          </h1>
        </div>

        {/* Subheadline - smaller grey text */}
        <p className="text-gray-400 text-sm md:text-base lg:text-lg text-center max-w-lg mx-auto mb-8 md:mb-10">
          Material Fabric Silk yang sejuk, tahan lasak & corak Diamond eksklusif.
        </p>

        {/* Glassmorphism Pricing Card with GOLD prices */}
        <div className="relative w-full max-w-sm mx-auto mb-6">
          <div className="backdrop-blur-xl bg-black/50 border border-white/10 rounded-2xl p-6 md:p-8">
            {/* Pricing - Vertical Layout with GOLD color */}
            <div className="text-center space-y-3 mb-6">
              <div>
                <p className="text-3xl md:text-4xl lg:text-5xl font-black text-[#FFC107]">RM299</p>
                <p className="text-sm text-gray-400">(5 Seater)</p>
              </div>
              <div className="w-16 h-px bg-white/20 mx-auto" />
              <div>
                <p className="text-3xl md:text-4xl lg:text-5xl font-black text-[#FFC107]">RM349</p>
                <p className="text-sm text-gray-400">(7 Seater)</p>
              </div>
            </div>
            
            {/* GOLD CTA Button */}
            <Button 
              size="lg" 
              onClick={scrollToColors}
              className="w-full text-base md:text-lg py-6 md:py-7 bg-[#FFC107] hover:bg-[#FFD54F] text-black font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              PILIH DESIGN
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="relative z-10 pb-6 flex justify-center">
        <ChevronDown className="w-6 h-6 text-white/50 animate-bounce" />
      </div>
    </section>
  );
};
