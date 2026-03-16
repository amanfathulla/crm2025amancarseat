import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, RotateCcw, MessageCircle, Download, Package, Car, MapPin, Phone, Mail, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerData {
  name: string;
  phone: string;
  email: string;
  car_model: string;
  product: string;
  product_variation: string;
  sales_amount: number;
  paid_amount: number;
  address: string;
  city: string;
  state: string;
  order_number: number;
  order_date: string;
  order_status: string;
  payment_source: string;
}

const WA_NUMBER = "60194503184";

export default function OrderThankYou() {
  const [params] = useSearchParams();
  const customerId = params.get("customer_id");
  const paidParam  = params.get("paid");
  const statusParam = params.get("status");

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const sourceParam = params.get("source");
  const isPaid = paidParam === "true" || (!statusParam && !paidParam) || (statusParam !== "failed" && paidParam !== "false");
  const isWhatsapp = sourceParam === "whatsapp" || customer?.payment_source === "whatsapp";

  useEffect(() => {
    if (customerId) {
      supabase
        .from("customers")
        .select("name, phone, email, car_model, product, product_variation, sales_amount, paid_amount, address, city, state, order_number, order_date, order_status, payment_source")
        .eq("id", customerId)
        .single()
        .then(({ data }) => {
          if (data) setCustomer(data as CustomerData);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [customerId]);

  const formatCurrency = (v: number) => `RM ${Number(v || 0).toFixed(2)}`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const waMessage = customer
    ? encodeURIComponent(
        `Assalamualaikum ACS Legacy,\n\nSaya ingin bertanya mengenai tempahan saya:\n\n` +
        `📋 No. Tempahan: #${customer.order_number || "—"}\n` +
        `👤 Nama: ${customer.name}\n` +
        `🚗 Kereta: ${customer.car_model}\n` +
        `📦 Produk: ${customer.product} ${customer.product_variation ? `(${customer.product_variation})` : ""}\n` +
        `💰 Jumlah: ${formatCurrency(customer.paid_amount)}\n\n` +
        `Mohon bantuan. Terima kasih! 🙏`
      )
    : encodeURIComponent("Assalamualaikum ACS Legacy, saya perlukan bantuan mengenai tempahan saya.");

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-y-auto">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-receipt { background: white !important; color: black !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[120px] ${isPaid ? "bg-green-600/12" : "bg-red-600/12"}`} />
      </div>

      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 no-print">
          <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-10 w-10 object-contain mx-auto opacity-70" />
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* ── Status Card ── */}
          <div className={`rounded-3xl border p-8 md:p-10 text-center backdrop-blur-sm no-print ${isPaid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isPaid ? "bg-green-500/15" : "bg-red-500/15"}`}>
              {isPaid
                ? <CheckCircle className="h-10 w-10 text-green-400" />
                : <XCircle className="h-10 w-10 text-red-400" />
              }
            </div>

            {isPaid ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {isWhatsapp ? "Tempahan Berjaya Dihantar! 📱" : "Pembayaran Berjaya!"}
                </h1>
                {customer && (
                  <p className="text-white/65 mb-2 text-sm">
                    Terima kasih, <span className="text-white font-semibold">{customer.name}</span>! 🎉
                  </p>
                )}
                {isWhatsapp ? (
                  <div className="text-left mb-8 space-y-3">
                    <p className="text-white/50 text-sm leading-relaxed">
                      Tempahan anda telah <strong className="text-white">berjaya disimpan</strong> dalam sistem kami. Sila lengkapkan pembayaran melalui WhatsApp.
                    </p>
                    <div className="rounded-xl bg-green-500/10 border border-green-500/25 p-3 space-y-1.5">
                      <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">Nombor Akaun Pembayaran</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏦</span>
                        <div>
                          <p className="text-white font-bold text-sm">Maybank – ACS LEGACY</p>
                          <p className="text-green-400 font-bold text-lg tracking-widest">553038596454</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs">Setelah bayaran dibuat, hantar bukti bayaran kepada kami via WhatsApp untuk pengesahan. ✅</p>
                  </div>
                ) : (
                  <p className="text-white/45 text-sm leading-relaxed mb-8">
                    Tempahan anda telah diterima dan sedang diproses. Kami akan menghubungi anda tidak lama lagi untuk pengesahan.
                  </p>
                )}
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
              <a href={`https://wa.me/${WA_NUMBER}?text=${waMessage}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full h-11 border border-white/10 text-white/55 hover:text-white hover:bg-white/5 rounded-xl text-sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Bantuan via WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* ── Receipt Card (shown when paid & customer data available) ── */}
          {isPaid && customer && (
            <div className="print-receipt rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
              {/* Receipt header */}
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" alt="ACS" className="h-8 w-8 object-contain opacity-80" />
                  <div>
                    <p className="text-white font-bold text-sm">ACS Legacy</p>
                    <p className="text-white/50 text-xs">AmancarseatCover</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide">No. Tempahan</p>
                  <p className="text-white font-bold text-sm">#{customer.order_number || "—"}</p>
                </div>
              </div>

              {/* Receipt body */}
              <div className="px-5 py-4 space-y-4">
                {/* Customer info */}
                <div className="space-y-2">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide font-semibold">Maklumat Pembeli</p>
                  <div className="space-y-1.5">
                    <ReceiptRow icon={<Hash className="h-3 w-3" />} label={customer.name} />
                    {customer.phone && <ReceiptRow icon={<Phone className="h-3 w-3" />} label={customer.phone} />}
                    {customer.email && !customer.email.includes("@noemail") && (
                      <ReceiptRow icon={<Mail className="h-3 w-3" />} label={customer.email} />
                    )}
                    {(customer.city || customer.state) && (
                      <ReceiptRow icon={<MapPin className="h-3 w-3" />} label={[customer.city, customer.state].filter(Boolean).join(", ")} />
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Order info */}
                <div className="space-y-2">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide font-semibold">Maklumat Tempahan</p>
                  <div className="space-y-1.5">
                    <ReceiptRow icon={<Car className="h-3 w-3" />} label={`Model: ${customer.car_model || "—"}`} />
                    <ReceiptRow icon={<Package className="h-3 w-3" />} label={`${customer.product || "—"}${customer.product_variation ? ` — ${customer.product_variation}` : ""}`} />
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-white/40">Tarikh Tempahan</span>
                      <span className="text-white/70">{formatDate(customer.order_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Payment summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Harga Produk</span>
                    <span className="text-white/70">{formatCurrency(customer.sales_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm font-semibold">Jumlah Dibayar</span>
                    <span className="text-green-400 font-bold text-base">{formatCurrency(customer.paid_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Status</span>
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Berjaya Dibayar
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt footer */}
              <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
                <p className="text-white/30 text-[10px]">Simpan resit ini sebagai rujukan</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePrint}
                  className="text-white/50 hover:text-white hover:bg-white/5 text-xs h-7 gap-1"
                >
                  <Download className="h-3 w-3" />
                  Simpan / Cetak
                </Button>
              </div>
            </div>
          )}

          <p className="text-white/20 text-xs text-center mt-2 no-print">
            ACS Legacy AmancarseatCover
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/30 shrink-0">{icon}</span>
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}
