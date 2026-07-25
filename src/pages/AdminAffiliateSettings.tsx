import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Loader2, Save } from "lucide-react";

export default function AdminAffiliateSettings() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [freezeMonths, setFreezeMonths] = useState(3);
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await authClient.from("affiliate_settings").select("*").limit(1).single();
      if (data) {
        setFreezeMonths(data.freeze_months ?? 3);
        setCustomDate(data.custom_freeze_date ? data.custom_freeze_date.slice(0, 10) : "");
      }
      setLoading(false);
    })();
  }, [authClient]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await authClient
        .from("affiliate_settings")
        .update({
          freeze_months: freezeMonths,
          custom_freeze_date: customDate ? new Date(customDate).toISOString() : null,
        })
        .eq("id", 1);
      if (error) throw error;
      toast({ title: "Tetapan disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal simpan", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="grid size-10 place-content-center rounded-lg bg-blue-600/20 shadow-md">
            <SettingsIcon className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Affiliate Settings</h1>
            <p className="text-muted-foreground text-sm">Tetapan pembekuan akaun affiliate</p>
          </div>
        </div>
      </section>

      <div className="max-w-md space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Pembekuan (bulan)</Label>
          <Input
            type="number"
            min={0}
            value={freezeMonths}
            onChange={(e) => setFreezeMonths(Number(e.target.value) || 0)}
            className="bg-slate-800 border-white/10 text-white"
          />
          <p className="text-xs text-muted-foreground">
            Akaun affiliate dibekukan selepas tempoh ini tanpa jualan.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Tarikh Pembekuan Khas (pilihan)</Label>
          <Input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="bg-slate-800 border-white/10 text-white"
          />
          <p className="text-xs text-muted-foreground">
            Jika diisi, digunakan sebagai tarikh pembekuan tetap (batal tempoh bulan).
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan</>}
        </Button>
      </div>
    </div>
  );
}
