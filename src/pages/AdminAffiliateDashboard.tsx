import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, MousePointerClick, Wallet, Loader2 } from "lucide-react";

type Stats = {
  total_aff: number;
  active_aff: number;
  pending_aff: number;
  total_clicks: number;
  total_commission: number;
  paid_commission: number;
  unpaid_commission: number;
};

export default function AdminAffiliateDashboard() {
  const { authClient } = useAuth();
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const aff = await authClient.from("affiliates").select("affiliate_id,status");
      const clicks = await authClient.from("affiliate_clicks").select("id", { count: "exact" });
      const comm = await authClient.from("affiliate_commissions").select("commission_amount,status");

      const affs = (aff.data || []) as { status: string }[];
      const comms = (comm.data || []) as { commission_amount: number | null; status: string }[];
      const total_commission = comms.reduce((a, c) => a + (c.commission_amount ?? 0), 0);
      const paid_commission = comms.filter((c) => c.status === "paid").reduce((a, c) => a + (c.commission_amount ?? 0), 0);

      setS({
        total_aff: affs.length,
        active_aff: affs.filter((a) => a.status === "active").length,
        pending_aff: affs.filter((a) => a.status === "pending").length,
        total_clicks: clicks.count ?? 0,
        total_commission,
        paid_commission,
        unpaid_commission: total_commission - paid_commission,
      });
      setLoading(false);
    })();
  }, [authClient]);

  if (loading || !s) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { label: "Jumlah Affiliate", value: s.total_aff, icon: Users, color: "text-blue-300 bg-blue-600/20" },
    { label: "Affiliate Aktif", value: s.active_aff, icon: Users, color: "text-green-300 bg-green-600/20" },
    { label: "Menunggu Kelulusan", value: s.pending_aff, icon: Users, color: "text-amber-300 bg-amber-600/20" },
    { label: "Total Klik", value: s.total_clicks, icon: MousePointerClick, color: "text-purple-300 bg-purple-600/20" },
    { label: "Total Komisen (RM)", value: s.total_commission.toFixed(2), icon: Wallet, color: "text-cyan-300 bg-cyan-600/20" },
    { label: "Belum Dibayar (RM)", value: s.unpaid_commission.toFixed(2), icon: Wallet, color: "text-red-300 bg-red-600/20" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="grid size-10 place-content-center rounded-lg bg-blue-600/20 shadow-md">
            <BarChart3 className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Affiliate Dashboard</h1>
            <p className="text-muted-foreground text-sm">Statistik keseluruhan program affiliate</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
            <div className={`grid size-9 place-content-center rounded-lg ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
