import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderThankYou() {
  const [params] = useSearchParams();
  const customerId = params.get("customer_id");
  const status = params.get("paid");
  const billplzStatus = params.get("billplz_status");

  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  const isPaid = status === "true" || (billplzStatus !== "failed" && !params.get("status"));

  useEffect(() => {
    if (customerId) {
      supabase.from("customers").select("name, order_status").eq("id", customerId).single()
        .then(({ data }) => {
          if (data) setCustomerName(data.name);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
          {isPaid ? (
            <>
              <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Pembayaran Berjaya!</h1>
              {customerName && <p className="text-white/70 mb-2">Terima kasih, <span className="text-white font-semibold">{customerName}</span>!</p>}
              <p className="text-white/50 text-sm mb-8">Tempahan anda telah diterima. Kami akan menghubungi anda tidak lama lagi.</p>
            </>
          ) : (
            <>
              <XCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">Pembayaran Tidak Berjaya</h1>
              <p className="text-white/50 text-sm mb-8">Sila cuba lagi atau hubungi kami untuk bantuan.</p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <Link to="/order">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-xl">
                Buat Tempahan Lain
              </Button>
            </Link>
            <a href="https://wa.me/60" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full border-white/20 text-white/70 hover:text-white rounded-xl">
                Hubungi Kami
              </Button>
            </a>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-6">ACS Legacy AmancarseatCover</p>
      </div>
    </div>
  );
}
