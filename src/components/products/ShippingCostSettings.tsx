import { useEffect, useState } from "react";
import { Truck, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ShippingRow {
  id: string;
  semenanjung_cost: number;
  sabah_sarawak_cost: number;
  is_enabled: boolean;
}

export default function ShippingCostSettings() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<ShippingRow | null>(null);
  const [semenanjung, setSemenanjung] = useState("10");
  const [sabahSarawak, setSabahSarawak] = useState("20");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shipping_settings" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        const r = data as any as ShippingRow;
        setRow(r);
        setSemenanjung(String(r.semenanjung_cost));
        setSabahSarawak(String(r.sabah_sarawak_cost));
        setEnabled(r.is_enabled);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        semenanjung_cost: Number(semenanjung) || 0,
        sabah_sarawak_cost: Number(sabahSarawak) || 0,
        is_enabled: enabled,
      };
      let res;
      if (row?.id) {
        res = await authClient.from("shipping_settings" as any).update(payload).eq("id", row.id);
      } else {
        res = await authClient.from("shipping_settings" as any).insert(payload);
      }
      if (res.error) throw res.error;
      toast({ title: "✅ Disimpan", description: "Kos penghantaran telah dikemaskini" });
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
          <Truck className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base">Setting Kos Penghantaran</h3>
          <p className="text-sm text-muted-foreground">
            Kos akan auto-dipilih ikut negeri pelanggan di halaman tempahan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{enabled ? "Aktif" : "Off"}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} disabled={loading} />
        </div>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Semenanjung Malaysia (RM)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={semenanjung}
                onChange={(e) => setSemenanjung(e.target.value)}
                placeholder="10.00"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Sabah / Sarawak / Labuan (RM)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={sabahSarawak}
                onChange={(e) => setSabahSarawak(e.target.value)}
                placeholder="20.00"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Kos Penghantaran
          </Button>
        </>
      )}
    </div>
  );
}
