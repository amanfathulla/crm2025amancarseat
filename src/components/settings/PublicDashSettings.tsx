import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle, Copy, RefreshCw, Radio } from "lucide-react";

interface Props {
  authClient: any;
  toast: (o: any) => void;
}

interface Status {
  configured: boolean;
  last_changed_at?: string;
  expires_at?: string;
  is_expired?: boolean;
  hide_sensitive_costs?: boolean;
}

function randomPassword(len = 8): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) s += chars[arr[i] % chars.length];
  return s;
}

export function PublicDashSettings({ authClient, toast }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const { data, error } = await authClient.rpc("get_public_dashboard_status");
    setLoading(false);
    if (error) {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
      return;
    }
    setStatus(data as Status);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSave = async () => {
    if (newPw.length < 4) {
      toast({ title: "Password terlalu pendek", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await authClient.rpc("set_public_dashboard_password", {
      p_password: newPw,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password disimpan", description: "Tempoh baru 30 hari." });
    setNewPw("");
    loadStatus();
  };

  const handleToggleHide = async (v: boolean) => {
    const { error } = await authClient.rpc("set_public_dashboard_hide_costs", {
      p_hide: v,
    });
    if (error) {
      toast({ title: "Ralat", description: error.message, variant: "destructive" });
      return;
    }
    loadStatus();
  };

  const daysLeft = status?.expires_at
    ? Math.ceil((new Date(status.expires_at).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <Radio className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground">
          Password untuk akses <span className="font-mono">/live-dashboardacs</span> — tamat tempoh
          automatik 30 hari selepas ditukar.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Memuatkan…
        </div>
      ) : status?.configured ? (
        <div className="rounded-xl border p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={status.is_expired ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>
              {status.is_expired ? "TAMAT TEMPOH" : "AKTIF"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aktif sehingga</span>
            <span className="font-medium">
              {new Date(status.expires_at!).toLocaleDateString("ms-MY", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          {daysLeft !== null && !status.is_expired && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Baki</span>
              <span className="font-medium">
                {daysLeft} hari
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">Belum diset.</div>
      )}

      <div className="space-y-2">
        <Label>Password Baru</Label>
        <div className="flex gap-2">
          <Input
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Minimum 4 aksara"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setNewPw(randomPassword(8))}
            title="Jana Password Rawak"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {newPw && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(newPw);
                toast({ title: "Disalin" });
              }}
              title="Salin"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving || !newPw} className="w-full">
          {saving ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Menyimpan…
            </>
          ) : (
            "Simpan & Reset Tempoh 30 Hari"
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border p-3">
        <div>
          <div className="text-sm font-medium">Sorok Kos Sensitif</div>
          <div className="text-xs text-muted-foreground">
            Sembunyikan Belanja Iklan & Cost/Order dari public dashboard.
          </div>
        </div>
        <Switch
          checked={!!status?.hide_sensitive_costs}
          onCheckedChange={handleToggleHide}
          disabled={!status?.configured}
        />
      </div>
    </div>
  );
}
