
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

export function DownloadCustomersDialog({ isOpen, onClose }: DownloadCustomersDialogProps) {
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [fileFormat, setFileFormat] = useState<"csv" | "excel">("csv");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const downloadData = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("name, phone, email, created_at, total_orders, city");

      // Apply date filters
      if (selectedMonth !== "all") {
        const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
        const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
        
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      } else if (selectedYear) {
        const startDate = new Date(parseInt(selectedYear), 0, 1);
        const endDate = new Date(parseInt(selectedYear), 11, 31);
        
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
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

      // Format data for export - ensure phone numbers are properly formatted
      const formattedData = data.map(customer => ({
        "Nama": customer.name,
        "No. Telefon": `'${customer.phone}`, // Add leading apostrophe to preserve leading zeros
        "Email": customer.email,
        "Tarikh Daftar": formatDate(new Date(customer.created_at), "dd/MM/yyyy"),
        "Jumlah Pesanan": customer.total_orders,
        "Negeri": customer.city
      }));

      // Convert to CSV/Excel format
      if (fileFormat === "csv") {
        const headers = Object.keys(formattedData[0]);
        const csv = [
          headers.join(","),
          ...formattedData.map(row => headers.map(header => {
            // Ensure all cells are properly quoted to preserve formatting
            return `"${row[header]}"`;
          }).join(","))
        ].join("\n");

        // Create and download file
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `pelanggan_${selectedYear}_${selectedMonth !== "all" ? selectedMonth : "semua"}.csv`;
        link.click();
      } else {
        // For Excel, we'll use CSV with tab separator and special formatting for numbers
        const headers = Object.keys(formattedData[0]);
        const csv = [
          headers.join("\t"),
          ...formattedData.map(row => headers.map(header => {
            // Ensure all cells are properly quoted to preserve formatting
            return `"${row[header]}"`;
          }).join("\t"))
        ].join("\n");

        const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `pelanggan_${selectedYear}_${selectedMonth !== "all" ? selectedMonth : "semua"}.xls`;
        link.click();
      }

      toast({
        title: "Muat Turun Selesai",
        description: "Fail telah berjaya dimuat turun.",
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
            Pilih tempoh masa dan format fail untuk muat turun data pelanggan.
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
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
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
