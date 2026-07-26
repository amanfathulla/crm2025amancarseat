import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CalendarClock } from "lucide-react";

const ADMIN_SECRET = import.meta.env.VITE_WA_ADMIN_SECRET ?? "";

type Sender = { id: string; label: string; phone_number: string };

type FollowupRow = {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  day_offset: number | null;
  scheduled_at: string;
  status: string;
  sender_label: string | null;
  rendered_message: string | null;
};

export default function FollowupScheduleCard() {
  const { authClient } = useAuth();
  const { toast } = useToast();

  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>("all");
  const [rows, setRows] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: snd } = await authClient
      .from("whatsapp_senders")
      .select("id, label, phone_number")
      .order("created_at", { ascending: true });
    setSenders((snd ?? []) as Sender[]);

    const { data: fu } = await authClient
      .from("lead_followups")
      .select(
        "id, lead_id, day_offset, scheduled_at, status, rendered_message, sender_id_used, leads(name, phone)"
      )
      .order("scheduled_at", { ascending: true })
      .limit(400);

    const items = (fu ?? []) as any[];
    let senderMap: Record<string, string> = {};
    if (items.some((r) => r.sender_id_used)) {
      const ids = Array.from(new Set(items.map((r) => r.sender_id_used).filter(Boolean)));
      const { data: sm } = await authClient
        .from("whatsapp_senders")
        .select("id, label")
        .in("id", ids as string[]);
      senderMap = Object.fromEntries(((sm ?? []) as any[]).map((s) => [s.id, s.label]));
    }

    setRows(
      items.map((r) => ({
        id: r.id,
        lead_id: r.lead_id,
        lead_name: r.leads?.name ?? "—",
        lead_phone: r.leads?.phone ?? "—",
        day_offset: r.day_offset,
        scheduled_at: r.scheduled_at,
        status: r.status,
        sender_label: r.sender_id_used ? senderMap[r.sender_id_used] ?? null : null,
        rendered_message: r.rendered_message,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered =
    selectedSender === "all"
      ? rows
      : rows.filter((r) => r.sender_label === senders.find((s) => s.id === selectedSender)?.label);

  const sendNow = async () => {
    setSending(true);
    try {
      const { error } = await authClient.functions.invoke("whatsapp-followup", {
        body: { action: "send", secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: "Hantar dimulakan", description: "Follow-up tertunggak sedang dihantar." });
      load();
    } catch (e: any) {
      toast({ title: "Gagal hantar", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "sent") return <Badge variant="default">Hantar</Badge>;
    if (s === "failed") return <Badge variant="destructive">Gagal</Badge>;
    if (s === "cancelled") return <Badge variant="secondary">Batal</Badge>;
    return <Badge variant="outline">Tunggak</Badge>;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="w-5 h-5 text-primary" />
            WhatsApp Followup
          </CardTitle>
          <Button onClick={sendNow} disabled={sending} size="sm" variant="outline">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Hantar Sekarang
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Jadual follow-up. Pilih sender untuk tapis lead.
        </p>
        <select
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedSender}
          onChange={(e) => setSelectedSender(e.target.value)}
        >
          <option value="all">Semua sender</option>
          {senders.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} · {s.phone_number}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat jadual...
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Tiada jadual follow-up untuk penapis ini.
              </p>
            )}
            {filtered.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">
                    {r.lead_name}{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({r.lead_phone})
                    </span>
                  </div>
                  {statusBadge(r.status)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>Hari ke-{r.day_offset ?? "?"}</span>
                  <span>·</span>
                  <span>{new Date(r.scheduled_at).toLocaleString("ms-MY")}</span>
                  {r.sender_label && (
                    <>
                      <span>·</span>
                      <span>Sender: {r.sender_label}</span>
                    </>
                  )}
                </div>
                {r.rendered_message && (
                  <p className="mt-1 text-xs text-foreground/80 line-clamp-2">{r.rendered_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
