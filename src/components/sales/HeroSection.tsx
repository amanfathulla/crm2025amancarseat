import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import heroSeatCover from "@/assets/hero-seat-cover.jpg";

interface HeroSectionProps {
  onCTAClick: () => void;
  totalReviews: number;
}

export const HeroSection = ({ onCTAClick }: HeroSectionProps) => {
  const scrollToColors = () => {
    document.getElementById('color-gallery')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative flex flex-col overflow-hidden bg-acs-ink">
      {/* Hero Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroSeatCover} 
          alt="Premium Diamond Stitch Seat Covers"
          className="w-full h-full object-cover opacity-40"
        />
        {/* Dark overlay with red ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,32,60,0.14), transparent 60%), linear-gradient(to bottom, rgba(12,14,17,0.85), rgba(12,14,17,0.95))'
        }} />
        {/* Diamond stitch pattern overlay */}
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--acs-paper) 0 2px, transparent 2px 34px), repeating-linear-gradient(-45deg, var(--acs-paper) 0 2px, transparent 2px 34px)`
        }} />
      </div>
      
      {/* Sticky Nav */}
      <header className="relative z-20 sticky top-0" style={{ background: 'rgba(12,14,17,0.88)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--acs-line)' }}>
        <nav className="flex items-center justify-between px-6 py-3 max-w-[1120px] mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] border-[1.5px] border-[var(--acs-brass)] rounded flex items-center justify-center font-display text-[var(--acs-brass)] text-[18px] -rotate-3">AS</div>
            <span className="font-display text-[22px] tracking-wider text-acs-paper">AMAN<span className="text-acs-stitch">CAR</span>SEAT</span>
          </div>
          <a href="#quick-order" className="btn-acs-primary text-[13px] px-[18px] py-[10px]">Sebut Harga</a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-[1120px] mx-auto w-full px-6 py-20 md:py-28">
        
        {/* WhatsApp Verified badge */}
        <div className="inline-flex items-center gap-2 mb-6 rounded-full px-3.5 py-1.5" style={{ background: 'var(--acs-panel)', border: '1px solid var(--acs-line)' }}>
          <span className="w-[7px] h-[7px] rounded-full bg-[#3fce6e]" style={{ boxShadow: '0 0 0 3px rgba(63,206,110,0.15)' }} />
          <span className="text-xs text-acs-ash">WhatsApp Verified · HQ Kota Bharu</span>
        </div>

        {/* MASSIVE HEADLINE */}
        <div className="text-center max-w-[820px] mx-auto">
          <h1 
            className="font-display text-acs-paper leading-[0.98]"
            style={{ fontSize: 'clamp(40px, 8vw, 74px)' }}
          >
            Lindungi Seat Original,<br />
            <span className="text-acs-stitch">Kekalkan Value</span> Kereta
          </h1>
        </div>

        {/* Subheadline */}
        <p className="text-acs-ash text-base text-center max-w-[520px] mx-auto mt-5 mb-8 leading-relaxed">
          Fabric Silk premium, corak diamond timbul, dijahit khas ikut model kereta anda. Sejuk, tahan lasak, siap dalam 30–60 minit.
        </p>

        {/* CTAs */}
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          <button onClick={onCTAClick} className="btn-acs-primary">Sebut Harga Segera →</button>
          <button onClick={scrollToColors} className="btn-acs-ghost">Tengok 7 Design</button>
        </div>

        {/* Stat strip */}
        <div className="w-full flex flex-wrap border-t border-b" style={{ borderColor: 'var(--acs-line)' }}>
          {[
            { num: '11,799+', lbl: 'Pemilik Kereta' },
            { num: '7', lbl: 'Design Eksklusif' },
            { num: '30-60', lbl: 'Minit Pemasangan' },
            { num: '10+', lbl: 'Tahun Pengalaman' },
          ].map((stat, i) => (
            <div key={i} className={`flex-1 min-w-[150px] text-center py-5 ${i < 3 ? 'border-r' : ''}`} style={{ borderColor: 'var(--acs-line)' }}>
              <div className="font-display text-[32px] text-acs-brass">{stat.num}</div>
              <div className="text-[11px] text-acs-ash uppercase tracking-wider mt-1">{stat.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="relative z-10 pb-6 flex justify-center">
        <ChevronDown className="w-6 h-6 text-acs-ash animate-bounce" />
      </div>
    </section>
  );
};
