import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle, Mail, Lock, Eye, EyeOff, CreditCard, CheckCircle2 } from "lucide-react";

interface AdminSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  // Load Billplz settings when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchBillplz = async () => {
      setIsLoadingBillplz(true);
      try {
        const { data, error } = await authClient
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
      } catch (_) {
        // table may not have a row yet
      } finally {
        setIsLoadingBillplz(false);
      }
    };
    fetchBillplz();
  }, [open, authClient]);

  const resetForms = () => {
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPassword(""); setNewEmail("");
    setShowCurrentPw(false); setShowNewPw(false); setShowEmailPw(false);
    setBillplzSaved(false);
  };

  // ---- Password ----
  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast({ title: "Error", description: "Sila masukkan password semasa", variant: "destructive" }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password baru mestilah sekurang-kurangnya 6 aksara", variant: "destructive" }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password baru tidak sepadan", variant: "destructive" }); return;
    }
    setIsUpdatingPassword(true);
    try {
      const { data, error } = await authClient.rpc("update_admin_password", {
        p_admin_id: user?.id,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });
      if (error) throw error;
      if (data) {
        toast({ title: "Berjaya!", description: "Password telah dikemaskini" });
        resetForms();
      } else {
        toast({ title: "Gagal", description: "Password semasa tidak betul", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Gagal kemaskini password", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ---- Email ----
  const handleUpdateEmail = async () => {
    if (!password) {
      toast({ title: "Error", description: "Sila masukkan password untuk pengesahan", variant: "destructive" }); return;
    }
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: "Error", description: "Sila masukkan email yang sah", variant: "destructive" }); return;
    }
    setIsUpdatingEmail(true);
    try {
      const { data, error } = await authClient.rpc("update_admin_email", {
        p_admin_id: user?.id,
        p_password: password,
        p_new_email: newEmail.trim(),
      });
      if (error) throw error;
      if (data) {
        toast({ title: "Berjaya!", description: "Email telah dikemaskini. Sila login semula dengan email baru." });
        resetForms();
        onOpenChange(false);
      } else {
        toast({ title: "Gagal", description: "Password tidak betul", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Gagal kemaskini email", variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // ---- Billplz ----
  const handleSaveBillplz = async () => {
    if (!billplzApiKey.trim()) {
      toast({ title: "Error", description: "API Key tidak boleh kosong", variant: "destructive" }); return;
    }
    if (!billplzCollection.trim()) {
      toast({ title: "Error", description: "Collection ID tidak boleh kosong", variant: "destructive" }); return;
    }
    setIsSavingBillplz(true);
    try {
      if (billplzRowId) {
        // Update existing row
        const { error } = await authClient
          .from("billplz_settings")
          .update({
            api_key: billplzApiKey.trim(),
            x_signature_key: billplzXSig.trim(),
            collection_id: billplzCollection.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", billplzRowId);
        if (error) throw error;
      } else {
        // Insert new row
        const { data, error } = await authClient
          .from("billplz_settings")
          .insert({
            api_key: billplzApiKey.trim(),
            x_signature_key: billplzXSig.trim(),
            collection_id: billplzCollection.trim(),
          })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setBillplzRowId(data.id);
      }
      setBillplzSaved(true);
      toast({ title: "Berjaya!", description: "Tetapan Billplz telah disimpan" });
      setTimeout(() => setBillplzSaved(false), 3000);
    } catch {
      toast({ title: "Error", description: "Gagal simpan tetapan Billplz", variant: "destructive" });
    } finally {
      setIsSavingBillplz(false);
    }
  };

  const maskValue = (val: string) => val ? `${val.slice(0, 4)}${"•".repeat(Math.min(val.length - 4, 16))}` : "";

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForms(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Tetapan Admin</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password" className="flex items-center gap-1.5 text-xs">
              <Lock className="h-3.5 w-3.5" />
              Password
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" />
              Email
            </TabsTrigger>
            <TabsTrigger value="billplz" className="flex items-center gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" />
              Billplz
            </TabsTrigger>
          </TabsList>

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
              <Input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan semula password baru"
                onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()} />
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
              <Input type="email" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)} placeholder="Masukkan email baru" />
            </div>
            <div className="space-y-2">
              <Label>Password (untuk pengesahan)</Label>
              <div className="relative">
                <Input type={showEmailPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password anda"
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
                {/* API Key */}
                <div className="space-y-2">
                  <Label>API Key (Secret Key)</Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={billplzApiKey}
                      onChange={(e) => setBillplzApiKey(e.target.value)}
                      placeholder="Masukkan Billplz API Key"
                      className="pr-10 font-mono text-sm"
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ditemui di: Billplz Dashboard → Settings → API
                  </p>
                </div>

                {/* X-Signature Key */}
                <div className="space-y-2">
                  <Label>X-Signature Key</Label>
                  <div className="relative">
                    <Input
                      type={showXSig ? "text" : "password"}
                      value={billplzXSig}
                      onChange={(e) => setBillplzXSig(e.target.value)}
                      placeholder="Masukkan X-Signature Key"
                      className="pr-10 font-mono text-sm"
                    />
                    <button type="button" onClick={() => setShowXSig(!showXSig)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showXSig ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ditemui di: Billplz Dashboard → Settings → API → XSignature Key
                  </p>
                </div>

                {/* Collection ID */}
                <div className="space-y-2">
                  <Label>Collection ID</Label>
                  <Input
                    type="text"
                    value={billplzCollection}
                    onChange={(e) => setBillplzCollection(e.target.value)}
                    placeholder="cth: abc123xyz"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ditemui di: Billplz Dashboard → Collections → pilih koleksi anda
                  </p>
                </div>

                <Button
                  onClick={handleSaveBillplz}
                  disabled={isSavingBillplz}
                  className="w-full"
                  variant={billplzSaved ? "outline" : "default"}
                >
                  {isSavingBillplz ? (
                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                  ) : billplzSaved ? (
                    <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Tersimpan!</>
                  ) : (
                    "Simpan Tetapan Billplz"
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
