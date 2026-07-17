import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import fabricBlue from "@/assets/fabric-silk-blue.jpg";
import fabricBlack from "@/assets/fabric-silk-black.jpg";
import fabricRedStitch from "@/assets/fabric-silk-red-stitch.jpg";
import fabricRed from "@/assets/fabric-silk-red.jpg";
import fabricPurple from "@/assets/fabric-silk-purple.jpg";
import fabricBrown from "@/assets/fabric-silk-brown.jpg";
import fabricCream from "@/assets/fabric-silk-cream.jpg";

export const DESIGN_COLORS = [
  { id: 'red-stitch', code: 'A11', name: 'Hitam Line Merah', nameEn: 'Black Red Line', image: fabricRedStitch },
  { id: 'blue', code: 'A17', name: 'Hitam Biru', nameEn: 'Black Blue', image: fabricBlue },
  { id: 'black', code: 'A16', name: 'Hitam Line Biru', nameEn: 'Black Blue Line', image: fabricBlack },
  { id: 'red', code: 'A18', name: 'Merah Diamond', nameEn: 'Diamond Red', image: fabricRed },
  { id: 'purple', code: 'A20', name: 'Ungu Diamond', nameEn: 'Diamond Purple', image: fabricPurple },
  { id: 'brown', code: 'A15', name: 'Brown Diamond', nameEn: 'Diamond Brown', image: fabricBrown },
  { id: 'cream', code: 'A13', name: 'Cream Diamond', nameEn: 'Diamond Cream', image: fabricCream },
];

export const ColorGallery = () => {
  const { language } = useLanguage();
  const [activeColor, setActiveColor] = useState(0);

  return (
    <section id="color-gallery" className="py-[72px] bg-acs-ink">
      <div className="max-w-[1120px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <div className="acs-eyebrow justify-center mb-3.5">Pilihan Corak</div>
          <h2 className="font-display text-acs-paper mb-2.5" style={{ fontSize: 'clamp(30px,5vw,44px)' }}>
            {language === 'bm' ? '7 Design Eksklusif' : '7 Exclusive Designs'}
          </h2>
          <p className="text-acs-ash text-[15px] leading-relaxed">
            {language === 'bm' 
              ? 'Setiap corak dijahit khas — pilih yang sepadan dengan gaya kereta anda.' 
              : 'Each pattern hand-stitched — choose one that matches your car style.'}
          </p>
        </div>

        {/* Main Image Display */}
        <div className="max-w-[760px] mx-auto mb-6">
          <div className="aspect-[16/10] rounded-md overflow-hidden border" style={{ borderColor: 'var(--acs-line)' }}>
            <img 
              src={DESIGN_COLORS[activeColor].image} 
              alt={language === 'bm' ? DESIGN_COLORS[activeColor].name : DESIGN_COLORS[activeColor].nameEn}
              className="w-full h-full object-cover transition-all duration-500"
            />
          </div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="font-mono-acs text-[11px] text-acs-stitch">{DESIGN_COLORS[activeColor].code}</span>
            <span className="text-[15px] font-semibold text-acs-paper">
              {language === 'bm' ? DESIGN_COLORS[activeColor].name : DESIGN_COLORS[activeColor].nameEn}
            </span>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex justify-center gap-2.5 overflow-x-auto pb-2 px-2" style={{ scrollbarWidth: 'none' }}>
          {DESIGN_COLORS.map((color, index) => (
            <button
              key={color.id}
              onClick={() => setActiveColor(index)}
              className="flex-shrink-0 w-[118px] h-[78px] rounded border-2 overflow-hidden transition-all duration-300 relative"
              style={{
                borderColor: activeColor === index ? 'var(--acs-brass)' : 'transparent',
              }}
            >
              <img 
                src={color.image} 
                alt={language === 'bm' ? color.name : color.nameEn}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 left-0 right-0 text-[9.5px] text-center py-[3px] uppercase tracking-wider text-acs-paper" style={{ background: 'rgba(0,0,0,0.55)' }}>
                {color.code}
              </span>
            </button>
          ))}
        </div>

        {/* Spec Sheet Pricing Card */}
        <div className="max-w-[640px] mx-auto mt-12 rounded-lg overflow-hidden" style={{ background: 'var(--acs-panel)', border: '1px solid var(--acs-line)' }}>
          <div className="p-[26px] border-b border-dashed" style={{ borderColor: 'var(--acs-line)' }}>
            <div className="acs-eyebrow mb-2.5">Spec Sheet</div>
            <h3 className="font-display text-acs-paper text-[26px]">Fabric Silk — Corak Diamond</h3>
          </div>
          <div className="p-[20px_26px]">
            {[
              { label: '2 Seater', val: 'RM 130' },
              { label: '5 Seater', val: 'RM 299' },
              { label: '7 Seater', val: 'RM 349' },
              { label: 'Tempoh siap', val: '10–14 hari' },
              { label: 'Free gift', val: 'RM 59 value' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-baseline py-[11px] border-b last:border-b-0 text-[14px]" style={{ borderColor: 'var(--acs-line)' }}>
                <span className="text-acs-ash">{row.label}</span>
                <span className="font-mono-acs text-acs-brass font-bold text-[15px]">{row.val}</span>
              </div>
            ))}
          </div>
          <div className="p-[22px_26px_26px]">
            <a href="#quick-order" className="btn-acs-primary w-full justify-center py-4">Pilih Design & Sebut Harga</a>
          </div>
        </div>
      </div>
    </section>
  );
};
