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
    <section id="color-gallery" className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-3">
            {language === 'bm' ? '7 Design Eksklusif' : '7 Exclusive Designs'}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {language === 'bm' 
              ? 'Corak Diamond yang timbul & premium' 
              : 'Embossed Diamond pattern & premium finish'}
          </p>
        </div>

        {/* Main Image Display */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-border shadow-xl">
            <img 
              src={DESIGN_COLORS[activeColor].image} 
              alt={language === 'bm' ? DESIGN_COLORS[activeColor].name : DESIGN_COLORS[activeColor].nameEn}
              className="w-full h-full object-cover transition-all duration-500"
            />
          </div>
          <p className="text-center mt-4 text-lg font-semibold text-foreground">
            {language === 'bm' ? DESIGN_COLORS[activeColor].name : DESIGN_COLORS[activeColor].nameEn}
          </p>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex justify-center gap-2 md:gap-3 overflow-x-auto pb-2 px-2">
          {DESIGN_COLORS.map((color, index) => (
            <button
              key={color.id}
              onClick={() => setActiveColor(index)}
              className={`flex-shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                activeColor === index 
                  ? 'border-primary ring-2 ring-primary/30 scale-105' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <img 
                src={color.image} 
                alt={language === 'bm' ? color.name : color.nameEn}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
