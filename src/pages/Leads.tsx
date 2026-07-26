import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Users, PhoneCall } from "lucide-react";
import { LeadCharts } from "@/components/leads/LeadCharts";
import { LeadListTable } from "@/components/leads/LeadListTable";

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

export default function Leads() {
  const { authClient } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await authClient
      .from("leads")
      .select("id, name, phone, car_model, location, status, created_at, contacted_at, closed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const total = leads.length;
  const closed = leads.filter((l) => l.status === "closed").length;
  const contacted = leads.filter((l) => l.status === "contacted" || l.status === "closed").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <p className="text-sm text-muted-foreground">Senarai lead & prestasi follow-up</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
      </div>

      <div className="mb-8">
        <LeadCharts leads={leads} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat lead...
        </div>
      ) : (
        <LeadListTable leads={leads} onLeadUpdated={load} />
      )}
    </div>
  );
}
