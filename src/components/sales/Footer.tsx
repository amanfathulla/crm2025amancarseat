import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  const { language } = useLanguage();

  const handleLeatherCatalog = () => {
    const message = encodeURIComponent(language === 'bm' 
      ? "Assalamualaikum, saya berminat dengan koleksi Sensico Leather (Minimalist). Boleh saya lihat katalog?" 
      : "Hi, I'm interested in the Sensico Leather (Minimalist) collection. Can I see the catalog?");
    window.open(`https://wa.me/60194503184?text=${message}`, '_blank');
  };

  return (
    <footer className="bg-card border-t border-border">
      {/* Leather Alternative Section */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-base md:text-lg text-muted-foreground mb-4">
              {language === 'bm' 
                ? 'Nak material kulit? Kami juga ada!' 
                : 'Want leather material? We have that too!'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {language === 'bm' 
                ? 'Koleksi Sensico Leather Premium dengan corak Diamond yang sama – untuk boss yang prefer feel kulit.' 
                : 'Sensico Leather Premium collection with the same Diamond pattern – for those who prefer the leather feel.'}
            </p>
            <Button 
              variant="secondary"
              size="lg"
              onClick={handleLeatherCatalog}
              className="px-8 py-5 rounded-full font-bold border-2 border-border hover:border-primary/50 transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'bm' ? 'Lihat Katalog Kulit' : 'View Leather Catalog'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-foreground">AMANCARSEAT</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'bm' 
                ? 'Pakar sarung tempat duduk kereta premium di Malaysia. Lebih 10 tahun pengalaman dalam industri automotif.'
                : 'Premium car seat cover specialist in Malaysia. Over 10 years of experience in the automotive industry.'}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === 'bm' ? 'Hubungi Kami' : 'Contact Us'}
            </h4>
            <div className="space-y-3">
              <a 
                href="tel:+60194503184" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                019-450 3184
              </a>
              <a 
                href="mailto:admin@amancarseat.com" 
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                admin@amancarseat.com
              </a>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Kota Bharu, Kelantan</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">
              {language === 'bm' ? 'Waktu Operasi' : 'Business Hours'}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <div>
                  <p>{language === 'bm' ? 'Isnin - Sabtu' : 'Monday - Saturday'}</p>
                  <p className="font-medium text-foreground">9:00 AM - 6:00 PM</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'bm' ? 'Ahad: Tutup' : 'Sunday: Closed'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aman Car Seat. {language === 'bm' ? 'Hak Cipta Terpelihara.' : 'All Rights Reserved.'}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {new Date().toLocaleDateString(language === 'bm' ? 'ms-MY' : 'en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}{' '}
            | {new Date().toLocaleTimeString(language === 'bm' ? 'ms-MY' : 'en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
      </div>
    </footer>
  );
};
