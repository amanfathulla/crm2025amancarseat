import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

// Build a referral code from a name: uppercase, A-Z only, 4-20 chars.
const slugifyName = (name: string) =>
  name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 20) || "AFFILIATE";

// Find a unique referral code by appending 01, 02, ... if taken.
const uniqueReferralCode = async (base: string): Promise<string> => {
  const root = base.length >= 4 ? base : base.padEnd(4, "X");
  const { data } = await supabase
    .from("affiliates")
    .select("referral_code")
    .like("referral_code", `${root}%`)
    .order("referral_code", { ascending: true });
  const taken = new Set((data || []).map((r: any) => r.referral_code as string));
  if (!taken.has(root)) return root;
  let i = 1;
  let candidate = "";
  do {
    candidate = `${root}${String(i).padStart(2, "0")}`;
    i++;
  } while (taken.has(candidate) && i < 999);
  return candidate;
};

// Generate next affiliate_id: AFF00001, AFF00002, ...
const nextAffiliateId = async (): Promise<string> => {
  const { data } = await supabase
    .from("affiliates")
    .select("affiliate_id")
    .order("affiliate_id", { ascending: false })
    .limit(1);
  const last = (data || [])[0]?.affiliate_id as string | undefined;
  let n = 1;
  if (last && /^AFF(\d+)$/.test(last)) {
    n = parseInt(last.replace("AFF", ""), 10) + 1;
  }
  return `AFF${String(n).padStart(5, "0")}`;
};

export default function AffiliateRegister() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || password.length < 6) {
      toast({
        title: "Maklumat tidak lengkap",
        description: "Sila isi nama, no telefon dan password (min 6 aksara).",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const finalEmail =
        email.trim() ||
        `${phone.replace(/[^0-9]/g, "")}@amancarseat.app`;
      const referralCode = await uniqueReferralCode(slugifyName(name));
      const affiliateId = await nextAffiliateId();

      // 1. Create auth user (password hashed server-side by Supabase)
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: { data: { name, phone, whatsapp, referral_code: referralCode } },
      });
      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Gagal mencipta akaun.");

      // 2. Create pending affiliate profile (RLS: owner = auth.uid())
      const { error: insErr } = await supabase.from("affiliates").insert({
        user_id: authData.user.id,
        affiliate_id: affiliateId,
        referral_code: referralCode,
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || null,
        status: "pending",
      });
      if (insErr) throw insErr;

      setDone(true);
      toast({
        title: "Pendaftaran berjaya",
        description: "Akaun anda sedang menunggu pengesahan admin.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Pendaftaran gagal",
        description: err?.message || "Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <img
            src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
            alt="ACS Legacy"
            className="h-14 w-14 object-contain mx-auto mb-2"
          />
          <h1 className="text-xl font-bold text-white">Daftar Affiliate</h1>
          <p className="text-sm text-slate-400">Jadi rakan kongsi ACS Legacy</p>
        </div>

        {done ? (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
            <p className="text-white font-medium">
              Pendaftaran berjaya.
            </p>
            <p className="text-sm text-slate-400">
              Akaun anda sedang menunggu pengesahan admin.
            </p>
            <Link
              to="/affiliate/login"
              className="inline-block text-blue-400 hover:underline text-sm"
            >
              Pergi ke log masuk →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nama Penuh</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmad Zaki"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">No Telefon / WhatsApp</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0123456789"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">WhatsApp (jika lain)</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0123456789"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Email (pilihan)</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 aksara"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftar...
                </>
              ) : (
                "Daftar Sebagai Affiliate"
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-slate-500">
          Sudah ada akaun?{" "}
          <Link to="/affiliate/login" className="text-blue-400 hover:underline">
            Log masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
