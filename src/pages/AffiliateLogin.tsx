import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { LogIn, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";
const AFF_NAME = "affiliateName";
const AFF_STATUS = "affiliateStatus";
const AFF_REF = "affiliateReferral";

export default function AffiliateLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || password.length < 6) {
      toast({
        title: "Maklumat tidak lengkap",
        description: "Sila isi no telefon/email dan password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setBlocked(null);
    try {
      const { data, error } = await supabase.rpc("affiliate_login", {
        p_login: login.trim(),
        p_password: password,
      });
      if (error || !data) {
        toast({
          title: "Login gagal",
          description: "No telefon/email atau kata laluan tidak sah.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const res = data as {
        token: string;
        affiliate_id: string;
        status: string;
        name: string;
        referral_code: string;
      };

      if (res.status === "rejected") {
        setBlocked("Akaun anda tidak diluluskan.");
        setLoading(false);
        return;
      }
      if (res.status === "pending") {
        setBlocked("Akaun anda sedang menunggu kelulusan admin.");
        setLoading(false);
        return;
      }
      if (res.status === "frozen") {
        setBlocked("Akaun anda dibekukan. Sila hubungi admin.");
        setLoading(false);
        return;
      }

      localStorage.setItem(AFF_TOKEN, res.token);
      localStorage.setItem(AFF_ID, res.affiliate_id);
      localStorage.setItem(AFF_NAME, res.name);
      localStorage.setItem(AFF_STATUS, res.status);
      localStorage.setItem(AFF_REF, res.referral_code);

      navigate("/affiliate/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Login gagal",
        description: err?.message || "Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const tok = localStorage.getItem(AFF_TOKEN);
    if (tok) {
      try { await supabase.rpc("invalidate_affiliate_session", { p_token: tok }); } catch {}
    }
    localStorage.removeItem(AFF_TOKEN);
    localStorage.removeItem(AFF_ID);
    localStorage.removeItem(AFF_NAME);
    localStorage.removeItem(AFF_STATUS);
    localStorage.removeItem(AFF_REF);
    navigate("/affiliate/login");
  };

  const isAuthed = !!localStorage.getItem(AFF_TOKEN);

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
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-white">Log Masuk Affiliate</h1>
            <p className="text-sm text-slate-400">ACS Legacy Affiliate</p>
          </div>

          {blocked && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{blocked}</span>
            </div>
          )}

          {isAuthed ? (
            <div className="space-y-3 text-center">
              <p className="text-white">Anda sudah log masuk.</p>
              <div className="flex gap-2 justify-center">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/affiliate/dashboard")}>
                  Pergi Dashboard
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">No Telefon / Email</Label>
                <Input
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="0123456789 atau email@contoh.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata laluan"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md transition-all rounded-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Memeriksa...</span></>
                ) : (
                  <><LogIn className="h-5 w-5" /><span>Login</span></>
                )}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Belum daftar?{" "}
                <Link to="/affiliate/register" className="text-blue-400 hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="relative z-10 text-xs text-white/30 mt-6">
        &copy; {new Date().getFullYear()} AMAN CAR SEAT. All rights reserved.
      </p>
    </div>
  );
}
