import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle, Mail, Lock, Eye, EyeOff, CreditCard, CheckCircle2, Tag, Trash2, Plus, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AdminSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  usage_limit: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface TelegramSettings {
  id: string;
  bot_token: string;
  chat_id: string;
  is_enabled: boolean;
  notify_new_order: boolean;
}

export function AdminSettingsDialog({ open, onOpenChange }: AdminSettingsDialogProps) {
  const { user, authClient } = useAuth();
  const { toast } = useToast();

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email form
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Billplz form
  const [billplzApiKey, setBillplzApiKey] = useState("");
  const [billplzXSig, setBillplzXSig] = useState("");
  const [billplzCollection, setBillplzCollection] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showXSig, setShowXSig] = useState(false);
  const [isLoadingBillplz, setIsLoadingBillplz] = useState(false);
  const [isSavingBillplz, setIsSavingBillplz] = useState(false);
  const [billplzRowId, setBillplzRowId] = useState<string | null>(null);
  const [billplzSaved, setBillplzSaved] = useState(false);

  // Coupon form
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponAmount, setCouponAmount] = useState("");
  const [couponType, setCouponType] = useState<"fixed" | "percentage">("fixed");
  const [couponLimit, setCouponLimit] = useState("100");
  const [couponValidUntil, setCouponValidUntil] = useState("");

  // Telegram form
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [telegramRowId, setTelegramRowId] = useState<string | null>(null);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramNotifyOrder, setTelegramNotifyOrder] = useState(true);
  const [showBotToken, setShowBotToken] = useState(false);
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramSaved, setTelegramSaved] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Load data when dialog opens
  useEffect(() => {
    if (!open) return;
    fetchBillplz();
    fetchCoupons();
    fetchTelegram();
  }, [open, authClient]);

  const fetchBillplz = async () => {
    setIsLoadingBillplz(true);
    try {
      const { data } = await authClient
        .from("billplz_settings")
        .select("id, api_key, x_signature_key, collection_id")
        .limit(1)
        .single();
      if (data) {
        setBillplzRowId(data.id);
        setBillplzApiKey(data.api_key || "");
        setBillplzXSig(data.x_signature_key || "");
        setBillplzCollection(data.collection_id || "");
      }
    } catch (_) {}
    finally { setIsLoadingBillplz(false); }
  };

  const fetchCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const { data, error } = await authClient
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (_) {}
    finally { setIsLoadingCoupons(false); }
  };

  const fetchTelegram = async () => {
    setIsLoadingTelegram(true);
    try {
      const { data } = await (authClient as any)
        .from("telegram_settings")
        .select("id, bot_token, chat_id, is_enabled, notify_new_order")
        .limit(1)
        .single();
      if (data) {
        setTelegramRowId(data.id);
        setTelegramBotToken(data.bot_token || "");
        setTelegramChatId(data.chat_id || "");
        setTelegramEnabled(data.is_enabled ?? false);
        setTelegramNotifyOrder(data.notify_new_order ?? true);
        setTelegramSettings(data);
      }
    } catch (_) {}
    finally { setIsLoadingTelegram(false); }
  };

  const resetForms = () => {
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPassword(""); setNewEmail("");
    setShowCurrentPw(false); setShowNewPw(false); setShowEmailPw(false);
    setBillplzSaved(false); setTelegramSaved(false);
    setCouponCode(""); setCouponAmount(""); setCouponLimit("100"); setCouponValidUntil("");
  };

  // ---- Password ----
  const handleUpdatePassword = async () => {
    if (!currentPassword) { toast({ title: "Error", description: "Sila masukkan password semasa", variant: "destructive" }); return; }
    if (newPassword.length < 6) { toast({ title: "Error", description: "Password baru mestilah sekurang-kurangnya 6 aksara", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Error", description: "Password baru tidak sepadan", variant: "destructive" }); return; }
    setIsUpdatingPassword(true);
    try {
      const { data, error } = await authClient.rpc("update_admin_password", {
        p_admin_id: user?.id, p_current_password: currentPassword, p_new_password: newPassword,
      });
      if (error) throw error;
      if (data) { toast({ title: "Berjaya!", description: "Password telah dikemaskini" }); resetForms(); }
      else { toast({ title: "Gagal", description: "Password semasa tidak betul", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Gagal kemaskini password", variant: "destructive" }); }
    finally { setIsUpdatingPassword(false); }
  };

  // ---- Email ----
  const handleUpdateEmail = async () => {
    if (!password) { toast({ title: "Error", description: "Sila masukkan password untuk pengesahan", variant: "destructive" }); return; }
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { toast({ title: "Error", description: "Sila masukkan email yang sah", variant: "destructive" }); return; }
    setIsUpdatingEmail(true);
    try {
      const { data, error } = await authClient.rpc("update_admin_email", {
        p_admin_id: user?.id, p_password: password, p_new_email: newEmail.trim(),
      });
      if (error) throw error;
      if (data) { toast({ title: "Berjaya!", description: "Email telah dikemaskini." }); resetForms(); onOpenChange(false); }
      else { toast({ title: "Gagal", description: "Password tidak betul", variant: "destructive" }); }
    } catch { toast({ title: "Error", description: "Gagal kemaskini email", variant: "destructive" }); }
    finally { setIsUpdatingEmail(false); }
  };

  // ---- Billplz ----
  const handleSaveBillplz = async () => {
    if (!billplzApiKey.trim()) { toast({ title: "Error", description: "API Key tidak boleh kosong", variant: "destructive" }); return; }
    if (!billplzCollection.trim()) { toast({ title: "Error", description: "Collection ID tidak boleh kosong", variant: "destructive" }); return; }
    setIsSavingBillplz(true);
    try {
      if (billplzRowId) {
        const { error } = await authClient.from("billplz_settings").update({
          api_key: billplzApiKey.trim(), x_signature_key: billplzXSig.trim(),
          collection_id: billplzCollection.trim(), updated_at: new Date().toISOString(),
        }).eq("id", billplzRowId);
        if (error) throw error;
      } else {
        const { data, error } = await authClient.from("billplz_settings").insert({
          api_key: billplzApiKey.trim(), x_signature_key: billplzXSig.trim(), collection_id: billplzCollection.trim(),
        }).select("id").single();
        if (error) throw error;
        if (data) setBillplzRowId(data.id);
      }
      setBillplzSaved(true);
      toast({ title: "Berjaya!", description: "Tetapan Billplz telah disimpan" });
      setTimeout(() => setBillplzSaved(false), 3000);
    } catch { toast({ title: "Error", description: "Gagal simpan tetapan Billplz", variant: "destructive" }); }
    finally { setIsSavingBillplz(false); }
  };

  // ---- Telegram ----
  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    try {
      const payload = {
        bot_token: telegramBotToken.trim(),
        chat_id: telegramChatId.trim(),
        is_enabled: telegramEnabled,
        notify_new_order: telegramNotifyOrder,
        updated_at: new Date().toISOString(),
      };
      if (telegramRowId) {
        const { error } = await (authClient as any).from("telegram_settings").update(payload).eq("id", telegramRowId);
        if (error) throw error;
      } else {
        const { data, error } = await (authClient as any).from("telegram_settings").insert(payload).select("id").single();
        if (error) throw error;
        if (data) setTelegramRowId(data.id);
      }
      setTelegramSaved(true);
      toast({ title: "Berjaya!", description: "Tetapan Telegram telah disimpan" });
      setTimeout(() => setTelegramSaved(false), 3000);
    } catch { toast({ title: "Error", description: "Gagal simpan tetapan Telegram", variant: "destructive" }); }
    finally { setIsSavingTelegram(false); }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId.trim()) { toast({ title: "Error", description: "Sila masukkan Chat ID dahulu", variant: "destructive" }); return; }
    setIsSendingTest(true);
    try {
      // Save first then test
      await handleSaveTelegram();
      const res = await fetch(
        `https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/telegram-notify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: "test",
            _test: true,
            _message: "🧪 *Ujian Notifikasi ACS Legacy CRM*\n\nTetapan Telegram berjaya disambungkan! ✅\n\n_Anda akan menerima notifikasi setiap kali ada tempahan baru._",
            _chat_id: telegramChatId.trim(),
          }),
        }
      );
      if (res.ok) {
        toast({ title: "Berjaya!", description: "Mesej ujian telah dihantar ke Telegram" });
      } else {
        toast({ title: "Gagal", description: "Periksa Bot Token dan Chat ID", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Gagal hantar mesej ujian", variant: "destructive" }); }
    finally { setIsSendingTest(false); }
  };

  // ---- Coupons ----
  const handleAddCoupon = async () => {
    if (!couponCode.trim()) { toast({ title: "Error", description: "Sila masukkan kod kupon", variant: "destructive" }); return; }
    if (!couponAmount || parseFloat(couponAmount) <= 0) { toast({ title: "Error", description: "Sila masukkan jumlah diskaun", variant: "destructive" }); return; }
    if (!couponValidUntil) { toast({ title: "Error", description: "Sila pilih tarikh tamat", variant: "destructive" }); return; }
    setIsSavingCoupon(true);
    try {
      const { error } = await authClient.from("coupons").insert({
        code: couponCode.trim().toUpperCase(),
        discount_amount: parseFloat(couponAmount),
        discount_type: couponType,
        usage_limit: parseInt(couponLimit) || 100,
        valid_until: new Date(couponValidUntil).toISOString(),
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Berjaya!", description: "Kupon telah ditambah" });
      setCouponCode(""); setCouponAmount(""); setCouponLimit("100"); setCouponValidUntil("");
      fetchCoupons();
    } catch (err: any) {
      const msg = err?.message?.includes("duplicate") ? "Kod kupon sudah wujud" : "Gagal tambah kupon";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setIsSavingCoupon(false); }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await authClient.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
      if (error) throw error;
      fetchCoupons();
    } catch { toast({ title: "Error", description: "Gagal kemaskini kupon", variant: "destructive" }); }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const { error } = await authClient.from("coupons").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Berjaya!", description: "Kupon telah dipadam" });
      fetchCoupons();
    } catch { toast({ title: "Error", description: "Gagal padam kupon", variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForms(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Tetapan Admin</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="billplz" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="billplz" className="flex items-center gap-1 text-xs">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Billplz</span>
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-1 text-xs">
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Telegram</span>
            </TabsTrigger>
            <TabsTrigger value="coupon" className="flex items-center gap-1 text-xs">
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kupon</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-1 text-xs">
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1 text-xs">
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Billplz Tab ── */}
          <TabsContent value="billplz" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Kemaskini kelayakan pembayaran Billplz. Nilai disimpan dengan selamat dalam pangkalan data.
            </p>
            {isLoadingBillplz ? (
              <div className="flex items-center justify-center py-6">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>API Key (Secret Key)</Label>
                  <div className="relative">
                    <Input type={showApiKey ? "text" : "password"} value={billplzApiKey}
                      onChange={(e) => setBillplzApiKey(e.target.value)} placeholder="Masukkan Billplz API Key"
                      className="pr-10 font-mono text-sm" />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ditemui di: Billplz Dashboard → Settings → API</p>
                </div>
                <div className="space-y-2">
                  <Label>X-Signature Key</Label>
                  <div className="relative">
                    <Input type={showXSig ? "text" : "password"} value={billplzXSig}
                      onChange={(e) => setBillplzXSig(e.target.value)} placeholder="Masukkan X-Signature Key"
                      className="pr-10 font-mono text-sm" />
                    <button type="button" onClick={() => setShowXSig(!showXSig)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showXSig ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ditemui di: Billplz Dashboard → Settings → API → XSignature Key</p>
                </div>
                <div className="space-y-2">
                  <Label>Collection ID</Label>
                  <Input type="text" value={billplzCollection} onChange={(e) => setBillplzCollection(e.target.value)}
                    placeholder="cth: abc123xyz" className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">Ditemui di: Billplz Dashboard → Collections → pilih koleksi anda</p>
                </div>
                <Button onClick={handleSaveBillplz} disabled={isSavingBillplz} className="w-full"
                  variant={billplzSaved ? "outline" : "default"}>
                  {isSavingBillplz ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                    : billplzSaved ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Tersimpan!</>
                    : "Simpan Tetapan Billplz"}
                </Button>
              </>
            )}
          </TabsContent>

          {/* ── Telegram Tab ── */}
          <TabsContent value="telegram" className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Send className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Cara setup Telegram Bot:</p>
                <ol className="list-decimal ml-3 space-y-0.5">
                  <li>Buka Telegram, cari <span className="font-mono font-bold">@BotFather</span></li>
                  <li>Hantar <span className="font-mono">/newbot</span> dan ikut arahan</li>
                  <li>Salin <strong>Bot Token</strong> yang diberikan</li>
                  <li>Hantar mesej ke bot anda, kemudian buka: <br/><span className="font-mono text-[10px] break-all">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span></li>
                  <li>Salin <strong>chat.id</strong> dari hasil JSON</li>
                </ol>
              </div>
            </div>

            {isLoadingTelegram ? (
              <div className="flex items-center justify-center py-6">
                <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <div className="relative">
                    <Input type={showBotToken ? "text" : "password"} value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      className="pr-10 font-mono text-sm" />
                    <button type="button" onClick={() => setShowBotToken(!showBotToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showBotToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chat ID</Label>
                  <Input type="text" value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="cth: -1001234567890 atau 123456789"
                    className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">ID kumpulan Telegram atau chat peribadi anda</p>
                </div>

                <div className="space-y-3 p-3 rounded-xl border bg-muted/20">
                  <p className="text-xs font-semibold text-foreground">Tetapan Notifikasi</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Aktifkan Notifikasi</p>
                      <p className="text-xs text-muted-foreground">Hantar notifikasi ke Telegram</p>
                    </div>
                    <Switch checked={telegramEnabled} onCheckedChange={setTelegramEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Tempahan Baru</p>
                      <p className="text-xs text-muted-foreground">Notifikasi setiap ada order masuk</p>
                    </div>
                    <Switch checked={telegramNotifyOrder} onCheckedChange={setTelegramNotifyOrder} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveTelegram} disabled={isSavingTelegram} className="flex-1"
                    variant={telegramSaved ? "outline" : "default"}>
                    {isSavingTelegram ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                      : telegramSaved ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Tersimpan!</>
                      : "Simpan Tetapan"}
                  </Button>
                  <Button onClick={handleTestTelegram} disabled={isSendingTest} variant="outline" className="shrink-0">
                    {isSendingTest ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1.5" />Uji</>}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Coupon Tab ── */}
          <TabsContent value="coupon" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Cipta kupon diskaun untuk pelanggan.</p>

            {/* Add coupon form */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Tambah Kupon Baru
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Kod Kupon</Label>
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value)}
                    placeholder="cth: DISKAUN10" className="text-sm uppercase" />
                </div>
                <div>
                  <Label className="text-xs">Jenis Diskaun</Label>
                  <select value={couponType} onChange={e => setCouponType(e.target.value as "fixed" | "percentage")}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="fixed">RM (Tetap)</option>
                    <option value="percentage">% (Peratus)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Jumlah</Label>
                  <Input type="number" value={couponAmount} onChange={e => setCouponAmount(e.target.value)}
                    placeholder={couponType === "fixed" ? "10" : "5"} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Had Guna</Label>
                  <Input type="number" value={couponLimit} onChange={e => setCouponLimit(e.target.value)}
                    placeholder="100" className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Sah Sehingga</Label>
                  <Input type="date" value={couponValidUntil} onChange={e => setCouponValidUntil(e.target.value)}
                    className="text-sm" />
                </div>
              </div>
              <Button onClick={handleAddCoupon} disabled={isSavingCoupon} size="sm" className="w-full">
                {isSavingCoupon ? <><LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />Menambah...</> : "Tambah Kupon"}
              </Button>
            </div>

            {/* Coupon list */}
            {isLoadingCoupons ? (
              <div className="flex justify-center py-4"><LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : coupons.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Tiada kupon lagi.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {coupons.map(c => {
                  const expired = new Date(c.valid_until) < new Date();
                  const exhausted = c.usage_count >= c.usage_limit;
                  return (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      !c.is_active || expired || exhausted ? "opacity-50 bg-muted/20" : "bg-background"
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{c.code}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${c.is_active && !expired && !exhausted ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                            {expired ? "Tamat" : exhausted ? "Habis" : c.is_active ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.discount_type === "fixed" ? `RM${c.discount_amount}` : `${c.discount_amount}%`} · 
                          {c.usage_count}/{c.usage_limit} diguna · 
                          Sah: {new Date(c.valid_until).toLocaleDateString("ms-MY")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => handleToggleCoupon(c)} title={c.is_active ? "Nyahaktif" : "Aktifkan"}>
                          {c.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCoupon(c.id)} title="Padam">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Password Tab ── */}
          <TabsContent value="password" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Tukar password admin anda</p>
            <div className="space-y-2">
              <Label>Password Semasa</Label>
              <div className="relative">
                <Input type={showCurrentPw ? "text" : "password"} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Masukkan password semasa" />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input type={showNewPw ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 aksara" />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sahkan Password Baru</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan semula password baru" onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()} />
            </div>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword} className="w-full">
              {isUpdatingPassword ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Mengemaskini...</> : "Kemaskini Password"}
            </Button>
          </TabsContent>

          {/* ── Email Tab ── */}
          <TabsContent value="email" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Email semasa: <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <div className="space-y-2">
              <Label>Email Baru</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Masukkan email baru" />
            </div>
            <div className="space-y-2">
              <Label>Password (untuk pengesahan)</Label>
              <div className="relative">
                <Input type={showEmailPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password anda"
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateEmail()} />
                <button type="button" onClick={() => setShowEmailPw(!showEmailPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showEmailPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail} className="w-full">
              {isUpdatingEmail ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Mengemaskini...</> : "Kemaskini Email"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
