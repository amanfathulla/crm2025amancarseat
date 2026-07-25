import { useEffect, useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";

export default function AffiliateProfile() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
    c.from("affiliates")
      .select("*")
      .eq("affiliate_id", localStorage.getItem(AFF_ID)!)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setPhone(data.phone || "");
          setWhatsapp(data.whatsapp || "");
          setEmail(data.email || "");
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
      const { error } = await c
        .from("affiliates")
        .update({ name, phone, whatsapp, email: email || null })
        .eq("affiliate_id", localStorage.getItem(AFF_ID)!);
      if (error) throw error;
      localStorage.setItem("affiliateName", name);
      toast({ title: "Profil disimpan" });
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400 text-sm">Memuatkan...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm text-slate-400">Kemaskini maklumat anda</p>
      </div>

      <div className="max-w-md space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-800 border-white/10 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">No Telefon</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-slate-800 border-white/10 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">WhatsApp</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-slate-800 border-white/10 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-800 border-white/10 text-white" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : <><User className="mr-2 h-4 w-4" />Simpan</>}
        </Button>
      </div>
    </div>
  );
}
