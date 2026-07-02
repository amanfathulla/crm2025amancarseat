import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Radio, TrendingUp, Trophy, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type LiveOrder = {
  id: string;
  customer: string;
  product: string;
  car_model: string;
  price: number;
  created_at: string;
};

const MATERIALS = ["Fullsilk", "Semi Leather Kalis Air", "Kain Nylon", "Kain Mesh"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatRelativeTime(iso: string, now: number): string {
  const diff = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s lalu`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export default function LiveDashboard() {
  const { authClient } = useAuth();
  const [now, setNow] = useState(Date.now());

  const [todaySalesRM, setTodaySalesRM] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [yesterdaySalesRM, setYesterdaySalesRM] = useState(0);
  const [recentOrders, setRecentOrders] = useState<LiveOrder[]>([]);
  const [designData, setDesignData] = useState<{ name: string; count: number; pct: number }[]>([]);
  const [materialData, setMaterialData] = useState<
    { name: string; views: number; pct: number; cpv: string }[]
  >([]);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [adsToday, setAdsToday] = useState({
    spend: 0,
    clicks: 0,
    impressions: 0,
    leads: 0,
  });

  // Tick clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAll = useMemo(
    () => async () => {
      const todayIso = startOfToday().toISOString();
      const yestIso = startOfYesterday().toISOString();
      const sevenIso = daysAgo(7).toISOString();
      const thirtyIso = daysAgo(30).toISOString();

      // Today's customers (orders)
      const { data: todayCust } = await authClient
        .from("customers")
        .select("id, sales_amount, paid_amount")
        .gte("created_at", todayIso);
      const tSales = (todayCust || []).reduce(
        (s: number, r: any) => s + Number(r.sales_amount || r.paid_amount || 0),
        0
      );
      setTodaySalesRM(tSales);
      setOrdersToday((todayCust || []).length);

      // Yesterday
      const { data: yCust } = await authClient
        .from("customers")
        .select("sales_amount, paid_amount")
        .gte("created_at", yestIso)
        .lt("created_at", todayIso);
      const ySales = (yCust || []).reduce(
        (s: number, r: any) => s + Number(r.sales_amount || r.paid_amount || 0),
        0
      );
      setYesterdaySalesRM(ySales);

      // Recent orders — HARI INI SAHAJA (max 10)
      const { data: recent } = await authClient
        .from("customers")
        .select("id, name, product, car_model, sales_amount, paid_amount, created_at")
        .gte("created_at", todayIso)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentOrders(
        (recent || []).map((r: any) => ({
          id: r.id,
          customer: r.name || "—",
          product: r.product || "—",
          car_model: r.car_model || "—",
          price: Number(r.sales_amount || r.paid_amount || 0),
          created_at: r.created_at,
        }))
      );
      setTodayOrdersCount((recent || []).length);

      // Top 5 designs (product name) - 30 days
      const { data: prodRows } = await authClient
        .from("customers")
        .select("product")
        .gte("created_at", thirtyIso)
        .limit(5000);
      const counts: Record<string, number> = {};
      (prodRows || []).forEach((r: any) => {
        const name = (r.product || "").trim();
        if (!name) return;
        counts[name] = (counts[name] || 0) + 1;
      });
      const arr = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const dmax = Math.max(1, ...arr.map((a) => a.count));
      setDesignData(arr.map((a) => ({ ...a, pct: (a.count / dmax) * 100 })));

      // Material page views (7 days) — REAL DATA, group by whatever material exists
      const { data: pv } = await authClient
        .from("page_views" as any)
        .select("material")
        .gte("viewed_at", sevenIso)
        .limit(50000);
      const vmap: Record<string, number> = {};
      (pv || []).forEach((r: any) => {
        const m = (r.material || "Lain-lain").toString().trim();
        vmap[m] = (vmap[m] || 0) + 1;
      });
      // Merge fixed materials + any extras discovered in DB
      const allNames = Array.from(new Set([...MATERIALS, ...Object.keys(vmap)]));
      const mats = allNames
        .map((name) => ({ name, views: vmap[name] || 0 }))
        .sort((a, b) => b.views - a.views);
      const vmax = Math.max(1, ...mats.map((m) => m.views));

      // Ads spend today (for cpv)
      const { data: adsTodayRows } = await authClient
        .from("ads_spend" as any)
        .select("spend, clicks, impressions, leads")
        .gte("date", todayIso.substring(0, 10));
      const totalAds = (adsTodayRows || []).reduce(
        (acc: any, r: any) => ({
          spend: acc.spend + Number(r.spend || 0),
          clicks: acc.clicks + Number(r.clicks || 0),
          impressions: acc.impressions + Number(r.impressions || 0),
          leads: acc.leads + Number(r.leads || 0),
        }),
        { spend: 0, clicks: 0, impressions: 0, leads: 0 }
      );
      setAdsToday(totalAds);

      const totalViews7d = mats.reduce((s, m) => s + m.views, 0);
      setMaterialData(
        mats.map((m) => ({
          ...m,
          pct: (m.views / vmax) * 100,
          cpv:
            totalViews7d > 0 && totalAds.spend > 0
              ? (totalAds.spend / totalViews7d).toFixed(2)
              : "0.00",
        }))
      );
    },
    [authClient]
  );

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 15000);
    const ch = authClient
      .channel("live-dashboard-customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => loadAll()
      )
      .subscribe();
    return () => {
      clearInterval(t);
      authClient.removeChannel(ch);
    };
  }, [authClient, loadAll]);

  const pctVsYesterday = useMemo(() => {
    if (yesterdaySalesRM <= 0) return todaySalesRM > 0 ? 100 : 0;
    return Math.round(((todaySalesRM - yesterdaySalesRM) / yesterdaySalesRM) * 100);
  }, [todaySalesRM, yesterdaySalesRM]);

  const metrics = useMemo(() => {
    const { spend, clicks, impressions, leads } = adsToday;
    const revenue = todaySalesRM;
    const roas = spend > 0 ? revenue / spend : 0;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const costPerOrder = ordersToday > 0 ? spend / ordersToday : 0;
    const totalViews = materialData.reduce((s, m) => s + m.views, 0);
    const viewToOrder = totalViews > 0 ? (ordersToday / totalViews) * 100 : 0;
    return {
      roas: roas.toFixed(2) + "x",
      roi: (roi >= 0 ? "+" : "") + roi.toFixed(0) + "%",
      adsSpend: `RM ${spend.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`,
      cpc: `RM ${cpc.toFixed(2)}`,
      cpl: `RM ${cpl.toFixed(2)}`,
      ctr: ctr.toFixed(1) + "%",
      costPerOrder: `RM ${costPerOrder.toFixed(2)}`,
      viewToOrder: viewToOrder.toFixed(1) + "%",
    };
  }, [adsToday, todaySalesRM, ordersToday, materialData]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Live Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Data real-time dari sistem customer & marketing
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #2d4a7a 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(250,204,21,0.35), transparent 40%)",
          }}
        />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">
              Jualan Hari Ini
            </p>
            <p
              className="font-black leading-none break-words"
              style={{
                fontSize: "clamp(3rem, 11vw, 9rem)",
                background:
                  "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RM {todaySalesRM.toLocaleString("en-MY", { maximumFractionDigits: 0 })}
            </p>
            <div
              className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${
                pctVsYesterday >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              {pctVsYesterday >= 0 ? "↑" : "↓"} {Math.abs(pctVsYesterday)}% dari semalam
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">Order Baru</p>
            <p className="text-5xl md:text-7xl font-black text-amber-400 leading-none">
              {ordersToday}
            </p>
            <p className="text-xs text-slate-400 mt-2">pesanan diterima hari ini</p>
          </div>
        </div>

        <div className="relative mt-6 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { k: "ROAS", v: metrics.roas, good: true },
            { k: "ROI", v: metrics.roi, good: true },
            { k: "Belanja Iklan", v: metrics.adsSpend },
            { k: "CPC", v: metrics.cpc },
            { k: "CPL", v: metrics.cpl },
            { k: "CTR", v: metrics.ctr, good: true },
            { k: "Cost/Order", v: metrics.costPerOrder },
            { k: "View→Order", v: metrics.viewToOrder, good: true },
          ].map((m) => (
            <div key={m.k} className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{m.k}</p>
              <p
                className={`text-sm md:text-base font-bold ${
                  m.good ? "text-emerald-400" : "text-white"
                }`}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Material Views */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">View Pages Material</h3>
                <p className="text-xs text-muted-foreground">
                  View 7 hari + kos per view (belanja iklan hari ini)
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {materialData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Belum ada data view
              </p>
            ) : (
              materialData.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{m.views}</span> view · RM{" "}
                      {m.cpv}/view
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Design Terlaris - real product names, top 5 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Design Terlaris (Top 5)</h3>
                <p className="text-xs text-muted-foreground">
                  30 hari · dari nama produk sebenar
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {designData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Belum ada order untuk 30 hari terkini
              </p>
            ) : (
              designData.map((d, idx) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground flex items-center gap-2">
                      {idx === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                      {d.name}
                    </span>
                    <span className="font-semibold text-foreground">{d.count} order</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Belanja Iklan Hari Ini */}
      <div
        className="rounded-2xl p-5 md:p-6 shadow-sm border grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-300 mb-1">
            Belanja Iklan Hari Ini
          </p>
          <p className="text-2xl md:text-3xl font-black text-white">
            RM {adsToday.spend.toLocaleString("en-MY", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-300 mb-1">Klik</p>
          <p className="text-2xl md:text-3xl font-black text-amber-400">
            {adsToday.clicks.toLocaleString("en-MY")}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-300 mb-1">Lead</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-400">
            {adsToday.leads.toLocaleString("en-MY")}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-300 mb-1">Impressions</p>
          <p className="text-2xl md:text-3xl font-black text-white">
            {adsToday.impressions.toLocaleString("en-MY")}
          </p>
        </div>
      </div>

      {/* Live Orders */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Radio className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Order Terbaru Live</h3>
              <p className="text-xs text-muted-foreground">
                Hari ini sahaja · {todayOrdersCount} order
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">LIVE</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Pelanggan</th>
                <th className="text-left px-4 py-3">Produk</th>
                <th className="text-left px-4 py-3">Model Kereta</th>
                <th className="text-right px-4 py-3">Harga</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Masa</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada order
                  </td>
                </tr>
              ) : (
                recentOrders.map((o, idx) => (
                  <tr
                    key={o.id}
                    className={`border-t transition-colors hover:bg-muted/40 ${
                      idx === 0 ? "animate-fade-in bg-emerald-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{o.customer}</td>
                    <td className="px-4 py-3 text-foreground">{o.product}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.car_model}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      RM {o.price.toLocaleString("en-MY", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30">
                        ORDER BARU MASUK
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatRelativeTime(o.created_at, now)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
