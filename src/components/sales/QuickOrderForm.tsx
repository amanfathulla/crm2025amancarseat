import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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

    const message = encodeURIComponent(
      `Assalamualaikum, saya berminat dengan Aman Car Seat.\n\nNama: ${name}\nNo HP: ${phone}\nModel Kereta: ${carModel}\nLokasi: ${location}\nJenis Seater: ${selectedSeater.label}\nDesign Pilihan: ${design.code} - ${designName}\nJumlah: RM${selectedSeater.price}`
    );
    window.open(`https://wa.me/60194503184?text=${message}`, "_blank");
  };

  const inputCls = "w-full px-[14px] py-[13px] rounded text-[14px] text-acs-paper focus:outline-none transition-colors";
  const inputStyle = { background: 'var(--acs-ink)', border: '1px solid var(--acs-line)' };

  return (
    <section id="quick-order" className="py-[72px] bg-acs-ink">
      <div className="max-w-[640px] mx-auto px-6">
        {/* Quote Panel */}
        <div className="rounded-[10px] p-[36px_30px]" style={{ background: 'var(--acs-panel-2)', border: '1px solid var(--acs-line)' }}>
          <h3 className="font-display text-acs-paper text-center text-[26px]">Dapatkan Sebut Harga Segera</h3>
          <p className="text-acs-ash text-center text-[13.5px] mt-2 mb-[26px]">
            {language === "bm" ? "Isi maklumat ringkas, kami hubungi anda dalam 24 jam." : "Fill in your details, we will contact you within 24 hours."}
          </p>

          <form onSubmit={handleQuote} className="space-y-3">
            <span className="font-mono-acs text-[11px] uppercase tracking-wider text-acs-ash block mb-2">Maklumat Anda</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={language === "bm" ? "Nama Anda" : "Your Name"}
                value={name}
                onChange={(e) => { setName(e.target.value); setQuoteShown(false); }}
                required
                className={inputCls}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder={language === "bm" ? "No HP (cth: 0123456789)" : "Phone (e.g., 0123456789)"}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setQuoteShown(false); }}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={language === "bm" ? "Model Kereta (cth: Myvi)" : "Car Model (e.g., Myvi)"}
                value={carModel}
                onChange={(e) => { setCarModel(e.target.value); setQuoteShown(false); }}
                required
                className={inputCls}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder={language === "bm" ? "Lokasi (cth: Shah Alam)" : "Location (e.g., Shah Alam)"}
                value={location}
                onChange={(e) => { setLocation(e.target.value); setQuoteShown(false); }}
                required
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Seater Selection */}
            <div className="pt-3">
              <span className="font-mono-acs text-[11px] uppercase tracking-wider text-acs-ash block mb-2">
                {language === "bm" ? "Pilih Jenis Seater:" : "Choose Seater Type:"}
              </span>
              <div className="flex gap-2.5 flex-wrap">
                {SEATER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSeater(opt.id); setQuoteShown(false); }}
                    className="flex-1 min-w-[90px] text-center py-3 rounded text-[13px] font-semibold transition-all"
                    style={{
                      border: `1px solid ${seater === opt.id ? 'var(--acs-brass)' : 'var(--acs-line)'}`,
                      color: seater === opt.id ? 'var(--acs-brass)' : 'var(--acs-ash)',
                      background: seater === opt.id ? 'rgba(207,162,39,0.07)' : 'transparent',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Design Selection */}
            <div className="pt-3">
              <span className="font-mono-acs text-[11px] uppercase tracking-wider text-acs-ash block mb-2">
                {language === "bm" ? "Pilih Design:" : "Choose Design:"}
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {DESIGN_COLORS.map((design, index) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => { setSelectedDesign(index); setQuoteShown(false); }}
                    className="flex-shrink-0 w-[60px] h-[44px] rounded border-2 overflow-hidden transition-all"
                    style={{ borderColor: selectedDesign === index ? 'var(--acs-brass)' : 'transparent' }}
                  >
                    <img src={design.image} alt={design.code} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Result */}
            {quoteShown && selectedSeater && selectedDesign !== null && (
              <div className="rounded-md p-5 mt-3" style={{ background: 'rgba(200,32,60,0.05)', border: '2px solid rgba(200,32,60,0.3)' }}>
                <p className="text-xs text-acs-ash mb-2">Sebut Harga Anda:</p>
                <div className="space-y-1 text-sm text-acs-paper">
                  <div className="flex justify-between"><span>Seater:</span><span className="font-medium">{selectedSeater.label}</span></div>
                  <div className="flex justify-between"><span>Design:</span><span className="font-medium">{DESIGN_COLORS[selectedDesign].code} - {language === "bm" ? DESIGN_COLORS[selectedDesign].name : DESIGN_COLORS[selectedDesign].nameEn}</span></div>
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between items-center" style={{ borderColor: 'var(--acs-line)' }}>
                  <span className="font-semibold text-acs-paper">Jumlah:</span>
                  <span className="font-display text-[28px] text-acs-brass">RM{selectedSeater.price}</span>
                </div>
              </div>
            )}

            {!quoteShown ? (
              <button
                type="submit"
                disabled={!isComplete}
                className="btn-acs-primary w-full justify-center py-4 mt-3 disabled:opacity-40"
              >
                <Calculator className="w-5 h-5 mr-2" />
                {language === "bm" ? "Sebut Harga" : "Get Quote"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="btn-acs-primary w-full justify-center py-4 mt-3"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {language === "bm" ? "Order WhatsApp" : "Order WhatsApp"}
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
