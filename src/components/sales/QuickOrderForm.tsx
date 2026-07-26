import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Check, Calculator } from "lucide-react";
import { DESIGN_COLORS } from "./ColorGallery";
import { supabase } from "@/integrations/supabase/client";

const SEATER_OPTIONS = [
  { id: "2", label: "2 Seater", price: 130 },
  { id: "5", label: "5 Seater", price: 299 },
  { id: "7", label: "7 Seater", price: 349 },
];

export const QuickOrderForm = () => {
  const { language } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carModel, setCarModel] = useState("");
  const [location, setLocation] = useState("");
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);
  const [seater, setSeater] = useState<string>("");
  const [quoteShown, setQuoteShown] = useState(false);

  const selectedSeater = SEATER_OPTIONS.find((s) => s.id === seater);
  const isComplete = name && phone && carModel && location && selectedDesign !== null && seater;

  const handleQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setQuoteShown(true);
  };

  const handleWhatsApp = async () => {
    if (!isComplete || !selectedSeater) return;
    const design = DESIGN_COLORS[selectedDesign!];
    const designName = language === "bm" ? design.name : design.nameEn;

    // 1. Save lead to CRM (anon key — RLS allows public INSERT)
    try {
      const { error } = await supabase.from("leads").insert({
        name: name.trim(),
        phone: phone.trim(),
        car_model: carModel.trim(),
        location: location.trim(),
        status: "new",
      });
      if (error) console.error("Lead insert error:", error.message);
    } catch (err) {
      console.error("Failed to save lead:", err);
    }

    // 2. Send Telegram notification (fire-and-forget)
    try {
      await fetch(
        "https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/telegram-notify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead: {
              name: name.trim(),
              phone: phone.trim(),
              car_model: carModel.trim(),
              location: location.trim(),
              seater: selectedSeater.label,
              design: `${design.code} - ${designName}`,
              price: selectedSeater.price,
            },
          }),
        }
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    // 3. Open WhatsApp with pre-filled message
    const message = encodeURIComponent(
      `Assalamualaikum, saya berminat dengan Aman Car Seat.\n\nNama: ${name}\nNo HP: ${phone}\nModel Kereta: ${carModel}\nLokasi: ${location}\nJenis Seater: ${selectedSeater.label}\nDesign Pilihan: ${design.code} - ${designName}\nJumlah: RM${selectedSeater.price}`
    );
    window.open(`https://wa.me/60194503184?text=${message}`, "_blank");
  };

  return (
    <section id="quick-order" className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {language === "bm" ? "Dapatkan Sebut Harga Segera" : "Get Instant Quote"}
            </h3>
            <p className="text-sm text-gray-500">
              {language === "bm"
                ? "Isi maklumat ringkas, kami akan hubungi anda"
                : "Fill in your details, we will contact you"}
            </p>
          </div>

          <form onSubmit={handleQuote} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  {language === "bm" ? "Nama Anda" : "Your Name"}
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setQuoteShown(false); }}
                  required
                  className="h-12 text-base bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-zinc-900 focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  {language === "bm" ? "No HP" : "Phone"}
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setQuoteShown(false); }}
                  required
                  className="h-12 text-base bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-zinc-900 focus:ring-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  {language === "bm" ? "Model Kereta" : "Car Model"}
                </label>
                <Input
                  type="text"
                  value={carModel}
                  onChange={(e) => { setCarModel(e.target.value); setQuoteShown(false); }}
                  required
                  className="h-12 text-base bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-zinc-900 focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  {language === "bm" ? "Lokasi" : "Location"}
                </label>
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setQuoteShown(false); }}
                  required
                  className="h-12 text-base bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-zinc-900 focus:ring-0"
                />
              </div>
            </div>

            {/* Seater Selection */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">
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
                        ? "border-zinc-900 bg-zinc-900/[0.06] ring-2 ring-zinc-900/20"
                        : "border-gray-300 bg-white hover:border-zinc-900/50"
                    }`}
                  >
                    <div className={`font-bold ${seater === opt.id ? "text-zinc-900" : "text-gray-900"}`}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">RM{opt.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Selection */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">
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
                        ? "border-zinc-900 ring-2 ring-zinc-900/20 scale-105"
                        : "border-gray-300 hover:border-zinc-900/50"
                    }`}
                  >
                    <img
                      src={design.image}
                      alt={language === "bm" ? design.name : design.nameEn}
                      className="w-full h-full object-cover"
                    />
                    {selectedDesign === index && (
                      <div className="absolute inset-0 bg-zinc-900/20 flex items-center justify-center">
                        <div className="bg-zinc-900 rounded-full p-1">
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Result */}
            {quoteShown && selectedSeater && selectedDesign !== null && (
              <div className="bg-zinc-900/[0.04] border-2 border-zinc-900/30 rounded-xl p-5 animate-in fade-in-50 duration-300">
                <p className="text-sm font-semibold text-gray-500 mb-2">
                  {language === "bm" ? "Sebut Harga Anda:" : "Your Quote:"}
                </p>
                <div className="space-y-1 text-sm text-gray-900">
                  <div className="flex justify-between"><span>{language === "bm" ? "Jenis Seater" : "Seater Type"}:</span><span className="font-semibold">{selectedSeater.label}</span></div>
                  <div className="flex justify-between"><span>Design:</span><span className="font-semibold">{DESIGN_COLORS[selectedDesign].code} - {language === "bm" ? DESIGN_COLORS[selectedDesign].name : DESIGN_COLORS[selectedDesign].nameEn}</span></div>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">{language === "bm" ? "Jumlah" : "Total"}:</span>
                  <span className="text-2xl font-extrabold text-zinc-900">RM{selectedSeater.price}</span>
                </div>
              </div>
            )}

            {!quoteShown ? (
              <Button
                type="submit"
                size="lg"
                disabled={!isComplete}
                className="w-full h-12 text-base font-bold disabled:opacity-50 bg-zinc-900 hover:bg-black text-white"
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
