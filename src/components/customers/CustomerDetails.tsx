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

const statusConfig: Record<string, { label: string; className: string; bgRow: string }> = {
  processing: { label: "In Process", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", bgRow: "bg-yellow-50 dark:bg-yellow-500/5" },
  completed:  { label: "Completed",  className: "bg-green-500/15 text-green-600 border-green-500/30", bgRow: "bg-green-50 dark:bg-green-500/5" },
  cancelled:  { label: "Cancelled",  className: "bg-red-500/15 text-red-500 border-red-500/30", bgRow: "bg-red-50 dark:bg-red-500/5" },
};

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

  const status = statusConfig[customer.order_status] ?? { label: customer.order_status, className: "bg-muted text-muted-foreground", bgRow: "bg-muted/30" };
  const source = sourceConfig[(customer.payment_source as keyof typeof sourceConfig) ?? "billplz"] ?? sourceConfig.billplz;

  const location = [customer.city, customer.state].filter(Boolean).join(", ") || customer.location || "—";
  const isBillplzPending = (!customer.payment_source || customer.payment_source === "billplz") && customer.order_status === "processing";

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

  const showEmail = customer.email && !customer.email.includes("@noemail") && !customer.email.includes("@temp.local");

  return (
    <AccordionItem value={customer.id} className={`border-b ${className || ""}`}>
      {/* ── Trigger ── */}
      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-3 [&>svg]:shrink-0">
        <div className="flex items-center gap-2 w-full min-w-0 pr-1">
          <div className="shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-[9px] text-primary/60 font-medium leading-none">No.</span>
            <span className="text-xs font-bold text-primary leading-tight">
              {customer.order_number ? customer.order_number.toLocaleString() : index}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left overflow-hidden">
            <p className="font-semibold text-foreground text-sm truncate leading-tight">{customer.name}</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">{customer.phone || "—"}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1 ml-1 min-w-[90px]">
            <div className="flex items-center gap-1">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 whitespace-nowrap ${source.className}`}>
                {source.icon} {source.label}
              </span>
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

          {/* Status Banner */}
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between ${status.bgRow}`}>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold">No. Tempahan {customer.order_number ? customer.order_number.toLocaleString() : "—"}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${status.className}`}>
              {status.label}
            </span>
          </div>

          {/* ── Detail Table: Maklumat Pesanan ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="bg-primary/10 px-4 py-2">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">📋 Maklumat Pesanan</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <DetailTableRow label="Tarikh" value={formatDate(customer.order_date)} icon={<Calendar className="h-3.5 w-3.5" />} />
                {customer.order_time && (
                  <DetailTableRow label="Masa" value={`${customer.order_time} (${getTimePeriod(customer.order_time)})`} icon={<Clock className="h-3.5 w-3.5" />} odd />
                )}
                <DetailTableRow label="Sumber Bayaran" odd={!customer.order_time}>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${source.className}`}>
                    {source.icon} {source.label === "WhatsApp" ? "WhatsApp (Manual)" : "BillPlz (Online)"}
                  </span>
                </DetailTableRow>
              </tbody>
            </table>
          </div>

          {/* ── Detail Table: Maklumat Pembeli ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="bg-blue-500/10 px-4 py-2">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">👤 Maklumat Pembeli</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <DetailTableRow label="Nama" value={customer.name} icon={<Hash className="h-3.5 w-3.5" />} />
                <DetailTableRow label="Telefon" value={customer.phone || "—"} icon={<Phone className="h-3.5 w-3.5" />} odd />
                {showEmail && <DetailTableRow label="Emel" value={customer.email} icon={<Mail className="h-3.5 w-3.5" />} />}
                <DetailTableRow label="Lokasi" value={location} icon={<MapPin className="h-3.5 w-3.5" />} odd={!!showEmail} />
                {customer.address && (
                  <DetailTableRow label="Alamat Penuh" value={customer.address} icon={<MapPin className="h-3.5 w-3.5 opacity-50" />} odd={!showEmail} />
                )}
              </tbody>
            </table>
          </div>

          {/* ── Detail Table: Maklumat Produk ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="bg-amber-500/10 px-4 py-2">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">📦 Maklumat Produk</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <DetailTableRow label="Produk" value={customer.product || "—"} icon={<Package className="h-3.5 w-3.5" />} />
                {customer.product_variation && (
                  <DetailTableRow label="Variasi/Saiz" value={customer.product_variation} icon={<Package className="h-3.5 w-3.5 opacity-50" />} odd />
                )}
                <DetailTableRow label="Model Kereta" value={customer.car_model || "—"} icon={<Car className="h-3.5 w-3.5" />} odd={!customer.product_variation} />
              </tbody>
            </table>
          </div>

          {/* ── Kewangan ── */}
          <div className="rounded-xl border overflow-hidden">
            <div className="bg-green-500/10 px-4 py-2">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider">💰 Kewangan</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium w-[40%]">Harga Jualan</td>
                  <td className="px-4 py-2.5 font-semibold">{formatCurrency(customer.sales_amount)}</td>
                </tr>
                <tr className="border-b border-border/50 bg-green-50 dark:bg-green-500/5">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">Jumlah Dibayar</td>
                  <td className="px-4 py-2.5 font-bold text-green-600">{formatCurrency(customer.paid_amount)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">Untung Kasar</td>
                  <td className={`px-4 py-2.5 font-bold ${customer.gross_profit < 0 ? "text-destructive" : "text-foreground"}`}>
                    {formatCurrency(customer.gross_profit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="default"
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

          {/* BillPlz Pending Follow-up */}
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

function DetailTableRow({
  label,
  value,
  icon,
  odd,
  children,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  odd?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <tr className={`border-b border-border/50 last:border-b-0 ${odd ? "bg-muted/30" : ""}`}>
      <td className="px-4 py-2.5 w-[40%]">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="text-xs font-medium">{label}</span>
        </div>
      </td>
      <td className="px-4 py-2.5 font-medium text-foreground">
        {children || value || "—"}
      </td>
    </tr>
  );
}
