import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Check, Calculator } from "lucide-react";
import { DESIGN_COLORS } from "./ColorGallery";

const SEATER_OPTIONS = [
  { id: "2", label: "2 Seater", price: 130 },
  { id: "5", label: "5 Seater", price: 299 },
  { id: "7", label: "7 Seater", price: 349 },
];

export const QuickOrderForm = () => {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);
  const [seater, setSeater] = useState<string>("");
  const [quoteShown, setQuoteShown] = useState(false);

  const selectedSeater = SEATER_OPTIONS.find((s) => s.id === seater);
  const isComplete = name && carModel && location && selectedDesign !== null && seater;

  const handleQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setQuoteShown(true);
  };

  const handleWhatsApp = () => {
    if (!isComplete || !selectedSeater) return;
    const design = DESIGN_COLORS[selectedDesign!];
    const designName = language === "bm" ? design.name : design.nameEn;
    const message = encodeURIComponent(
      `Assalamualaikum, saya berminat dengan Aman Car Seat.\n\nNama: ${name}\nModel Kereta: ${carModel}\nLokasi: ${location}\nJenis Seater: ${selectedSeater.label}\nDesign Pilihan: ${design.code} - ${designName}\nJumlah: RM${selectedSeater.price}`
    );
    window.open(`https://wa.me/60194503184?text=${message}`, "_blank");
  };

  return (
    <section id="quick-order" className="py-12 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-card rounded-2xl shadow-lg border border-border p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {language === "bm" ? "Dapatkan Sebut Harga Segera" : "Get Instant Quote"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === "bm"
                ? "Isi maklumat ringkas, kami akan hubungi anda"
                : "Fill in your details, we will contact you"}
            </p>
          </div>

          <form onSubmit={handleQuote} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                placeholder={language === "bm" ? "Nama Anda" : "Your Name"}
                value={name}
                onChange={(e) => { setName(e.target.value); setQuoteShown(false); }}
                required
                className="h-12 text-base"
              />
              <Input
                type="text"
                placeholder={language === "bm" ? "Model Kereta (cth: Myvi, City)" : "Car Model (e.g., Myvi, City)"}
                value={carModel}
                onChange={(e) => { setCarModel(e.target.value); setQuoteShown(false); }}
                required
                className="h-12 text-base"
              />
              <Input
                type="text"
                placeholder={language === "bm" ? "Lokasi (cth: Shah Alam, JB)" : "Location (e.g., Shah Alam, JB)"}
                value={location}
                onChange={(e) => { setLocation(e.target.value); setQuoteShown(false); }}
                required
                className="h-12 text-base"
              />
            </div>

            {/* Seater Selection */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                {language === "bm" ? "Pilih Jenis Seater:" : "Choose Seater Type:"}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SEATER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSeater(opt.id); setQuoteShown(false); }}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      seater === opt.id
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Selection */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                {language === "bm" ? "Pilih Design Anda:" : "Choose Your Design:"}
              </p>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
                {DESIGN_COLORS.map((design, index) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => { setSelectedDesign(index); setQuoteShown(false); }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      selectedDesign === index
                        ? "border-primary ring-2 ring-primary/30 scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={design.image}
                      alt={language === "bm" ? design.name : design.nameEn}
                      className="w-full h-full object-cover"
                    />
                    {selectedDesign === index && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary rounded-full p-1">
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Result */}
            {quoteShown && selectedSeater && selectedDesign !== null && (
              <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-5 animate-in fade-in-50 duration-300">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === "bm" ? "Sebut Harga Anda:" : "Your Quote:"}
                </p>
                <div className="space-y-1 text-sm text-foreground">
                  <div className="flex justify-between"><span>{language === "bm" ? "Jenis Seater" : "Seater Type"}:</span><span className="font-medium">{selectedSeater.label}</span></div>
                  <div className="flex justify-between"><span>Design:</span><span className="font-medium">{DESIGN_COLORS[selectedDesign].code} - {language === "bm" ? DESIGN_COLORS[selectedDesign].name : DESIGN_COLORS[selectedDesign].nameEn}</span></div>
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-foreground">{language === "bm" ? "Jumlah" : "Total"}:</span>
                  <span className="text-2xl font-bold text-primary">RM{selectedSeater.price}</span>
                </div>
              </div>
            )}

            {!quoteShown ? (
              <Button
                type="submit"
                size="lg"
                disabled={!isComplete}
                className="w-full h-12 text-base font-semibold disabled:opacity-50"
              >
                <Calculator className="w-5 h-5 mr-2" />
                {language === "bm" ? "Sebut Harga" : "Get Quote"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleWhatsApp}
                size="lg"
                className="w-full h-12 text-base bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {language === "bm" ? "Order WhatsApp" : "Order WhatsApp"}
              </Button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
