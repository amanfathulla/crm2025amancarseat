import { useEffect, useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { MousePointerClick, ShoppingBag, Wallet, TrendingUp } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{prefix}{display.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}{suffix}</span>;
}

export default function AffiliateDashboard() {
  const [stats, setStats] = useState({ clicks: 0, orders: 0, commission: 0, conversion: 0 });

  useEffect(() => {
    const token = localStorage.getItem(AFF_TOKEN);
    const id = localStorage.getItem(AFF_ID);
    if (!token || !id) return;
    const c = getAffiliateClient(token);

    (async () => {
      const clicks = await c.from("affiliate_clicks").select("id", { count: "exact" }).eq("affiliate_id", id);
      const orders = await c.from("affiliate_commissions").select("id", { count: "exact" }).eq("affiliate_id", id);
      const comm = await c.from("affiliate_commissions").select("commission_amount").eq("affiliate_id", id);
      const total = (comm.data || []).reduce((a: number, r: any) => a + (r.commission_amount ?? 0), 0);
      const clickCount = clicks.count ?? 0;
      const orderCount = orders.count ?? 0;
      setStats({
        clicks: clickCount,
        orders: orderCount,
        commission: total,
        conversion: clickCount > 0 ? (orderCount / clickCount) * 100 : 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Jumlah Klik", value: stats.clicks, icon: MousePointerClick, color: "from-blue-500/20 to-blue-600/5 text-blue-300", comp: <Counter value={stats.clicks} /> },
    { label: "Jumlah Order", value: stats.orders, icon: ShoppingBag, color: "from-purple-500/20 to-purple-600/5 text-purple-300", comp: <Counter value={stats.orders} /> },
    { label: "Komisen Diperoleh (RM)", value: stats.commission, icon: Wallet, color: "from-green-500/20 to-green-600/5 text-green-300", comp: <Counter value={stats.commission} prefix="RM" /> },
    { label: "Kadar Tukar (%)", value: stats.conversion, icon: TrendingUp, color: "from-amber-500/20 to-amber-600/5 text-amber-300", comp: <Counter value={stats.conversion} suffix="%" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Affiliate</h1>
        <p className="text-sm text-slate-400">Prestasi rujukan anda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${c.color} p-5 space-y-3 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{c.label}</span>
              <c.icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{c.comp}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="font-semibold mb-2">Selamat datang!</h2>
        <p className="text-sm text-slate-400">
          Kongsi pautan rujukan anda di <b>Referral Center</b> untuk mula kumpul komisen.
          Setiap jualan melalui pautan anda akan direkod secara automatik.
        </p>
      </div>
    </div>
  );
}
