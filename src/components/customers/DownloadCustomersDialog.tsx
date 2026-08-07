
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format as formatDate } from "date-fns";

interface DownloadCustomersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  { value: "all", label: "Semua Bulan" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Mac" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Julai" },
  { value: "8", label: "Ogos" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Disember" },
];

const HEADERS = [
  "Bil",
  "No. Tempahan",
  "Tarikh Order",
  "Nama",
  "No. Telefon",
  "Email",
  "Alamat Penuh",
  "Bandar",
  "Negeri",
  "Poskod",
  "Model Kereta",
  "Produk",
  "Variasi Produk",
  "Kupon",
  "Status Order",
  "Jenis Bayaran",
  "Jumlah Pesanan",
  "Jumlah Jualan (RM)",
  "Jumlah Kos (RM)",
  "Jumlah Untung (RM)",
] as const;

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return isNaN(n) ? 0 : n;
};
const money = (n: number) => n.toFixed(2);
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function DownloadCustomersDialog({ isOpen, onClose }: DownloadCustomersDialogProps) {
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [fileFormat, setFileFormat] = useState<"csv" | "excel">("excel");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { authClient } = useAuth();

  const triggerDownload = (content: string, mime: string, filename: string) => {
    const blob = new Blob(["\ufeff" + content], { type: mime });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  };

  const downloadData = async () => {
    setIsLoading(true);
    try {
      let query = authClient
        .from("customers")
        .select(
          "order_number, name, phone, email, address, city, state, zip_code, car_model, product, product_variation, coupon_code, order_status, payment_type, total_orders, sales_amount, paid_amount, gross_profit, order_date, created_at"
        )
        .order("created_at", { ascending: true })
        .limit(5000);

      if (selectedMonth !== "all") {
        const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
        const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);
        query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString());
      } else if (selectedYear) {
        const startDate = new Date(parseInt(selectedYear), 0, 1);
        const endDate = new Date(parseInt(selectedYear), 11, 31, 23, 59, 59);
        query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Tiada Data",
          description: "Tiada data pelanggan untuk tempoh yang dipilih.",
          variant: "destructive",
        });
        return;
      }

      let totalSales = 0;
      let totalCost = 0;
      let totalProfit = 0;

      const rows = data.map((c: Record<string, unknown>, idx) => {
        const sales = num(c.sales_amount) || num(c.paid_amount);
        const profit = num(c.gross_profit);
        const cost = Math.max(sales - profit, 0);
        totalSales += sales;
        totalCost += cost;
        totalProfit += profit;

        const orderDate = (c.order_date as string) || (c.created_at as string);

        return [
          String(idx + 1),
          c.order_number ? String(c.order_number) : "-",
          orderDate ? formatDate(new Date(orderDate), "dd/MM/yyyy") : "-",
          (c.name as string) || "-",
          c.phone ? `'${c.phone}` : "-",
          (c.email as string) || "-",
          (c.address as string) || "-",
          (c.city as string) || "-",
          (c.state as string) || (c.city as string) || "-",
          (c.zip_code as string) || "-",
          (c.car_model as string) || "-",
          (c.product as string) || "-",
          (c.product_variation as string) || "-",
          (c.coupon_code as string) || "-",
          (c.order_status as string) || "-",
          (c.payment_type as string) || "-",
          String(c.total_orders != null && num(c.total_orders) > 0 ? num(c.total_orders) : 1),
          money(sales),
          money(cost),
          money(profit),
        ];
      });

      const periodLabel =
        selectedMonth === "all"
          ? `Tahun ${selectedYear}`
          : `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`;
      const fileBase = `pelanggan_${selectedYear}_${selectedMonth !== "all" ? selectedMonth : "semua"}`;

      if (fileFormat === "csv") {
        const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const lines = [
          [`Senarai Pelanggan - ${periodLabel}`].map(q).join(","),
          "",
          HEADERS.map(q).join(","),
          ...rows.map((r) => r.map(q).join(",")),
          "",
          [q("JUMLAH JUALAN (RM)"), q(money(totalSales))].join(","),
          [q("JUMLAH KOS (RM)"), q(money(totalCost))].join(","),
          [q("JUMLAH PROFIT (RM)"), q(money(totalProfit))].join(","),
        ];
        triggerDownload(lines.join("\n"), "text/csv;charset=utf-8;", `${fileBase}.csv`);
      } else {
        const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" />
<style>
  table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt; }
  td, th { border: 1px solid #999; padding: 4px 8px; mso-number-format:"\\@"; }
  th { background: #1e3a5f; color: #ffffff; font-weight: bold; }
  .title { font-size: 16pt; font-weight: bold; }
  .num { mso-number-format:"0\\.00"; text-align: right; }
  .totlabel { font-size: 16pt; font-weight: bold; color: #FF0000; background: #FFF3F3; }
  .totval { font-size: 16pt; font-weight: bold; color: #FF0000; background: #FFF3F3; mso-number-format:"0\\.00"; text-align: right; }
</style></head><body>
<table>
  <tr><td class="title" colspan="${HEADERS.length}">Senarai Pelanggan - ${esc(periodLabel)}</td></tr>
  <tr><td colspan="${HEADERS.length}"></td></tr>
  <tr>${HEADERS.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
  ${rows
    .map(
      (r) =>
        `<tr>${r
          .map((cell, i) => `<td class="${i >= 17 ? "num" : ""}">${esc(i === 4 ? String(cell).replace(/^'/, "") : cell)}</td>`)
          .join("")}</tr>`
    )
    .join("")}
  <tr><td colspan="${HEADERS.length}"></td></tr>
  <tr><td class="totlabel" colspan="17">JUMLAH JUALAN (RM)</td><td class="totval" colspan="3">${money(totalSales)}</td></tr>
  <tr><td class="totlabel" colspan="17">JUMLAH KOS (RM)</td><td class="totval" colspan="3">${money(totalCost)}</td></tr>
  <tr><td class="totlabel" colspan="17">JUMLAH PROFIT (RM)</td><td class="totval" colspan="3">${money(totalProfit)}</td></tr>
</table>
</body></html>`;
        triggerDownload(html, "application/vnd.ms-excel;charset=utf-8;", `${fileBase}.xls`);
      }

      toast({
        title: "Muat Turun Selesai",
        description: `${rows.length} rekod • Jualan RM${money(totalSales)} • Profit RM${money(totalProfit)}`,
      });
      onClose();
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Ralat",
        description: "Gagal memuat turun data pelanggan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Muat Turun Senarai Pelanggan</DialogTitle>
          <DialogDescription>
            Pilih tempoh masa dan format fail. Jumlah Jualan, Kos dan Profit dikira automatik di bawah senarai.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Tahun</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Bulan</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm">Format</label>
            <Select value={fileFormat} onValueChange={(value: "csv" | "excel") => setFileFormat(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih format fail" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xls)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={downloadData} disabled={isLoading}>
            <FileDown className="mr-2 h-4 w-4" />
            {isLoading ? "Memuat turun..." : "Muat Turun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
