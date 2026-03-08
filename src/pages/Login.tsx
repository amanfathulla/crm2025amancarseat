
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, LogIn, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// --- CAPTCHA helpers ---
const OPS = [
  (a: number, b: number) => ({ question: `${a} + ${b} = ?`, answer: a + b }),
  (a: number, b: number) => ({ question: `${a} × ${b} = ?`, answer: a * b }),
  (a: number, b: number) => {
    const big = Math.max(a, b), small = Math.min(a, b);
    return { question: `${big} - ${small} = ?`, answer: big - small };
  },
];

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const op = OPS[Math.floor(Math.random() * OPS.length)];
  return op(a, b);
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

export default function Login() {
  const [showDialog, setShowDialog] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  // CAPTCHA state
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // Rate limit state (client-side display only — server also rate limits)
  const [localAttempts, setLocalAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Persist lockout across page refresh
  useEffect(() => {
    const storedLastLogin = localStorage.getItem("lastLoginTime");
    setLastLogin(storedLastLogin);

    const storedAttempts = parseInt(localStorage.getItem("loginAttemptCount") || "0");
    const storedLockout = parseInt(localStorage.getItem("loginLockoutUntil") || "0");
    setLocalAttempts(storedAttempts);
    if (storedLockout && Date.now() < storedLockout) {
      setLockoutUntil(storedLockout);
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining === 0) {
        setLockoutUntil(null);
        setLocalAttempts(0);
        localStorage.removeItem("loginAttemptCount");
        localStorage.removeItem("loginLockoutUntil");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  }, []);

  const openDialog = () => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    setAdminEmail("");
    setAdminPassword("");
    setLoginError("");
    refreshCaptcha();
    setShowDialog(true);
  };

  const handleLogin = async () => {
    // 1. Lockout check
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    // 2. Basic input validation
    if (!adminEmail.trim()) { setLoginError("Sila masukkan e-mel anda"); return; }
    if (!adminPassword) { setLoginError("Sila masukkan kata laluan"); return; }

    // 3. CAPTCHA validation
    const userAnswer = parseInt(captchaInput.trim(), 10);
    if (isNaN(userAnswer) || userAnswer !== captcha.answer) {
      setCaptchaError("Jawapan CAPTCHA salah. Cuba lagi.");
      refreshCaptcha();
      return;
    }
    setCaptchaError("");

    setIsSubmitting(true);
    setLoginError("");

    try {
      const success = await login(adminEmail.trim(), adminPassword);

      if (success) {
        const currentTime = new Date().toLocaleString();
        localStorage.setItem("lastLoginTime", currentTime);
        localStorage.removeItem("loginAttemptCount");
        localStorage.removeItem("loginLockoutUntil");
        setShowDialog(false);
        navigate("/dashboard");
      } else {
        const newAttempts = localAttempts + 1;
        setLocalAttempts(newAttempts);
        localStorage.setItem("loginAttemptCount", String(newAttempts));

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutUntil(until);
          localStorage.setItem("loginLockoutUntil", String(until));
          setLoginError(`Terlalu banyak percubaan. Dikunci selama 15 minit.`);
          setShowDialog(false);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setLoginError(`E-mel atau kata laluan tidak sah. ${remaining} percubaan tinggal.`);
          refreshCaptcha();
        }
      }
    } catch {
      setLoginError("Ralat tidak dijangka berlaku. Cuba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const currentYear = new Date().getFullYear();

  const formatLockout = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djFjMCAyLjItMS44IDQtNCA0aC0yYy0yLjIgMC00LTEuOC00LTR2LTFjMC0yLjIgMS44LTQgNC00aDJjMi4yIDAgNCAxLjggNCA0ek0yIDJ2MWMwIDIuMi0xLjggNC00IDRoLTJjLTIuMiAwLTQtMS44LTQtNHYtMWMwLTIuMiAxLjgtNCA0LTRoMmMyLjIgMCA0IDEuOCA0IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

      {/* Logo */}
      <div className="w-full px-4 sm:px-6 flex-1 flex items-center justify-center
                      portrait:max-h-[60vh] landscape:max-h-[55vh]
                      landscape:md:max-h-[65vh] landscape:lg:max-h-[70vh]">
        <div className="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px]
                       landscape:max-w-[350px] landscape:md:max-w-[450px] landscape:lg:max-w-[550px] relative">
          <AspectRatio ratio={1 / 1} className="w-full">
            <img
              src="/lovable-uploads/c601d9f9-1e06-4854-83de-2fcd1b040c9c.png"
              alt="AMANCARSEAT Logo"
              className="w-full h-full object-contain"
            />
          </AspectRatio>
        </div>
      </div>

      <div className="w-full px-4 flex flex-col items-center justify-end pb-6 sm:pb-8 landscape:pb-4 landscape:md:pb-6">
        <Card className="w-full max-w-[400px] shadow-2xl border-none overflow-hidden bg-black/50 backdrop-blur-md border-t border-white/10">
          <CardContent className="p-6 space-y-4">

            {/* Lockout warning */}
            {isLockedOut && (
              <div className="flex items-center gap-2 bg-red-900/40 border border-red-500/30 rounded-md p-3">
                <Shield className="h-4 w-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-xs text-red-300 font-medium">Akaun dikunci sementara</p>
                  <p className="text-xs text-red-400">Cuba lagi dalam <span className="font-mono font-bold">{formatLockout(lockoutRemaining)}</span></p>
                </div>
              </div>
            )}

            <Button
              onClick={openDialog}
              variant="default"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 shadow-md hover:shadow-lg transition-all rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLockedOut}
            >
              {isSubmitting ? (
                <><LoaderCircle className="h-5 w-5 animate-spin" /><span>Sedang log masuk...</span></>
              ) : isLockedOut ? (
                <><Shield className="h-5 w-5" /><span>Dikunci ({formatLockout(lockoutRemaining)})</span></>
              ) : (
                <><LogIn className="h-5 w-5" /><span>Login sebagai Admin</span></>
              )}
            </Button>

            <div className="pt-3 border-t border-white/5 text-center space-y-1">
              {lastLogin && (
                <p className="text-xs text-white/60">Log masuk terakhir: {lastLogin}</p>
              )}
              <p className="text-xs text-white/40">&copy; {currentYear} AMAN CAR SEAT. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white/90 flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-400" />
              Pengesahan Admin
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-white/70 text-sm">E-mel</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Masukkan e-mel admin"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-white/70 text-sm">Kata Laluan</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata laluan"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-white/70 text-sm">Pengesahan CAPTCHA</Label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Jana semula
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-2.5 select-none">
                  <span className="font-mono text-white/90 text-sm tracking-widest">{captcha.question}</span>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Jawapan"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                  className="w-28 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-center"
                />
              </div>
              {captchaError && (
                <p className="text-xs text-orange-400">{captchaError}</p>
              )}
            </div>

            {/* Login error */}
            {loginError && (
              <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/20 rounded-md px-3 py-2">
                <Shield className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{loginError}</p>
              </div>
            )}

            {/* Attempt indicator */}
            {localAttempts > 0 && !isLockedOut && (
              <div className="flex gap-1 justify-center">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${i < localAttempts ? "bg-red-500" : "bg-white/10"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting || isLockedOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Sedang log masuk...</>
              ) : "Log Masuk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
