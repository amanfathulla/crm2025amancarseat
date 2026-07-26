import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const Footer = () => {
  const { language } = useLanguage();

  const now = new Date();
  const dateStr = now.toLocaleDateString(language === 'bm' ? 'ms-MY' : 'en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(language === 'bm' ? 'ms-MY' : 'en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <footer className="bg-black text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                <img src="/acs-logo.png" alt="AmanCarSeat" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl text-white">AMANCARSEAT</span>
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              {language === 'bm' 
                ? 'Pakar sarung tempat duduk kereta premium di Malaysia. Lebih 10 tahun pengalaman dalam industri automotif.' 
                : 'Premium car seat cover specialist in Malaysia. Over 10 years of experience in the automotive industry.'}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">
              {language === 'bm' ? 'Hubungi Kami' : 'Contact Us'}
            </h4>
            <div className="space-y-3">
              <a 
                href="tel:+60194503184" 
                className="flex items-center gap-3 text-sm text-white/85 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                019-450 3184
              </a>
              <a 
                href="mailto:admin@amancarseat.com" 
                className="flex items-center gap-3 text-sm text-white/85 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                admin@amancarseat.com
              </a>
              <div className="flex items-start gap-3 text-sm text-white/85">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Kota Bharu, Kelantan</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">
              {language === 'bm' ? 'Waktu Operasi' : 'Business Hours'}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/85">
                <Clock className="w-4 h-4" />
                <div>
                  <p>{language === 'bm' ? 'Isnin - Sabtu' : 'Monday - Saturday'}</p>
                  <p className="font-medium text-white">9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <p className="text-sm text-white/85">
                {language === 'bm' ? 'Ahad: Tutup' : 'Sunday: Closed'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center space-y-2">
          <p className="text-sm text-white/85">
            © {new Date().getFullYear()} Aman Car Seat. {language === 'bm' ? 'Hak Cipta Terpelihara.' : 'All Rights Reserved.'}
          </p>
          <p className="text-xs text-white/70">
            {dateStr} | {timeStr}
          </p>
        </div>
      </div>
    </footer>
  );
};
