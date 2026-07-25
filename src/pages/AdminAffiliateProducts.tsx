import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Loader2, Save } from "lucide-react";

type Prod = {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  affiliate_commission: number | null;
};

export default function AdminAffiliateProducts() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await authClient
      .from("products")
      .select("id,name,price,cost,affiliate_commission")
      .order("name");
    if (!error) setList((data as Prod[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [authClient]);

  const setVal = (id: string, v: string) => {
    setList((l) => l.map((p) => (p.id === id ? { ...p, affiliate_commission: Number(v) || 0 } : p)));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const p of list) {
        const { error } = await authClient
          .from("products")
          .update({ affiliate_commission: p.affiliate_commission ?? 0 })
          .eq("id", p.id);
        if (error) throw error;
      }
      toast({ title: "Komisen disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal simpan", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="grid size-10 place-content-center rounded-lg bg-blue-600/20 shadow-md">
            <Package className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Komisen Produk</h1>
            <p className="text-muted-foreground text-sm">Tetapkan komisen affiliate (RM) per produk</p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-xs text-muted-foreground border-b border-white/10">
            <span>Produk</span>
            <span className="w-24 text-right">Harga</span>
            <span className="w-32 text-right">Komisen (RM)</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-auto">
            {list.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Kos: RM{(p.cost ?? 0).toFixed(2)} · Untung: RM{((p.price) - (p.cost ?? 0)).toFixed(2)}
                  </p>
                </div>
                <span className="w-24 text-right text-sm text-muted-foreground">RM{p.price.toFixed(2)}</span>
                <div className="w-32 flex justify-end">
                  <Input
                    type="number"
                    value={p.affiliate_commission ?? 0}
                    onChange={(e) => setVal(p.id, e.target.value)}
                    className="w-24 h-8 bg-slate-800 border-white/10 text-white text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-500">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan Komisen</>}
        </Button>
      </div>
    </div>
  );
}
