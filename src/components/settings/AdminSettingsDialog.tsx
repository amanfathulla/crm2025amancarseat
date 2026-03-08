import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LoaderCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";

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

  const resetForms = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
    setNewEmail("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowEmailPw(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast({ title: "Error", description: "Sila masukkan password semasa", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password baru mestilah sekurang-kurangnya 6 aksara", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password baru tidak sepadan", variant: "destructive" });
      return;
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
    } catch (error) {
      toast({ title: "Error", description: "Gagal kemaskini password", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!password) {
      toast({ title: "Error", description: "Sila masukkan password untuk pengesahan", variant: "destructive" });
      return;
    }
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: "Error", description: "Sila masukkan email yang sah", variant: "destructive" });
      return;
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
    } catch (error) {
      toast({ title: "Error", description: "Gagal kemaskini email", variant: "destructive" });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForms(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Tetapan Admin</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Password
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Tukar password admin anda</p>
            
            <div className="space-y-2">
              <Label>Password Semasa</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password semasa"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password Baru</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 aksara"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sahkan Password Baru</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan semula password baru"
                onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
              />
            </div>

            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className="w-full"
            >
              {isUpdatingPassword ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Mengemaskini...</>
              ) : (
                "Kemaskini Password"
              )}
            </Button>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Email semasa: <span className="font-medium text-foreground">{user?.email}</span>
            </p>

            <div className="space-y-2">
              <Label>Email Baru</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Masukkan email baru"
              />
            </div>

            <div className="space-y-2">
              <Label>Password (untuk pengesahan)</Label>
              <div className="relative">
                <Input
                  type={showEmailPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password anda"
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateEmail()}
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPw(!showEmailPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEmailPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleUpdateEmail}
              disabled={isUpdatingEmail}
              className="w-full"
            >
              {isUpdatingEmail ? (
                <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Mengemaskini...</>
              ) : (
                "Kemaskini Email"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
