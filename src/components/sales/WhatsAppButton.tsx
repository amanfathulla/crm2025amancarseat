import { useLanguage } from "@/contexts/LanguageContext";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
}

export const WhatsAppButton = ({ phoneNumber = "60194503184" }: WhatsAppButtonProps) => {
  const { t } = useLanguage();

  const handleClick = () => {
    const message = encodeURIComponent("Saya berminat dengan Aman Car Seat. Boleh saya dapatkan maklumat lanjut?");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white px-5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow group"
      style={{ 
        boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
      }}
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="font-semibold hidden sm:inline">{t.whatsappCTA}</span>
      
      {/* Pulse ring effect */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
    </button>
  );
};
