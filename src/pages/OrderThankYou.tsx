import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, RotateCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderThankYou() {
  const [params] = useSearchParams();
  const customerId = params.get("customer_id");
  const paidParam  = params.get("paid");
  const statusParam = params.get("status");

  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  const isPaid = paidParam === "true" || (!statusParam && !paidParam) || (statusParam !== "failed" && paidParam !== "false");

  useEffect(() => {
    if (customerId) {
      supabase.from("customers").select("name").eq("id", customerId).single()
        .then(({ data }) => { if (data) setCustomerName(data.name); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-y-auto">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] ${isPaid ? "bg-green-600/12" : "bg-red-600/12"}`} />
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8">
          <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-10 w-10 object-contain mx-auto opacity-70" />
        </div>

        <div className="w-full max-w-md">
          <div className={`rounded-3xl border p-8 md:p-10 text-center backdrop-blur-sm ${isPaid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isPaid ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {isPaid
                ? <CheckCircle className="h-10 w-10 text-green-400" />
                : <XCircle className="h-10 w-10 text-red-400" />
              }
            </div>

            {/* Text */}
            {isPaid ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Pembayaran Berjaya!</h1>
                {customerName && (
                  <p className="text-white/65 mb-2 text-sm">
                    Terima kasih, <span className="text-white font-semibold">{customerName}</span>! 🎉
                  </p>
                )}
                <p className="text-white/45 text-sm leading-relaxed mb-8">
                  Tempahan anda telah diterima dan sedang diproses. Kami akan menghubungi anda tidak lama lagi untuk pengesahan.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Pembayaran Tidak Berjaya</h1>
                <p className="text-white/45 text-sm leading-relaxed mb-8">
                  Sila cuba lagi atau hubungi kami untuk mendapatkan bantuan.
                </p>
              </>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Link to="/order">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Buat Tempahan Lain
                </Button>
              </Link>
              <a href="https://wa.me/601168836411" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full h-11 border border-white/10 text-white/55 hover:text-white hover:bg-white/5 rounded-xl text-sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Hubungi Kami via WhatsApp
                </Button>
              </a>
            </div>
          </div>

          <p className="text-white/20 text-xs text-center mt-6">
            ACS Legacy AmancarseatCover
          </p>
        </div>
      </div>
    </div>
  );
}
