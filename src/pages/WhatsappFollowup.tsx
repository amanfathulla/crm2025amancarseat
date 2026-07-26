import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Save, Send, Plug, Eye, EyeOff, Plus, MessageSquareText,
} from "lucide-react";

const ADMIN_SECRET = import.meta.env.VITE_WA_ADMIN_SECRET ?? "";

type Settings = {
  automation_enabled: boolean;
  api_key_configured: boolean;
  sender_number: string | null;
};
type Sequence = { id: string; name: string; description: string | null };
type Step = {
  id: string;
  step_order: number;
  day_offset: number;
  message_template: string;
};

export default function WhatsappFollowup() {
  const { authClient } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [activeSeq, setActiveSeq] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [automation, setAutomation] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testNumber, setTestNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingCreds, setSavingCreds] = useState(false);
  const [savingAuto, setSavingAuto] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [newDay, setNewDay] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: seqs }] = await Promise.all([
      authClient.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle(),
      authClient.from("followup_sequences").select("id, name, description").eq("is_active", true).order("created_at", { ascending: true }),
    ]);
    if (s) {
      const st = s as Settings;
      setSettings(st);
      setAutomation(st.automation_enabled);
      setSender(st.sender_number ?? "");
    }
    const list = (seqs ?? []) as Sequence[];
    setSequences(list);
    const target = list[0]?.id ?? null;
    setActiveSeq(target);
    if (target) await loadSteps(target);
    setLoading(false);
  };

  const loadSteps = async (seqId: string) => {
    const { data } = await authClient
      .from("followup_steps")
      .select("id, step_order, day_offset, message_template")
      .eq("sequence_id", seqId)
      .order("step_order", { ascending: true });
    const st = (data ?? []) as Step[];
    setSteps(st);
    setActiveStep(st[0]?.id ?? null);
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
      toast({ title: "Kelayakan disimpan" });
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

  const testConnection = async () => {
    if (!testNumber.trim()) {
      toast({ title: "Isi no. telefon test", variant: "destructive" });
      return;
    }
    setTesting(true);
    try {
      const { error } = await authClient.functions.invoke("whatsapp-followup", {
        body: { action: "test", number: testNumber.trim(), secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: "Test dihantar", description: "Semak telefon anda." });
    } catch (e: any) {
      toast({ title: "Test gagal", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const updateLocalStep = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const saveStep = async (step: Step) => {
    setSavingStep(step.id);
    const { error } = await authClient
      .from("followup_steps")
      .update({ day_offset: step.day_offset, message_template: step.message_template })
      .eq("id", step.id);
    setSavingStep(null);
    if (error) toast({ title: "Gagal simpan", description: error.message, variant: "destructive" });
    else toast({ title: "Mesej hari ke-" + step.day_offset + " disimpan" });
  };

  const addDay = async () => {
    if (!activeSeq || !newDay.trim()) return;
    const day = Number(newDay);
    if (!day || day < 0) {
      toast({ title: "Hari mestilah nombor >= 0", variant: "destructive" });
      return;
    }
    const maxOrder = steps.reduce((m, s) => Math.max(m, s.step_order), 0);
    const { error } = await authClient.from("followup_steps").insert({
      sequence_id: activeSeq,
      step_order: maxOrder + 1,
      day_offset: day,
      message_template: "Salam {{nama}}, follow up untuk {{produk}}.",
    });
    if (error) toast({ title: "Gagal tambah hari", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Hari baharu ditambah" });
      setNewDay("");
      await loadSteps(activeSeq);
    }
  };

  const onSeqChange = async (seqId: string) => {
    setActiveSeq(seqId);
    await loadSteps(seqId);
  };

  const currentStep = steps.find((s) => s.id === activeStep) ?? null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Automation Settings</h1>
        <p className="text-sm text-muted-foreground">
          Sambungan ustazai.my, sequence follow-up & borang mesej harian.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat...
        </div>
      ) : (
        <>
          {/* PANEL 1 — Sambungan API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plug className="w-5 h-5 text-primary" /> Sambungan API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Input value="https://ustazai.my/send-message" readOnly className="bg-muted/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key (ustazai.my)</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={settings?.api_key_configured ? "•••••••• (biar kosong = tak tukar)" : "Masukkan API key"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sender (nombor device WhatsApp)</Label>
                  <Input
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="60194503184"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Automation Aktif (global)</p>
                  <p className="text-xs text-muted-foreground">Cron hanya hantar kalau switch ini ON.</p>
                </div>
                <Switch checked={automation} disabled={savingAuto} onCheckedChange={saveAutomation} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={saveCredentials} disabled={savingCreds}>
                  {savingCreds ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Kelayakan
                </Button>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label>Test Sambungan</Label>
                <div className="flex gap-2">
                  <Input
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="No. telefon test (60172888xxxx)"
                  />
                  <Button variant="outline" onClick={testConnection} disabled={testing}>
                    {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Test
                  </Button>
                </div>
                {settings && (
                  <Badge variant={settings.api_key_configured ? "default" : "destructive"}>
                    {settings.api_key_configured ? "Connected" : "Not connected"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PANEL 2 — Ringkasan Sequence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan Sequence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="mr-2">Sequence:</Label>
                {sequences.length === 0 && <span className="text-sm text-muted-foreground">Tiada sequence aktif.</span>}
                {sequences.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSeqChange(s.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      s.id === activeSeq ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {activeSeq && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hari dalam sequence:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((s) => (
                      <span key={s.id} className="px-2 py-1 rounded-md bg-muted text-xs font-medium">
                        D{s.day_offset}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PANEL 3 — Borang Mesej Harian */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="w-5 h-5 text-primary" /> Borang Mesej Harian
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Pilih hari → edit mesej. Pembolehubah: {"{{nama}}"}, {"{{produk}}"}.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Tiada step. Tambah hari baharu di bawah.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setActiveStep(s.id)}
                        className={`px-3 py-1.5 rounded-md text-sm border ${
                          s.id === activeStep ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        Hari {s.day_offset}
                      </button>
                    ))}
                  </div>

                  {currentStep && (
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Mesej Hari ke-{currentStep.day_offset}</span>
                        <div className="flex items-center gap-2 w-32">
                          <Label className="text-xs whitespace-nowrap">Hari ke-</Label>
                          <Input
                            type="number"
                            value={currentStep.day_offset}
                            onChange={(e) => updateLocalStep(currentStep.id, { day_offset: Number(e.target.value) || 0 })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <Textarea
                        rows={5}
                        value={currentStep.message_template}
                        onChange={(e) => updateLocalStep(currentStep.id, { message_template: e.target.value })}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveStep(currentStep)}
                        disabled={savingStep === currentStep.id}
                      >
                        {savingStep === currentStep.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Simpan Mesej
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className="border-t pt-4 flex items-end gap-2">
                <div className="flex-1">
                  <Label>Tambah Hari Baharu (day_offset)</Label>
                  <Input
                    type="number"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    placeholder="cth: 33"
                  />
                </div>
                <Button variant="outline" onClick={addDay} disabled={!activeSeq}>
                  <Plus className="w-4 h-4 mr-2" /> Tambah Hari
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
