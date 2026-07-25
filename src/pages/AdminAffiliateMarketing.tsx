import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Copy, Check, Loader2, Save } from "lucide-react";

const SITE = "https://www.amancarseat.com/";

export default function AdminAffiliateMarketing() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const sampleLink = `${SITE}order?ref=REFERRAL_CODE`;

  useEffect(() => {
    (async () => {
      const { data } = await authClient.from("affiliate_settings").select("*").limit(1).single();
      if (data) setNote((data as any).marketing_note || "");
      setLoading(false);
    })();
  }, [authClient]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sampleLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await authClient
        .from("affiliate_settings")
        .update({ marketing_note: note })
        .eq("id", 1);
      if (error) throw error;
      toast({ title: "Nota disimpan" });
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
            <Megaphone className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bahan Marketing</h1>
            <p className="text-muted-foreground text-sm">Template pautan & nota untuk affiliate</p>
          </div>
        </div>
      </section>

      <div className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="space-y-2">
          <p className="text-sm text-slate-300 font-medium">Pautan Rujukan (template)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-slate-800 border border-white/10 px-3 py-2 text-xs text-blue-300">
              {sampleLink}
            </code>
            <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
              {copied ? <><Check className="h-4 w-4 text-green-400" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ganti <b>REFERRAL_CODE</b> dengan kod rujukan affiliate masing-masing.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-300 font-medium">Nota / Panduan (akan dipaparkan ke affiliate)</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Kongsi di WhatsApp, IG & TikTok. Komisen dibayar selepas order sah..."
            className="min-h-[140px] bg-slate-800 border-white/10 text-white"
          />
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-500">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><Save className="mr-2 h-4 w-4" />Simpan Nota</>}
          </Button>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
          Upload banner/gambar akan ditambah di fasa seterusnya (perlu Supabase Storage).
        </div>
      </div>
    </div>
  );
}
