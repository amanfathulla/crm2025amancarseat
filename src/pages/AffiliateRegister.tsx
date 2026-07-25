import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";

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
    <div className="relative min-h-screen w-full bg-black flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djFjMCAyLjItMS44IDQtNCA0aC0yYy0yLjIgMC00LTEuOC00LTR2LTFjMC0yLjIgMS44LTQgNC00aDJjMi4yIDAgNCAxLjggNCA0ek0yIDJ2MWMwIDIuMi0xLjggNC00IDRoLTJjLTIuMiAwLTQtMS44LTQtNHYtMWMwLTIuMiAxLjgtNCA0LTRoMmMyLjIgMCA0IDEuOCA0IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

      {/* Logo */}
      <div className="relative z-10 w-full max-w-[240px] mb-6">
        <AspectRatio ratio={1 / 1}>
          <img
            src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
            alt="ACS Legacy"
            className="w-full h-full object-contain"
          />
        </AspectRatio>
      </div>

      <Card className="relative z-10 w-full max-w-[400px] shadow-2xl border-none overflow-hidden bg-black/50 backdrop-blur-md border-t border-white/10">
        <CardContent className="p-6 space-y-5">
          {done ? (
            <div className="text-center space-y-3 py-4">
              <div className="grid place-content-center h-14 w-14 rounded-full bg-green-500/15 mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Pendaftaran berjaya</p>
                <p className="text-sm text-slate-400 mt-1">
                  Akaun anda sedang menunggu pengesahan admin.
                </p>
              </div>
              <Link
                to="/affiliate/login"
                className="inline-block text-blue-400 hover:underline text-sm font-medium"
              >
                Pergi ke log masuk →
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-white">Daftar Affiliate</h1>
                <p className="text-sm text-slate-400">Jadi rakan kongsi ACS Legacy</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nama Penuh</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmad Zaki"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">No Telefon / WhatsApp</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123456789"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">WhatsApp (jika lain)</Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0123456789"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email (pilihan)</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 aksara"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md transition-all rounded-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /><span>Mendaftar...</span></>
                  ) : (
                    <><UserPlus className="h-5 w-5" /><span>Daftar Sebagai Affiliate</span></>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Sudah ada akaun?{" "}
                  <Link to="/affiliate/login" className="text-blue-400 hover:underline">
                    Log masuk
                  </Link>
                </p>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <p className="relative z-10 text-xs text-white/30 mt-6">
        &copy; {new Date().getFullYear()} AMAN CAR SEAT. All rights reserved.
      </p>
    </div>
  );
}
