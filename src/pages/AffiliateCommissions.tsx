import { useEffect, useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";

type Comm = {
  id: string;
  order_amount: number | null;
  commission_amount: number | null;
  status: string;
  created_at: string;
};

export default function AffiliateCommissions() {
  const [list, setList] = useState<Comm[]>([]);
  const [total, setTotal] = useState(0);
  const [unpaid, setUnpaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
    c.from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", localStorage.getItem(AFF_ID)!)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data as Comm[]) || [];
        setList(rows);
        const t = rows.reduce((a, r) => a + (r.commission_amount ?? 0), 0);
        const u = rows.filter((r) => r.status !== "paid").reduce((a, r) => a + (r.commission_amount ?? 0), 0);
        setTotal(t);
        setUnpaid(u);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-400 text-sm">Memuatkan...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Komisen</h1>
        <p className="text-sm text-slate-400">Rekod komisen anda</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Jumlah Komisen</p>
          <p className="text-2xl font-bold text-green-300">RM{total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">Belum Dibayar</p>
          <p className="text-2xl font-bold text-amber-300">RM{unpaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-xs text-slate-400 border-b border-white/10">
          <span>Tarikh</span><span className="text-right">Komisen</span><span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {list.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-2.5 text-sm">
              <span className="text-slate-300">{new Date(r.created_at).toLocaleDateString("ms-MY")}</span>
              <span className="text-right text-green-300">RM{(r.commission_amount ?? 0).toFixed(2)}</span>
              <span className={`text-right text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                {r.status}
              </span>
            </div>
          ))}
          {list.length === 0 && <p className="px-4 py-6 text-center text-slate-500 text-sm">Tiada komisen lagi.</p>}
        </div>
      </div>
    </div>
  );
}
