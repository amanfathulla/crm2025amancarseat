import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
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

export function CustomerDetails({ customer, onEdit, onDelete, index, className }: CustomerDetailsProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ms-MY", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const status = statusConfig[customer.order_status] ?? { label: customer.order_status, className: "bg-muted text-muted-foreground" };
  const orderNum = customer.order_number ? `#${customer.order_number.toLocaleString()}` : `#${index}`;

  const location = [customer.city, customer.state].filter(Boolean).join(", ") || customer.location || "—";

  return (
    <AccordionItem value={customer.id} className={`border-b ${className || ""}`}>
      {/* ── Trigger ── */}
      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-3">
        <div className="flex items-center gap-3 w-full min-w-0">
          {/* Order badge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-[10px] text-primary/60 font-medium leading-none">No.</span>
            <span className="text-sm font-bold text-primary leading-tight">
              {customer.order_number ? customer.order_number.toLocaleString() : index}
            </span>
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-foreground truncate">{customer.name}</p>
            <p className="text-xs text-muted-foreground truncate">{customer.product || "—"}</p>
          </div>

          {/* Right side */}
          <div className="shrink-0 flex flex-col items-end gap-1 mr-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.className}`}>
              {status.label}
            </span>
            <span className="text-xs font-bold text-green-600">{formatCurrency(customer.paid_amount)}</span>
          </div>
        </div>
      </AccordionTrigger>

      {/* ── Content ── */}
      <AccordionContent>
        <div className="px-3 pb-4 space-y-4">

          {/* Top bar: order number + date */}
          <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                No. Tempahan {customer.order_number ? customer.order_number.toLocaleString() : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(customer.order_date)}
              {customer.order_time && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  {customer.order_time} ({getTimePeriod(customer.order_time)})
                </>
              )}
            </div>
          </div>

          {/* Info Grid 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Maklumat Pembeli */}
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Maklumat Pembeli</p>
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Telefon" value={customer.phone || "—"} />
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={customer.email || "—"} />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Lokasi" value={location} />
              {customer.address && (
                <InfoRow icon={<MapPin className="h-3.5 w-3.5 opacity-0" />} label="" value={customer.address} small />
              )}
            </div>

            {/* Maklumat Produk */}
            <div className="rounded-xl border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Maklumat Produk</p>
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
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 sm:flex-none text-xs"
              onClick={() => navigate(`/customers/receipt?id=${customer.id}`)}
            >
              <Receipt className="h-3.5 w-3.5 mr-1" /> Resit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none text-xs"
              onClick={() => navigate(`/customers/invoice?id=${customer.id}`)}
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Invoice
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" className="text-xs" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Status
              </Button>
              <Button variant="destructive" size="sm" className="text-xs" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
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
      <div className="min-w-0">
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
    <div className="rounded-xl bg-muted/50 border p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-green-600" : negative ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
