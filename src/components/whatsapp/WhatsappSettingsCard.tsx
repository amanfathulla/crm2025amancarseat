import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plug, Save, Send, Settings2 } from "lucide-react";

const ADMIN_SECRET = import.meta.env.VITE_WA_ADMIN_SECRET ?? "";

type Sender = {
  id: string;
  label: string;
  phone_number: string;
  is_active: boolean;
  connection_status: string;
  current_lead_count: number;
  daily_limit: number;
};

type Settings = {
  automation_enabled: boolean;
  api_key_configured: boolean;
  sender_number: string | null;
};

export default function WhatsappSettingsCard() {
  const { authClient } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [automation, setAutomation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingCreds, setSavingCreds] = useState(false);
  const [savingAuto, setSavingAuto] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: snd }] = await Promise.all([
      authClient.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle(),
      authClient.from("whatsapp_senders").select("*").order("created_at", { ascending: true }),
    ]);
    if (s) {
      const st = s as Settings;
      setSettings(st);
      setAutomation(st.automation_enabled);
      setSender(st.sender_number ?? "");
    }
    setSenders((snd ?? []) as Sender[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCredentials = async () => {
    if (!apiKey.trim() && !sender.trim()) {
      toast({ title: "Isi API key atau nombor sender", variant: "destructive" });
      return;
    }
    setSavingCreds(true);
    try {
      const body: any = { action: "setCredentials", secret: ADMIN_SECRET };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      if (sender.trim()) body.sender = sender.trim();
      const { error } = await authClient.functions.invoke("whatsapp-followup", { body });
      if (error) throw error;
      toast({ title: "Tetapan disimpan" });
      setApiKey("");
      load();
    } catch (e: any) {
      toast({ title: "Gagal simpan", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingCreds(false);
    }
  };

  const saveAutomation = async (v: boolean) => {
    setSavingAuto(true);
    setAutomation(v);
    try {
      const { error } = await authClient.functions.invoke("whatsapp-followup", {
        body: { action: "setAutomation", enabled: v, secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: v ? "Automation ON" : "Automation OFF" });
      load();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingAuto(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="w-5 h-5 text-primary" />
          WhatsApp Setting
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Sambungan ustazai.my, nombor sender & status peranti.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat...
          </div>
        ) : (
          <>
            {settings && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={settings.api_key_configured ? "default" : "destructive"}>
                  API: {settings.api_key_configured ? "Siap" : "Belum set"}
                </Badge>
                <Badge variant={settings.automation_enabled ? "default" : "secondary"}>
                  Automation: {settings.automation_enabled ? "ON" : "OFF"}
                </Badge>
              </div>
            )}

            <div className="space-y-2">
              <Label>API Key (ustazai.my)</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.api_key_configured ? "•••••••• (biar kosong = tak tukar)" : "Masukkan API key"}
              />
            </div>

            <div className="space-y-2">
              <Label>Nombor Sender (cth: 60194503184)</Label>
              <Input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Nombor WhatsApp sender"
              />
            </div>

            <Button onClick={saveCredentials} disabled={savingCreds} className="w-full">
              {savingCreds ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Kelayakan
            </Button>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Automation Harian</p>
                <p className="text-xs text-muted-foreground">Hantar follow-up tertunggak auto (perlu cron).</p>
              </div>
              <Switch checked={automation} disabled={savingAuto} onCheckedChange={saveAutomation} />
            </div>

            {/* Sender connection monitoring */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Plug className="w-4 h-4" /> Pantauan Sender ({senders.length})
              </div>
              {senders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tiada sender didaftarkan.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {senders.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <div>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.phone_number}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            s.connection_status === "connected"
                              ? "default"
                              : s.connection_status === "disconnected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {s.connection_status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {s.current_lead_count}/{s.daily_limit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() =>
                  toast({ title: "Cara tambah sender", description: "Guna SQL INSERT ke whatsapp_senders." })
                }
              >
                <Send className="w-4 h-4 mr-2" /> Tambah Sender (SQL)
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
