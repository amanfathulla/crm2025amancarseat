import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

export const Footer = () => {
  const { language } = useLanguage();

  const handleLeatherCatalog = () => {
    const message = encodeURIComponent(language === 'bm' 
      ? "Assalamualaikum, saya berminat dengan koleksi Sensico Leather (Minimalist). Boleh saya lihat katalog?" 
      : "Hi, I'm interested in the Sensico Leather (Minimalist) collection. Can I see the catalog?");
    window.open(`https://wa.me/60194503184?text=${message}`, '_blank');
  };

  return (
    <footer style={{ background: 'var(--acs-panel)', borderTop: '1px solid var(--acs-line)' }}>
      {/* Leather Alternative Section */}
      <div className="border-b" style={{ borderColor: 'var(--acs-line)', background: 'rgba(28,32,39,0.6)' }}>
        <div className="max-w-[1120px] mx-auto px-6 py-8 md:py-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-base md:text-lg text-acs-paper mb-4">
              {language === 'bm' ? 'Nak material kulit? Kami juga ada!' : 'Want leather material? We have that too!'}
            </p>
            <p className="text-sm text-acs-ash mb-6">
              {language === 'bm' 
                ? 'Koleksi Sensico Leather Premium dengan corak Diamond yang sama – untuk boss yang prefer feel kulit.' 
                : 'Sensico Leather Premium collection with the same Diamond pattern.'}
            </p>
            <button onClick={handleLeatherCatalog} className="btn-acs-ghost inline-flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {language === 'bm' ? 'Lihat Katalog Kulit' : 'View Leather Catalog'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-[1120px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-[34px] h-[34px] border-[1.5px] border-[var(--acs-brass)] rounded flex items-center justify-center font-display text-[var(--acs-brass)] text-[18px] -rotate-3">AS</div>
              <span className="font-display text-[22px] tracking-wider text-acs-paper">AMAN<span className="text-acs-stitch">CAR</span>SEAT</span>
            </div>
            <p className="text-[13.5px] text-acs-ash leading-relaxed">
              {language === 'bm' 
                ? 'Pakar sarung tempat duduk kereta premium di Malaysia. Lebih 10 tahun pengalaman dalam industri automotif.' 
                : 'Premium car seat cover specialist in Malaysia. Over 10 years of experience in the automotive industry.'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[13px] uppercase tracking-wider text-acs-brass mb-3.5">
              {language === 'bm' ? 'Hubungi Kami' : 'Contact Us'}
            </h4>
            <div className="space-y-3">
              <a href="tel:+60194503184" className="flex items-center gap-3 text-[13.5px] text-acs-ash hover:text-acs-paper transition-colors">
                <Phone className="w-4 h-4" /> 019-450 3184
              </a>
              <a href="mailto:admin@amancarseat.com" className="flex items-center gap-3 text-[13.5px] text-acs-ash hover:text-acs-paper transition-colors">
                <Mail className="w-4 h-4" /> admin@amancarseat.com
              </a>
              <div className="flex items-start gap-3 text-[13.5px] text-acs-ash">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> <span>Kota Bharu, Kelantan</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-[13px] uppercase tracking-wider text-acs-brass mb-3.5">
              {language === 'bm' ? 'Waktu Operasi' : 'Business Hours'}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[13.5px] text-acs-ash">
                <Clock className="w-4 h-4" />
                <div>
                  <p>{language === 'bm' ? 'Isnin – Sabtu' : 'Monday – Saturday'}</p>
                  <p className="font-medium text-acs-paper">9:00 AM – 6:00 PM</p>
                </div>
              </div>
              <p className="text-[13.5px] text-acs-ash">
                {language === 'bm' ? 'Ahad: Tutup' : 'Sunday: Closed'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-5 text-center" style={{ borderColor: 'var(--acs-line)' }}>
          <p className="text-xs text-[#555a63]">
            © {new Date().getFullYear()} Aman Car Seat. {language === 'bm' ? 'Hak Cipta Terpelihara.' : 'All Rights Reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
