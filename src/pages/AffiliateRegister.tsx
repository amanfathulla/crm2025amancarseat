import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";
const AFF_NAME = "affiliateName";
const AFF_STATUS = "affiliateStatus";
const AFF_REF = "affiliateReferral";

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
      const { data, error } = await supabase.rpc("register_affiliate", {
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_whatsapp: whatsapp.trim() || phone.trim(),
        p_email: email.trim() || null,
        p_password: password,
      });
      if (error) throw error;

      const res = data as { affiliate_id: string; referral_code: string } | null;
      if (!res) throw new Error("Pendaftaran gagal.");

      localStorage.setItem(AFF_ID, res.affiliate_id);
      localStorage.setItem(AFF_REF, res.referral_code);
      localStorage.setItem(AFF_NAME, name.trim());
      localStorage.setItem(AFF_STATUS, "pending");

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <img
            src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
            alt="ACS Legacy"
            className="h-14 w-14 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-white">Daftar Affiliate</h1>
          <p className="text-sm text-slate-400">Jadi rakan kongsi ACS Legacy</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
            <p className="text-white font-medium">Pendaftaran berjaya.</p>
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
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 space-y-4"
          >
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
            <p className="text-center text-xs text-slate-500">
              Sudah ada akaun?{" "}
              <Link to="/affiliate/login" className="text-blue-400 hover:underline">
                Log masuk
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
