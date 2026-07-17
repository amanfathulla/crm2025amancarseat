import { useLanguage } from "@/contexts/LanguageContext";

const features = [
  {
    idx: 'TEMP',
    titleBm: 'Lebih Sejuk',
    titleEn: 'Cooler Feel',
    descBm: 'Tidak menyerap haba walaupun parking tengah panas terik — duduk terus tanpa alas tambahan.',
    descEn: 'Doesn\'t absorb heat even when parked under the hot sun.',
  },
  {
    idx: 'STITCH',
    titleBm: 'Corak Diamond',
    titleEn: 'Diamond Pattern',
    descBm: 'Sulaman timbul yang dijahit tangan, nampak lebih sporty dan eksklusif berbanding seat standard.',
    descEn: 'Embossed hand-stitched pattern — sporty and exclusive.',
  },
  {
    idx: 'GRIP',
    titleBm: 'Anti-Slippery',
    titleEn: 'Anti-Slip',
    descBm: 'Grip lebih kuat pada pakaian — tak mudah gelincir macam material sarung murah di pasaran.',
    descEn: 'Strong grip on clothing — won\'t slide like cheap covers.',
  },
];

export const WhyFabricSilk = () => {
  const { language } = useLanguage();

  return (
    <section className="py-[72px] bg-acs-ink">
      <div className="max-w-[1120px] mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-[560px] mx-auto mb-10">
          <div className="acs-eyebrow justify-center mb-3.5">Fabric Silk</div>
          <h2 className="font-display text-acs-paper mb-2.5" style={{ fontSize: 'clamp(30px,5vw,44px)' }}>
            {language === 'bm' ? 'Kenapa Bukan Kulit Biasa' : 'Why Not Ordinary Leather'}
          </h2>
          <p className="text-acs-ash text-[15px] leading-relaxed">
            {language === 'bm' 
              ? 'Material direka khas untuk iklim panas & lembap Malaysia.' 
              : 'Material designed specifically for hot & humid Malaysian climate.'}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1120px] mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="rounded-md p-[26px_22px] relative" 
              style={{ background: 'var(--acs-panel)', border: '1px solid var(--acs-line)' }}
            >
              <span className="font-mono-acs text-[11px] text-acs-stitch block mb-3.5">{feature.idx}</span>
              <h3 className="text-[18px] font-bold text-acs-paper mb-2">{language === 'bm' ? feature.titleBm : feature.titleEn}</h3>
              <p className="text-[13.5px] text-acs-ash leading-relaxed">{language === 'bm' ? feature.descBm : feature.descEn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
