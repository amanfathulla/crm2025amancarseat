import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Send, Settings, Users } from "lucide-react";

const ADMIN_SECRET = import.meta.env.VITE_WA_ADMIN_SECRET ?? "";

type Lead = {
  id: string;
  name: string;
  phone: string;
  product: string | null;
  status: string;
  followup_status: string;
  created_at: string;
  pending_count?: number;
};

type Settings = {
  automation_enabled: boolean;
  api_key_configured: boolean;
  sender_number: string | null;
};

export default function Leads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [saving, setSaving] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [sender, setSender] = useState("");
  const [automation, setAutomation] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("leads").select("id, name, phone, product, status, followup_status, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("whatsapp_settings").select("automation_enabled, api_key_configured, sender_number").eq("id", 1).maybeSingle(),
    ]);
    const rows = (l ?? []) as Lead[];
    // pending follow-up count per lead
    const { data: fu } = await supabase
      .from("lead_followups")
      .select("lead_id")
      .eq("status", "pending");
    const counts: Record<string, number> = {};
    for (const r of fu ?? []) counts[r.lead_id] = (counts[r.lead_id] ?? 0) + 1;
    setLeads(rows.map((x) => ({ ...x, pending_count: counts[x.id] ?? 0 })));
    if (s) {
      setSettings(s as Settings);
      setAutomation((s as Settings).automation_enabled);
      setSender((s as Settings).sender_number ?? "");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addLead = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Nama & phone wajib", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      product: product.trim() || null,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Gagal tambah lead", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lead ditambah", description: "Sequence follow-up automatik dijana." });
    setName(""); setPhone(""); setProduct(""); setAddOpen(false);
    load();
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      if (apiKey.trim()) {
        const { error } = await supabase.functions.invoke("whatsapp-followup", {
          body: { action: "setCredentials", apiKey: apiKey.trim(), sender: sender.trim(), secret: ADMIN_SECRET },
        });
        if (error) throw error;
      } else if (sender.trim()) {
        const { error } = await supabase.functions.invoke("whatsapp-followup", {
          body: { action: "setCredentials", sender: sender.trim(), secret: ADMIN_SECRET },
        });
        if (error) throw error;
      }
      const { error } = await supabase.functions.invoke("whatsapp-followup", {
        body: { action: "setAutomation", enabled: automation, secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: "Tetapan disimpan", description: "API & automation dikemaskini." });
      setSettingsOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Gagal simpan", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const sendNow = async () => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("whatsapp-followup", {
        body: { action: "send", secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: "Hantar dimulakan", description: "Follow-up tertunggak sedang dihantar." });
    } catch (e: any) {
      toast({ title: "Gagal hantar", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSending(false);
      load();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-sm text-muted-foreground">
              Follow-up WhatsApp automatik harian (ustazai.my)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSettingsOpen(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" /> Tetapan
          </Button>
          <Button onClick={sendNow} variant="outline" disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Hantar Sekarang
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Lead
          </Button>
        </div>
      </div>

      {settings && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Badge variant={settings.automation_enabled ? "default" : "secondary"}>
            Automation: {settings.automation_enabled ? "ON" : "OFF"}
          </Badge>
          <Badge variant={settings.api_key_configured ? "default" : "destructive"}>
            API: {settings.api_key_configured ? "Siap" : "Belum set"}
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat lead...
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pending Follow-up</TableHead>
                <TableHead>Dicipta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Tiada lead lagi.
                </TableCell></TableRow>
              )}
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>{l.product ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={l.followup_status === "active" ? "default" : "secondary"}>
                      {l.followup_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{l.pending_count ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("ms-MY")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Lead</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Ahmad" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="cth: 0194503184" />
            </div>
            <div className="space-y-2">
              <Label>Produk (pilihan)</Label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="cth: Kain Fullsilk" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={addLead} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tetapan WhatsApp (ustazai.my)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>API Key (ustazai.my)</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Kosongkan jika tak nak tukar" type="password" />
            </div>
            <div className="space-y-2">
              <Label>Nombor Sender (cth: 60194503184)</Label>
              <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Nombor WhatsApp sender" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Automation Harian</p>
                <p className="text-xs text-muted-foreground">Hantar follow-up tertunggak secara automatik (perlu jadual cron).</p>
              </div>
              <Switch checked={automation} onCheckedChange={setAutomation} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Batal</Button>
            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
