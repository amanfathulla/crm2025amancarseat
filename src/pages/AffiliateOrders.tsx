import { useEffect, useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";

type Order = {
  id: string;
  customer_name_masked: string | null;
  car_model: string | null;
  material: string | null;
  order_amount: number | null;
  commission_amount: number | null;
  status: string;
  created_at: string;
};

export default function AffiliateOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
    c.from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", localStorage.getItem(AFF_ID)!)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setList((data as Order[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-400 text-sm">Memuatkan...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-slate-400">Jualan melalui pautan rujukan anda (pelanggan disorok)</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 px-4 py-2 text-xs text-slate-400 border-b border-white/10">
          <span>Pelanggan</span><span>Kereta / Bahan</span><span className="text-right">Jualan</span><span className="text-right">Komisen</span>
        </div>
        <div className="divide-y divide-white/5">
          {list.map((o) => (
            <div key={o.id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 items-center px-4 py-2.5 text-sm">
              <span className="text-slate-200 truncate">{o.customer_name_masked || "—"}</span>
              <span className="text-slate-400 truncate">{o.car_model || "—"} {o.material ? `· ${o.material}` : ""}</span>
              <span className="text-right text-slate-300">RM{(o.order_amount ?? 0).toFixed(2)}</span>
              <span className="text-right text-green-300">RM{(o.commission_amount ?? 0).toFixed(2)}</span>
            </div>
          ))}
          {list.length === 0 && <p className="px-4 py-6 text-center text-slate-500 text-sm">Tiada order lagi.</p>}
        </div>
      </div>
    </div>
  );
}
