import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Phone,
  Mail,
  MapPin,
  Car,
  Package,
  Calendar,
  Clock,
  Hash,
  Pencil,
  Trash2,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock3,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  className?: string;
}

const getTimePeriod = (timeString: string) => {
  const time = new Date(`2000-01-01T${timeString}`);
  const hours = time.getHours();
  if (hours >= 6 && hours < 12) return "Pagi";
  if (hours >= 12 && hours < 18) return "Petang";
  if (hours >= 18 && hours < 24) return "Malam";
  return "Lewat Malam";
};

const statusConfig: Record<string, { label: string; className: string }> = {
  processing: { label: "In Process", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" },
  completed:  { label: "Completed",  className: "bg-green-500/15 text-green-600 border-green-500/30" },
  cancelled:  { label: "Cancelled",  className: "bg-red-500/15 text-red-500 border-red-500/30" },
};

const paymentBadge: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  completed: {
    label: "Berjaya",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-500/15 text-green-600 border-green-500/30",
  },
  cancelled: {
    label: "Gagal",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-500/15 text-red-500 border-red-500/30",
  },
  processing: {
    label: "Pending",
    icon: <Clock3 className="h-3 w-3" />,
    className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  },
};

// Payment source config
const sourceConfig = {
  billplz: {
    label: "BillPlz",
    icon: <CreditCard className="h-3 w-3" />,
    className: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <MessageCircle className="h-3 w-3" />,
    className: "bg-green-500/15 text-green-600 border-green-500/30",
  },
};

export function CustomerDetails({ customer, onEdit, onDelete, index, className }: CustomerDetailsProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ms-MY", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const status = statusConfig[customer.order_status] ?? { label: customer.order_status, className: "bg-muted text-muted-foreground" };
  const payment = paymentBadge[customer.order_status] ?? paymentBadge.processing;
  const source = sourceConfig[(customer.payment_source as keyof typeof sourceConfig) ?? "billplz"] ?? sourceConfig.billplz;

  const location = [customer.city, customer.state].filter(Boolean).join(", ") || customer.location || "—";

  // Is BillPlz & pending → show follow-up WA button
  const isBillplzPending = (!customer.payment_source || customer.payment_source === "billplz") && customer.order_status === "processing";

  // Build customer WhatsApp message
  const orderNum = customer.order_number ? `#${customer.order_number}` : `#${index}`;
  const waMessage = encodeURIComponent(
    `Assalamualaikum, ini adalah makluman tempahan daripada *ACS Legacy AmancarseatCover* 🚗\n\n` +
    `📋 *No. Tempahan: ${orderNum}*\n` +
    `👤 Nama: ${customer.name}\n` +
    `📱 Telefon: ${customer.phone || "—"}\n` +
    `🚗 Model Kereta: ${customer.car_model || "—"}\n` +
    `📦 Produk: ${customer.product || "—"}${customer.product_variation ? ` (${customer.product_variation})` : ""}\n` +
    `📅 Tarikh Tempahan: ${formatDate(customer.order_date)}\n` +
    `💰 Jumlah Dibayar: RM ${Number(customer.paid_amount || 0).toFixed(2)}\n` +
    `🔖 Status: ${status.label}\n\n` +
    `Terima kasih kerana memilih ACS Legacy! 🙏`
  );

  // Follow-up reminder WA (for pending BillPlz)
  const waFollowupMessage = encodeURIComponent(
    `Assalamualaikum ${customer.name} 😊\n\n` +
    `Ini peringatan mesra dari *ACS Legacy AmancarseatCover* 🚗\n\n` +
    `Kami perasan tempahan anda ${orderNum} masih belum selesai pembayaran melalui BillPlz.\n\n` +
    `📦 Produk: ${customer.product || "—"}${customer.product_variation ? ` (${customer.product_variation})` : ""}\n` +
    `💰 Jumlah: RM ${Number(customer.paid_amount || 0).toFixed(2)}\n\n` +
    `Jika ada sebarang masalah dengan pembayaran, boleh hubungi kami ya! 🙏\n` +
    `Atau bayar melalui:\n🏦 Maybank – ACS LEGACY\n🔢 553038596454`
  );

  const waPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, "").replace(/^0/, "60") : "";
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMessage}` : null;
  const waFollowupLink = waPhone ? `https://wa.me/${waPhone}?text=${waFollowupMessage}` : null;

  return (
    <AccordionItem value={customer.id} className={`border-b ${className || ""}`}>
      {/* ── Trigger ── */}
      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-3 [&>svg]:shrink-0">
        <div className="flex items-center gap-2 w-full min-w-0 pr-1">
          {/* Order badge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-[9px] text-primary/60 font-medium leading-none">No.</span>
            <span className="text-xs font-bold text-primary leading-tight">
              {customer.order_number ? customer.order_number.toLocaleString() : index}
            </span>
          </div>

          {/* Name + phone */}
          <div className="flex-1 min-w-0 text-left overflow-hidden">
            <p className="font-semibold text-foreground text-sm truncate leading-tight">{customer.name}</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">{customer.phone || "—"}</p>
          </div>

          {/* Right: payment source icon + status + amount */}
          <div className="shrink-0 flex flex-col items-end gap-1 ml-1 min-w-[90px]">
            <div className="flex items-center gap-1">
              {/* Payment source badge */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 whitespace-nowrap ${source.className}`}>
                {source.icon}
                {source.label}
              </span>
              {/* Order status badge */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${status.className}`}>
                {status.label}
              </span>
            </div>
            <span className="text-xs font-bold text-green-600 whitespace-nowrap">{formatCurrency(customer.paid_amount)}</span>
          </div>
        </div>
      </AccordionTrigger>

      {/* ── Content ── */}
      <AccordionContent>
        <div className="px-3 pb-4 space-y-3">

          {/* Top bar: order number + date */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 bg-muted/50 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-bold text-foreground">
                No. Tempahan {customer.order_number ? customer.order_number.toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{formatDate(customer.order_date)}</span>
              {customer.order_time && (
                <>
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{customer.order_time} ({getTimePeriod(customer.order_time)})</span>
                </>
              )}
            </div>
          </div>

          {/* Payment Status Banners */}
          <div className="flex flex-col gap-2">
            {/* Billplz payment status */}
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${payment.className}`}>
              {payment.icon}
              <span className="text-xs font-semibold">
                Status Bayaran BillPlz:&nbsp;
                <span className="font-bold">{payment.label}</span>
              </span>
            </div>

            {/* Payment source banner */}
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${source.className}`}>
              {source.icon}
              <span className="text-xs font-semibold">
                Sumber Bayaran:&nbsp;
                <span className="font-bold">{source.label === "WhatsApp" ? "WhatsApp (Manual)" : "BillPlz (Online)"}</span>
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Maklumat Pembeli */}
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Maklumat Pembeli</p>
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Telefon" value={customer.phone || "—"} />
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={
                customer.email?.includes("@noemail") ? "—" : (customer.email || "—")
              } />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Lokasi" value={location} />
              {customer.address && (
                <InfoRow icon={<MapPin className="h-3.5 w-3.5 opacity-0" />} label="" value={customer.address} small />
              )}
            </div>

            {/* Maklumat Produk */}
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Maklumat Produk</p>
              <InfoRow icon={<Car className="h-3.5 w-3.5" />} label="Model Kereta" value={customer.car_model || "—"} />
              <InfoRow icon={<Package className="h-3.5 w-3.5" />} label="Produk" value={customer.product || "—"} />
              {customer.product_variation && (
                <InfoRow icon={<Package className="h-3.5 w-3.5 opacity-0" />} label="Saiz" value={customer.product_variation} />
              )}
            </div>
          </div>

          {/* Kewangan */}
          <div className="grid grid-cols-3 gap-2">
            <FinanceCard label="Harga" value={formatCurrency(customer.sales_amount)} />
            <FinanceCard label="Dibayar" value={formatCurrency(customer.paid_amount)} highlight />
            <FinanceCard
              label="Untung"
              value={formatCurrency(customer.gross_profit)}
              negative={customer.gross_profit < 0}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs justify-center"
              onClick={() => navigate(`/customers/receipt?id=${customer.id}`)}
            >
              <Receipt className="h-3.5 w-3.5 mr-1" /> Resit
            </Button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs justify-center w-full border-green-500/40 text-green-600 hover:bg-green-500/10 hover:text-green-600"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs justify-center"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Status
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs justify-center"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Padam
            </Button>
          </div>

          {/* BillPlz Pending Follow-up Button */}
          {isBillplzPending && waFollowupLink && (
            <a href={waFollowupLink} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs justify-center border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700 gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Peringatan Bayaran BillPlz (Pending)
              </Button>
            </a>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ── Sub-components ── */

function InfoRow({
  icon, label, value, small,
}: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        {label && <span className="text-xs text-muted-foreground">{label}: </span>}
        <span className={`${small ? "text-xs text-muted-foreground" : "text-sm font-medium"} break-words`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function FinanceCard({
  label, value, highlight, negative,
}: { label: string; value: string; highlight?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 border p-2.5 text-center">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xs font-bold ${highlight ? "text-green-600" : negative ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
