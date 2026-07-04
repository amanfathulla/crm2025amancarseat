import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Download, ArrowLeft, Share2, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

const fmtCurrency = (v: number) => `RM ${(v || 0).toFixed(2)}`;
const fmtDate = (d: string | null) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ms-MY", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const paymentLabels: Record<string, string> = {
  billplz: "BillPlz (Online)",
  toyyibpay: "toyyibPay (Online)",
  chip: "CHIP (Online)",
  bayarcash: "Bayarcash (Online)",
  bcl: "BCL Pay (Online)",
  whatsapp: "WhatsApp (Manual)",
  manual: "Manual",
};

export function CustomerReceipt() {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { authClient } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    if (id) {
      fetchCustomer(id);
    } else {
      setIsLoading(false);
    }
  }, [location.search]);

  const fetchCustomer = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      setCustomer(data);
    } catch {
      toast({ title: "Ralat", description: "Tidak dapat memuatkan maklumat pelanggan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    const el = document.getElementById("customer-receipt");
    if (!el) return;
    toast({ title: "Menjana resit...", description: "Sila tunggu sebentar" });
    html2pdf()
      .from(el)
      .set({
        margin: 10,
        filename: `Resit-ACS-${customer?.order_number || customer?.id?.slice(0, 8)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      })
      .save()
      .then(() => toast({ title: "Berjaya", description: "Resit telah dimuat turun" }))
      .catch(() => toast({ title: "Ralat", description: "Gagal menjana resit", variant: "destructive" }));
  };

  const handleShare = async () => {
    const orderNo = customer?.order_number || "N/A";
    const statusText = customer?.order_status === "completed" ? "✅ Selesai" : customer?.order_status === "processing" ? "⏳ Dalam Proses" : "❌ Dibatalkan";
    const text =
      `📄 *RESIT PEMBAYARAN*\n` +
      `*Sarung Kusyen AMANCARSEAT*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *No. Pesanan:* #${orderNo}\n` +
      `📅 *Tarikh:* ${fmtDate(customer?.order_date || customer?.created_at)}\n` +
      `📌 *Status:* ${statusText}\n\n` +
      `👤 *MAKLUMAT PELANGGAN*\n` +
      `┌─────────────────────\n` +
      `│ Nama: ${customer?.name}\n` +
      `│ Telefon: ${customer?.phone || "-"}\n` +
      `│ Alamat: ${customer?.address || "-"}\n` +
      `│ Negeri: ${customer?.city || customer?.state || "-"}\n` +
      `└─────────────────────\n\n` +
      `📦 *BUTIRAN PESANAN*\n` +
      `┌─────────────────────\n` +
      `│ Produk: ${customer?.product || "-"}${customer?.product_variation ? ` (${customer.product_variation})` : ""}\n` +
      `│ Model Kereta: ${customer?.car_model || "-"}\n` +
      `│ Jumlah: ${fmtCurrency(customer?.sales_amount)}\n` +
      `│ Dibayar: ${fmtCurrency(customer?.paid_amount)}\n` +
      `└─────────────────────\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Sila sahkan penerimaan bayaran.\n` +
      `Terima kasih! 🙏\n\n` +
      `Di bawah saya sertakan resit pembayaran.\n` +
      `━━━━━━━━━━━━━━━━━━━━`;
    const waUrl = `https://wa.me/${customer?.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse">Memuatkan resit...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="text-center py-8">
          <p>Tiada pelanggan dipilih.</p>
          <Button onClick={() => navigate("/customers")} variant="secondary" className="mt-4">
            Ke Senarai Pelanggan
          </Button>
        </div>
      </div>
    );
  }

  const orderNo = customer.order_number || "N/A";
  const orderDate = fmtDate(customer.order_date || customer.created_at);
  const isCompleted = customer.order_status === "completed";
  const isProcessing = customer.order_status === "processing";
  const showEmail = customer.email && !customer.email.includes("@noemail.com") && !customer.email.includes("@temp.local");
  const paymentSourceKey = String(customer.payment_source || "").toLowerCase();
  const paymentKey = paymentSourceKey === "whatsapp"
    ? "whatsapp"
    : String(customer.payment_gateway || customer.payment_source || "manual").toLowerCase();
  const paymentSource = paymentLabels[paymentKey] || `${paymentKey.charAt(0).toUpperCase()}${paymentKey.slice(1)} (Online)`;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-4 gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </Button>
        <h1 className="text-xl font-bold">Resit Pelanggan</h1>
      </div>

      <Card className="w-full mb-4">
        <CardContent className="p-0">
          <div id="customer-receipt" className="p-6 bg-white text-black">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png"
                  alt="ACS Logo"
                  className="h-14 w-auto"
                />
                <div>
                  <h2 className="text-xl font-bold">RESIT RASMI</h2>
                  <p className="text-gray-500 text-sm">ACS Legacy</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-base">#{orderNo}</p>
                <p className="text-gray-500">{orderDate}</p>
                <p className="text-gray-400 text-xs mt-1">{paymentSource}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-5 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 uppercase tracking-wide">Maklumat Pelanggan</h3>
              <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                <ReceiptRow label="Nama" value={customer.name} />
                <ReceiptRow label="Telefon" value={customer.phone} />
                {showEmail && <ReceiptRow label="Emel" value={customer.email} />}
                {customer.address && <ReceiptRow label="Alamat" value={customer.address} />}
                <ReceiptRow label="Negeri" value={customer.city || customer.state} />
                {customer.car_model && <ReceiptRow label="Model Kereta" value={customer.car_model} />}
              </div>
            </div>

            {/* Order Table */}
            <div className="mb-5">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 uppercase tracking-wide">Butiran Pesanan</h3>
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2.5 text-left font-semibold">Produk</th>
                    <th className="p-2.5 text-right font-semibold">Jumlah (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="p-2.5">
                      {customer.product || "Produk"}
                      {customer.product_variation && <span className="text-gray-500"> — {customer.product_variation}</span>}
                      {customer.car_model && <span className="block text-xs text-gray-400">{customer.car_model}</span>}
                    </td>
                    <td className="p-2.5 text-right">{fmtCurrency(customer.sales_amount)}</td>
                  </tr>
                  <tr className="border-t border-gray-200 bg-gray-50 font-bold">
                    <td className="p-2.5">Jumlah Dibayar</td>
                    <td className="p-2.5 text-right">{fmtCurrency(customer.paid_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status */}
            <div className="mb-5 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Status Pembayaran:</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                isCompleted ? "bg-green-100 text-green-800"
                  : isProcessing ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}>
                {isCompleted ? "Selesai" : isProcessing ? "Dalam Proses" : "Dibatalkan"}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
              <p>Terima kasih kerana memilih ACS Legacy!</p>
              <p className="mt-1">Quality Products & Services</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Cetak
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" /> Hantar WhatsApp
          </Button>
          <Button size="sm" onClick={generatePDF}>
            <Download className="mr-1.5 h-4 w-4" /> Muat Turun PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <>
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </>
  );
}
