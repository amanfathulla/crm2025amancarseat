import { useEffect, useState } from "react";
import { TrendingUp, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdsRow {
  id: string;
  spend_date: string;
  platform: string;
  amount: number;
  notes: string | null;
}

const PLATFORMS = ["facebook", "tiktok", "google", "instagram", "lain-lain"];

export function AdsRoasCard() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<AdsRow[]>([]);
  const [salesByDate, setSalesByDate] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    spend_date: new Date().toISOString().slice(0, 10),
    platform: "facebook",
    amount: "",
    notes: "",
  });

  const load = async () => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);

    const [adsRes, salesRes] = await Promise.all([
      authClient.from("ads_spend" as any).select("*").gte("spend_date", sinceStr).order("spend_date", { ascending: false }),
      authClient.from("customers").select("sales_amount, order_date").gte("order_date", sinceStr),
    ]);

    setRows((adsRes.data || []) as any);
    const map: Record<string, number> = {};
    (salesRes.data || []).forEach((r: any) => {
      const d = r.order_date ? String(r.order_date).slice(0, 10) : null;
      if (d) map[d] = (map[d] || 0) + (Number(r.sales_amount) || 0);
    });
    setSalesByDate(map);
  };

  useEffect(() => { load(); }, [authClient]);

  const handleSave = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      toast({ title: "Jumlah tidak sah", variant: "destructive" });
      return;
    }
    const { error } = await authClient.from("ads_spend" as any).insert({
      spend_date: form.spend_date,
      platform: form.platform,
      amount: amt,
      notes: form.notes || null,
    } as any);
    if (error) {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Iklan disimpan" });
    setOpen(false);
    setForm({ spend_date: new Date().toISOString().slice(0, 10), platform: "facebook", amount: "", notes: "" });
    load();
  };

  const handleDelete = async (id: string) => {
    await authClient.from("ads_spend" as any).delete().eq("id", id);
    load();
  };

  // Aggregate by date
  const byDate: Record<string, number> = {};
  rows.forEach((r) => {
    byDate[r.spend_date] = (byDate[r.spend_date] || 0) + Number(r.amount);
  });
  const totalSpend = Object.values(byDate).reduce((a, b) => a + b, 0);
  const totalSales = Object.keys(byDate).reduce((s, d) => s + (salesByDate[d] || 0), 0);
  const overallRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Iklan & ROAS Harian</h3>
            <p className="text-xs text-muted-foreground">30 hari terakhir</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader><DialogTitle>Tambah Belanja Iklan</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Tarikh</Label>
                <Input type="date" value={form.spend_date} onChange={(e) => setForm({ ...form, spend_date: e.target.value })} />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah Belanja (RM)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50.00" />
              </div>
              <div>
                <Label>Nota (pilihan)</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Belanja</p>
          <p className="text-base font-bold text-foreground">RM{totalSpend.toFixed(0)}</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Jualan</p>
          <p className="text-base font-bold text-foreground">RM{totalSales.toFixed(0)}</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
          <p className="text-[10px] text-emerald-700 uppercase font-semibold">ROAS</p>
          <p className="text-base font-bold text-emerald-700">{overallRoas.toFixed(2)}x</p>
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Tiada rekod iklan. Tekan Tambah untuk masukkan belanja harian.</p>
        )}
        {rows.map((r) => {
          const sales = salesByDate[r.spend_date] || 0;
          const roas = r.amount > 0 ? sales / Number(r.amount) : 0;
          return (
            <div key={r.id} className="flex items-center justify-between text-xs border-b py-2">
              <div className="flex-1">
                <p className="font-medium text-foreground">{r.spend_date} <span className="capitalize text-muted-foreground">· {r.platform}</span></p>
                <p className="text-muted-foreground">Belanja RM{Number(r.amount).toFixed(2)} · Jualan RM{sales.toFixed(2)}</p>
              </div>
              <div className="text-right mr-2">
                <p className={`font-bold ${roas >= 1 ? "text-emerald-600" : "text-rose-600"}`}>{roas.toFixed(2)}x</p>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
