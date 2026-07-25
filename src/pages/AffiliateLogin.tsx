import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

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
      // Email login. If user registered with auto email (phone@amancarseat.app),
      // they may log in with phone -> derive same email.
      const email =
        login.includes("@")
          ? login.trim()
          : `${login.replace(/[^0-9]/g, "")}@amancarseat.app`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user) {
        toast({
          title: "Login gagal",
          description: "No telefon/email atau kata laluan tidak sah.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Read affiliate profile
      const { data: aff, error: affErr } = await supabase
        .from("affiliates")
        .select("status, referral_code")
        .eq("user_id", data.user.id)
        .single();

      if (affErr || !aff) {
        toast({
          title: "Akaun tidak dijumpai",
          description: "Sila daftar sebagai affiliate.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (aff.status === "rejected") {
        setBlocked("Akaun anda tidak diluluskan.");
        setLoading(false);
        return;
      }
      if (aff.status === "pending") {
        setBlocked("Akaun anda sedang menunggu kelulusan admin.");
        setLoading(false);
        return;
      }
      if (aff.status === "frozen") {
        setBlocked("Akaun anda dibekukan. Sila hubungi admin.");
        setLoading(false);
        return;
      }

      // Active -> go to dashboard
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <img
            src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
            alt="ACS Legacy"
            className="h-14 w-14 object-contain mx-auto mb-2"
          />
          <h1 className="text-xl font-bold text-white">Log Masuk Affiliate</h1>
          <p className="text-sm text-slate-400">ACS Legacy Affiliate</p>
        </div>

        {blocked && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{blocked}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">No Telefon / Email</Label>
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="0123456789 atau email@contoh.com"
              className="bg-slate-800 border-white/10 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata laluan"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memeriksa...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Login
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Belum daftar?{" "}
          <Link to="/affiliate/register" className="text-blue-400 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
