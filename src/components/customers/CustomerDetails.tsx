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
  MapPin,
  Car,
  Package,
  Calendar,
  Pencil,
  Trash2,
  MessageCircle,
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

const statusConfig: Record<string, { label: string; className: string }> = {
  processing: { label: "In Process", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" },
  completed:  { label: "Completed",  className: "bg-green-500/15 text-green-600 border-green-500/30" },
  cancelled:  { label: "Cancelled",  className: "bg-red-500/15 text-red-500 border-red-500/30" },
};

const sourceConfig = {
  billplz: { label: "BillPlz", icon: <CreditCard className="h-2.5 w-2.5" />, className: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
  whatsapp: { label: "WhatsApp", icon: <MessageCircle className="h-2.5 w-2.5" />, className: "bg-green-500/15 text-green-600 border-green-500/30" },
};

export function CustomerDetails({ customer, onEdit, onDelete, index, className }: CustomerDetailsProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
  };

  const status = statusConfig[customer.order_status] ?? { label: customer.order_status, className: "bg-muted text-muted-foreground" };
  const source = sourceConfig[(customer.payment_source as keyof typeof sourceConfig) ?? "billplz"] ?? sourceConfig.billplz;
  const location = [customer.city, customer.state].filter(Boolean).join(", ") || customer.location || "—";
  const isBillplzPending = (!customer.payment_source || customer.payment_source === "billplz") && customer.order_status === "processing";

  const orderNum = customer.order_number ? `#${customer.order_number}` : `#${index}`;
  const waPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, "").replace(/^0/, "60") : "";

  const waMessage = encodeURIComponent(
    `Assalamualaikum, ini adalah makluman tempahan daripada *ACS Legacy AmancarseatCover* 🚗\n\n` +
    `📋 *No. Tempahan: ${orderNum}*\n👤 Nama: ${customer.name}\n📱 Telefon: ${customer.phone || "—"}\n🚗 Model Kereta: ${customer.car_model || "—"}\n` +
    `📦 Produk: ${customer.product || "—"}${customer.product_variation ? ` (${customer.product_variation})` : ""}\n📅 Tarikh: ${formatDate(customer.order_date)}\n` +
    `💰 Dibayar: RM ${Number(customer.paid_amount || 0).toFixed(2)}\n🔖 Status: ${status.label}\n\nTerima kasih kerana memilih ACS Legacy! 🙏`
  );

  const waFollowupMessage = encodeURIComponent(
    `Assalamualaikum ${customer.name} 😊\n\nIni peringatan mesra dari *ACS Legacy AmancarseatCover* 🚗\n\n` +
    `Kami perasan tempahan anda ${orderNum} masih belum selesai pembayaran melalui BillPlz.\n\n` +
    `📦 Produk: ${customer.product || "—"}${customer.product_variation ? ` (${customer.product_variation})` : ""}\n` +
    `💰 Jumlah: RM ${Number(customer.paid_amount || 0).toFixed(2)}\n\nJika ada sebarang masalah dengan pembayaran, boleh hubungi kami ya! 🙏\n` +
    `Atau bayar melalui:\n🏦 Maybank – ACS LEGACY\n🔢 553038596454`
  );

  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waMessage}` : null;
  const waFollowupLink = waPhone ? `https://wa.me/${waPhone}?text=${waFollowupMessage}` : null;

  return (
    <AccordionItem value={customer.id} className={`border-b ${className || ""}`}>
      {/* ── Trigger ── */}
      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-2.5 [&>svg]:shrink-0">
        <div className="flex items-center gap-2 w-full min-w-0 pr-1">
          <div className="shrink-0 flex flex-col items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[8px] text-primary/60 font-medium leading-none">No.</span>
            <span className="text-[11px] font-bold text-primary leading-tight">
              {customer.order_number ? customer.order_number.toLocaleString() : index}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left overflow-hidden">
            <p className="font-semibold text-foreground text-xs truncate leading-tight">{customer.name}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{customer.phone || "—"}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-0.5 ml-1 min-w-[80px]">
            <div className="flex items-center gap-1">
              <span className={`text-[8px] px-1 py-0.5 rounded-full border font-medium flex items-center gap-0.5 whitespace-nowrap ${source.className}`}>
                {source.icon} {source.label}
              </span>
              <span className={`text-[8px] px-1 py-0.5 rounded-full border font-medium whitespace-nowrap ${status.className}`}>
                {status.label}
              </span>
            </div>
            <span className="text-[11px] font-bold text-green-600 whitespace-nowrap">{formatCurrency(customer.paid_amount)}</span>
          </div>
        </div>
      </AccordionTrigger>

      {/* ── Compact Content ── */}
      <AccordionContent>
        <div className="px-3 pb-3 space-y-2">
          {/* Single compact info grid */}
          <div className="rounded-lg border overflow-hidden text-[11px]">
            <div className="grid grid-cols-[auto_1fr] divide-y divide-border/40">
              <InfoRow icon={<Calendar className="h-3 w-3" />} label="Tarikh" value={formatDate(customer.order_date)} />
              <InfoRow icon={<Package className="h-3 w-3" />} label="Produk" value={`${customer.product || "—"}${customer.product_variation ? ` · ${customer.product_variation}` : ""}`} />
              <InfoRow icon={<Car className="h-3 w-3" />} label="Kereta" value={customer.car_model || "—"} />
              <InfoRow icon={<MapPin className="h-3 w-3" />} label="Lokasi" value={location} />
              <InfoRow icon={<Phone className="h-3 w-3" />} label="Telefon" value={customer.phone || "—"} />
            </div>
            {/* Finance row */}
            <div className="border-t border-border/40 bg-muted/20 px-3 py-1.5 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">💰 Jualan: <span className="font-semibold text-foreground">{formatCurrency(customer.sales_amount)}</span></span>
              <span className="text-muted-foreground">Bayar: <span className="font-bold text-green-600">{formatCurrency(customer.paid_amount)}</span></span>
              <span className="text-muted-foreground">Untung: <span className={`font-bold ${customer.gross_profit < 0 ? "text-destructive" : "text-foreground"}`}>{formatCurrency(customer.gross_profit)}</span></span>
            </div>
          </div>

          {/* Compact action buttons */}
          <div className="flex flex-wrap gap-1.5">
            <Button variant="default" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => navigate(`/customers/receipt?id=${customer.id}`)}>
              <Receipt className="h-3 w-3 mr-1" /> Resit
            </Button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 border-green-500/40 text-green-600 hover:bg-green-500/10">
                  <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button variant="destructive" size="sm" className="h-7 text-[11px] px-2.5" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Padam
            </Button>
            {isBillplzPending && waFollowupLink && (
              <a href={waFollowupLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10">
                  <MessageCircle className="h-3 w-3 mr-1" /> Peringatan Bayaran
                </Button>
              </a>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <>
      <div className="px-2.5 py-1.5 bg-muted/30 flex items-center gap-1.5 text-muted-foreground border-r border-border/40">
        {icon}<span className="font-medium">{label}</span>
      </div>
      <div className="px-2.5 py-1.5 font-medium text-foreground truncate">{value}</div>
    </>
  );
}
