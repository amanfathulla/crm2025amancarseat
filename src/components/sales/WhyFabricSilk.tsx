import { useLanguage } from "@/contexts/LanguageContext";
import { Thermometer, Diamond, Hand } from "lucide-react";

const features = [
  {
    icon: Thermometer,
    titleBm: 'Lebih Sejuk',
    titleEn: 'Cooler Feel',
    descBm: 'Tidak menyerap haba walaupun parking tengah panas terik',
    descEn: 'Doesn\'t absorb heat even when parked under the hot sun',
  },
  {
    icon: Diamond,
    titleBm: 'Corak Diamond',
    titleEn: 'Diamond Pattern',
    descBm: 'Sulaman yang timbul dan nampak lebih sporty & eksklusif',
    descEn: 'Embossed stitching that looks sporty & exclusive',
  },
  {
    icon: Hand,
    titleBm: 'Anti-Slippery',
    titleEn: 'Anti-Slip',
    descBm: 'Grip lebih kuat pada pakaian, tak mudah gelincir macam material murah',
    descEn: 'Strong grip on clothing, won\'t slide like cheap materials',
  },
];

export const WhyFabricSilk = () => {
  const { language } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
            Fabric Silk
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-3">
            {language === 'bm' ? 'Kenapa Pilih Fabric Silk?' : 'Why Choose Fabric Silk?'}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {language === 'bm' 
              ? 'Bukan kulit biasa. Material premium yang direka khas untuk iklim Malaysia.' 
              : 'Not ordinary leather. Premium material designed for Malaysian climate.'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {language === 'bm' ? feature.titleBm : feature.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'bm' ? feature.descBm : feature.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
