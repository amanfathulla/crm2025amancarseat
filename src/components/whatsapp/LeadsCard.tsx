import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string;
  product: string | null;
  followup_status: string;
  created_at: string;
  pending_count: number;
  sender_label: string | null;
};

export default function LeadsCard() {
  const { authClient } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: l } = await authClient
      .from("leads")
      .select("id, name, phone, product, followup_status, created_at, assigned_sender_id")
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = (l ?? []) as any[];
    const { data: fu } = await authClient
      .from("lead_followups")
      .select("lead_id, status")
      .eq("status", "pending");
    const counts: Record<string, number> = {};
    for (const r of fu ?? []) counts[r.lead_id] = (counts[r.lead_id] ?? 0) + 1;

    const senderIds = Array.from(new Set(rows.map((r) => r.assigned_sender_id).filter(Boolean)));
    let senderMap: Record<string, string> = {};
    if (senderIds.length) {
      const { data: snd } = await authClient
        .from("whatsapp_senders")
        .select("id, label")
        .in("id", senderIds as string[]);
      senderMap = Object.fromEntries(((snd ?? []) as any[]).map((s) => [s.id, s.label]));
    }

    setLeads(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        product: r.product,
        followup_status: r.followup_status ?? "active",
        created_at: r.created_at,
        pending_count: counts[r.id] ?? 0,
        sender_label: r.assigned_sender_id ? senderMap[r.assigned_sender_id] ?? null : null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />
          Senarai Lead
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {leads.length} lead · kiraan follow-up tertunggak.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat lead...
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden max-h-[380px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Tiada lead lagi.
                    </TableCell>
                  </TableRow>
                )}
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.phone}</TableCell>
                    <TableCell>{l.product ?? "—"}</TableCell>
                    <TableCell>{l.sender_label ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={l.pending_count > 0 ? "default" : "secondary"}>
                        {l.pending_count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
