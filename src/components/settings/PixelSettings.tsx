import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle, Check } from "lucide-react";

type Row = {
  id: string;
  meta_pixel_id: string;
  meta_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_enabled: boolean;
  gtm_id: string;
  gtm_enabled: boolean;
  ga4_id: string;
  ga4_enabled: boolean;
};

const BLANK: Omit<Row, "id"> = {
  meta_pixel_id: "",
  meta_enabled: false,
  tiktok_pixel_id: "",
  tiktok_enabled: false,
  gtm_id: "",
  gtm_enabled: false,
  ga4_id: "",
  ga4_enabled: false,
};

export function PixelSettings() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Row, "id">>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (authClient as any)
        .from("pixel_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setRowId(data.id);
        setForm({
          meta_pixel_id: data.meta_pixel_id || "",
          meta_enabled: !!data.meta_enabled,
          tiktok_pixel_id: data.tiktok_pixel_id || "",
          tiktok_enabled: !!data.tiktok_enabled,
          gtm_id: data.gtm_id || "",
          gtm_enabled: !!data.gtm_enabled,
          ga4_id: data.ga4_id || "",
          ga4_enabled: !!data.ga4_enabled,
        });
      }
      setLoading(false);
    })();
  }, [authClient]);

  const set = (patch: Partial<Omit<Row, "id">>) => setForm((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true);
    const payload = { ...form };
    const q = rowId
      ? (authClient as any).from("pixel_settings").update(payload).eq("id", rowId)
      : (authClient as any).from("pixel_settings").insert(payload).select().single();
    const { data, error } = await q;
    setSaving(false);
    if (error) {
      toast({ title: "Gagal simpan pixel", description: error.message, variant: "destructive" });
      return;
    }
    if (!rowId && data?.id) setRowId(data.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Tetapan pixel disimpan", description: "Refresh landing page untuk lihat kesan." });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const block = (
    title: string,
    hint: string,
    idValue: string,
    onId: (v: string) => void,
    enabled: boolean,
    onEnabled: (v: boolean) => void,
    placeholder: string
  ) => (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabled} />
      </div>
      <Input
        value={idValue}
        onChange={(e) => onId(e.target.value)}
        placeholder={placeholder}
        className="h-9 font-mono text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Pixel dipasang di website awam sahaja</p>
        <p>
          Base code akan load di landing page, page order setiap material, dan testimoni (bukan dalam CRM).
          Event yang dihantar: <span className="font-mono">PageView</span>,{" "}
          <span className="font-mono">ViewContent</span> (setiap material),{" "}
          <span className="font-mono">InitiateCheckout</span> (bayar via gateway), dan{" "}
          <span className="font-mono">Lead</span> (order via WhatsApp).
        </p>
      </div>

      {block(
        "Meta Pixel",
        "Meta Events Manager › Data Sources › Pixel ID",
        form.meta_pixel_id,
        (v) => set({ meta_pixel_id: v }),
        form.meta_enabled,
        (v) => set({ meta_enabled: v }),
        "1234567890123456"
      )}

      {block(
        "TikTok Pixel",
        "TikTok Ads Manager › Assets › Events › Pixel ID",
        form.tiktok_pixel_id,
        (v) => set({ tiktok_pixel_id: v }),
        form.tiktok_enabled,
        (v) => set({ tiktok_enabled: v }),
        "CXXXXXXXXXXXXXXXXXXX"
      )}

      {block(
        "Google Tag Manager",
        "Google Tag Manager › Container ID",
        form.gtm_id,
        (v) => set({ gtm_id: v }),
        form.gtm_enabled,
        (v) => set({ gtm_enabled: v }),
        "GTM-XXXXXXX"
      )}

      {block(
        "Google Analytics 4 (Google Tag)",
        "GA4 › Admin › Data Streams › Measurement ID",
        form.ga4_id,
        (v) => set({ ga4_id: v }),
        form.ga4_enabled,
        (v) => set({ ga4_enabled: v }),
        "G-XXXXXXXXXX"
      )}

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? (
          <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
        ) : saved ? (
          <Check className="h-4 w-4 mr-2" />
        ) : null}
        Simpan Tetapan Pixel
      </Button>
    </div>
  );
}
