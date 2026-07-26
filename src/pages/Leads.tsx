import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, PhoneCall, MessageSquare, Send, X } from "lucide-react";
import { LeadCharts } from "@/components/leads/LeadCharts";
import { LeadListTable } from "@/components/leads/LeadListTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ADMIN_SECRET = import.meta.env.VITE_WA_ADMIN_SECRET ?? "";

interface Lead {
  id: string;
  name: string;
  phone: string;
  car_model: string | null;
  location: string | null;
  status: string;
  created_at: string;
  contacted_at: string | null;
  closed_at: string | null;
}

type FollowupRow = {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  day_offset: number | null;
  scheduled_at: string;
  status: string;
};

export default function Leads() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [loadingFu, setLoadingFu] = useState(false);
  const [sentToday, setSentToday] = useState(0);
  const [scheduledToday, setScheduledToday] = useState(0);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await authClient
      .from("leads")
      .select("id, name, phone, car_model, location, status, created_at, contacted_at, closed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setLeads(data as Lead[]);
    setLoading(false);
  };

  const loadFollowups = async () => {
    setLoadingFu(true);
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data: fu } = await authClient
      .from("lead_followups")
      .select("id, lead_id, day_offset, scheduled_at, status, leads(name, phone)")
      .order("scheduled_at", { ascending: true })
      .limit(500);
    const items = (fu ?? []) as any[];
    setFollowups(
      items.map((r) => ({
        id: r.id,
        lead_id: r.lead_id,
        lead_name: r.leads?.name ?? "—",
        lead_phone: r.leads?.phone ?? "—",
        day_offset: r.day_offset,
        scheduled_at: r.scheduled_at,
        status: r.status,
      }))
    );

    const { data: sent } = await authClient
      .from("lead_followups")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", start)
      .lt("sent_at", end);
    setSentToday(sent ?? 0);

    const { data: sched } = await authClient
      .from("lead_followups")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("scheduled_at", start)
      .lt("scheduled_at", end);
    setScheduledToday(sched ?? 0);

    setLoadingFu(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = leads.length;
  const closed = leads.filter((l) => l.status === "closed").length;
  const contacted = leads.filter((l) => l.status === "contacted" || l.status === "closed").length;

  const statusBadge = (s: string) => {
    if (s === "sent") return <Badge className="bg-[#22C069] text-white">Sent</Badge>;
    if (s === "failed") return <Badge variant="destructive">Failed</Badge>;
    if (s === "replied") return <Badge className="bg-purple-600 text-white">Replied</Badge>;
    if (s === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
    return <Badge className="bg-yellow-400 text-black">Pending</Badge>;
  };

  const sendNow = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await authClient.functions.invoke("whatsapp-followup", {
        body: { action: "sendOne", followupId: id, secret: ADMIN_SECRET },
      });
      if (error) throw error;
      toast({ title: "Hantar dimulakan" });
      loadFollowups();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const cancelFu = async (id: string) => {
    setActingId(id);
    const { error } = await authClient
      .from("lead_followups")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);
    setActingId(null);
    if (error) toast({ title: "Gagal batal", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Follow-up dibatalkan" });
      loadFollowups();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-sm text-muted-foreground">Senarai lead & prestasi follow-up</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" /> Total Lead</div>
          <p className="text-3xl font-bold mt-1">{total}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><PhoneCall className="w-4 h-4" /> Dihubungi</div>
          <p className="text-3xl font-bold mt-1">{contacted}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" /> Closed</div>
          <p className="text-3xl font-bold mt-1">{closed}</p>
        </div>
        <div className="rounded-xl border p-4 bg-[#22C069]/10">
          <div className="flex items-center gap-2 text-[#22C069] text-sm"><MessageSquare className="w-4 h-4" /> WhatsApp Terhantar Hari Ini</div>
          <p className="text-3xl font-bold mt-1 text-[#22C069]">{sentToday}<span className="text-base font-normal text-muted-foreground"> / {scheduledToday}</span></p>
        </div>
      </div>

      <Tabs defaultValue="graf" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graf">Graf</TabsTrigger>
          <TabsTrigger value="senarai">Senarai Lead</TabsTrigger>
          <TabsTrigger value="followup">WhatsApp Followup</TabsTrigger>
        </TabsList>

        <TabsContent value="graf">
          <LeadCharts leads={leads} />
        </TabsContent>

        <TabsContent value="senarai">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat lead...
            </div>
          ) : (
            <LeadListTable leads={leads} onLeadUpdated={load} />
          )}
        </TabsContent>

        <TabsContent value="followup">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Jadual follow-up aktif (auto ikut hari).</p>
            <Button size="sm" variant="outline" onClick={loadFollowups} disabled={loadingFu}>
              {loadingFu ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Refresh
            </Button>
          </div>
          {loadingFu ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat jadual...
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Lead</TableHead>
                    <TableHead>No. Telefon</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh Dijadual</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">Tiada jadual follow-up.</TableCell>
                    </TableRow>
                  )}
                  {followups.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.lead_name}</TableCell>
                      <TableCell>{r.lead_phone}</TableCell>
                      <TableCell>Hari {r.day_offset ?? "?"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.scheduled_at).toLocaleString("ms-MY")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon" variant="ghost"
                            disabled={actingId === r.id || r.status !== "pending"}
                            onClick={() => sendNow(r.id)}
                            title="Hantar Sekarang"
                          >
                            {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            disabled={actingId === r.id || r.status !== "pending"}
                            onClick={() => cancelFu(r.id)}
                            title="Cancel Followup"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
