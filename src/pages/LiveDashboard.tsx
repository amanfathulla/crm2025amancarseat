import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Radio, TrendingUp, TrendingDown, Trophy, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type LiveOrder = {
  id: string;
  customer: string;
  material: string;
  design: string;
  carModel: string;
  price: number;
  status: string;
  time: Date;
};

const CUSTOMER_NAMES = [
  "Amirul H.", "Siti Nur A.", "Muhd Faiz", "Nurul Izzah", "Ahmad Zaki",
  "Farah Diana", "Hakim R.", "Aisyah B.", "Zulkifli M.", "Nadia S.",
  "Iskandar K.", "Liyana A.", "Danial H.", "Puteri N.", "Syafiq I.",
  "Hana M.", "Rizal A.", "Aina F.", "Haziq R.", "Sofea Z.",
];

const MATERIALS = [
  { name: "Fullsilk", price: 1499 },
  { name: "Semi Leather Kalis Air", price: 1299 },
  { name: "Kain Nylon", price: 999 },
  { name: "Kain Mesh", price: 899 },
];

const DESIGNS = ["Diamond Classic", "Diamond Elite", "Honeycomb", "Sport Line", "Executive", "Royal Stitch"];
const CAR_MODELS = ["Perodua Bezza", "Perodua Myvi", "Perodua Axia", "Proton X50", "Proton Saga", "Toyota Vios", "Honda City", "Honda HR-V", "Toyota Hilux", "Proton X70"];
const STATUSES = ["TAHNIAH", "ORDER BARU MASUK!"];

const DAILY_TARGET = 10;

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrder(): LiveOrder {
  const mat = randomFrom(MATERIALS);
  return {
    id: crypto.randomUUID(),
    customer: randomFrom(CUSTOMER_NAMES),
    material: mat.name,
    design: randomFrom(DESIGNS),
    carModel: randomFrom(CAR_MODELS),
    price: mat.price + Math.floor(Math.random() * 200),
    status: randomFrom(STATUSES),
    time: new Date(),
  };
}

function formatRelativeTime(date: Date, now: number): string {
  const diff = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s lalu`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  return `${h}j lalu`;
}

export default function LiveDashboard() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<LiveOrder[]>(() =>
    Array.from({ length: 10 }, () => {
      const o = generateOrder();
      o.time = new Date(Date.now() - Math.random() * 15 * 60_000);
      return o;
    })
  );
  const [todaySalesRM, setTodaySalesRM] = useState(12847);
  const [ordersToday, setOrdersToday] = useState(37);
  const [pctVsYesterday] = useState(22);
  const [now, setNow] = useState(Date.now());
  const [materialViews, setMaterialViews] = useState<Record<string, number>>({});
  const kpiFiredRef = useRef(false);

  // Load material views (7 days)
  useEffect(() => {
    const load = async () => {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const { data } = await authClient
        .from("page_views" as any)
        .select("material")
        .gte("viewed_at", start.toISOString())
        .limit(10000);
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        map[r.material] = (map[r.material] || 0) + 1;
      });
      setMaterialViews(map);
    };
    load();
  }, [authClient]);

  // Tick clock every second for relative time
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Simulate new orders every 7s
  useEffect(() => {
    const t = setInterval(() => {
      const o = generateOrder();
      setOrders((prev) => [o, ...prev].slice(0, 10));
      setOrdersToday((x) => x + 1);
      setTodaySalesRM((x) => x + o.price);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  // KPI achieved notification
  useEffect(() => {
    if (!kpiFiredRef.current && ordersToday >= 37 + DAILY_TARGET) {
      kpiFiredRef.current = true;
      toast({
        title: "🎉 KPI Harian Dicapai!",
        description: `Tahniah! Target ${DAILY_TARGET} order sehari telah dicapai.`,
      });
    }
  }, [ordersToday, toast]);

  const materialData = useMemo(() => {
    const items = MATERIALS.map((m) => ({
      name: m.name,
      views: materialViews[m.name] || Math.floor(Math.random() * 400 + 50),
    }));
    const max = Math.max(1, ...items.map((i) => i.views));
    const adsSpend = 350;
    return items.map((i) => ({
      ...i,
      pct: (i.views / max) * 100,
      cpv: (adsSpend / Math.max(1, i.views)).toFixed(2),
    }));
  }, [materialViews]);

  const designData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => (counts[o.design] = (counts[o.design] || 0) + 1));
    DESIGNS.forEach((d) => (counts[d] = (counts[d] || 0) + Math.floor(Math.random() * 8 + 2)));
    const arr = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const max = Math.max(1, ...arr.map((a) => a.count));
    return arr.map((a) => ({ ...a, pct: (a.count / max) * 100 }));
  }, [orders]);

  const metrics = useMemo(() => {
    const adsSpend = 1450;
    const revenue = todaySalesRM;
    const roas = revenue / adsSpend;
    const roi = ((revenue - adsSpend) / adsSpend) * 100;
    const cpc = 0.42;
    const cpl = 3.85;
    const ctr = 4.7;
    const costPerOrder = adsSpend / Math.max(1, ordersToday);
    const totalViews = materialData.reduce((s, m) => s + m.views, 0) || 1;
    const viewToOrder = (ordersToday / totalViews) * 100;
    return {
      roas: roas.toFixed(2) + "x",
      roi: roi.toFixed(0) + "%",
      adsSpend: `RM ${adsSpend.toLocaleString()}`,
      cpc: `RM ${cpc.toFixed(2)}`,
      cpl: `RM ${cpl.toFixed(2)}`,
      ctr: ctr.toFixed(1) + "%",
      costPerOrder: `RM ${costPerOrder.toFixed(2)}`,
      viewToOrder: viewToOrder.toFixed(1) + "%",
    };
  }, [todaySalesRM, ordersToday, materialData]);

  const kpiProgress = Math.min(100, ((ordersToday - 37) / DAILY_TARGET) * 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Live Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Pantau jualan & order secara real-time</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-600">LIVE</span>
        </div>
      </div>

      {/* Hero Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #2d4a7a 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ background: "radial-gradient(circle at 20% 20%, rgba(250,204,21,0.35), transparent 40%)" }} />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">Jualan Hari Ini</p>
            <p
              className="text-4xl md:text-6xl font-black leading-tight"
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RM {todaySalesRM.toLocaleString()}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-emerald-400 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" />
              ↑ {pctVsYesterday}% dari semalam
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">Order Baru</p>
            <p className="text-4xl md:text-6xl font-black text-amber-400 leading-tight">{ordersToday}</p>
            <p className="text-xs text-slate-400 mt-2">pesanan diterima hari ini</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">KPI Harian</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl md:text-4xl font-bold text-white">
                {Math.min(DAILY_TARGET, Math.max(0, ordersToday - 37))}
                <span className="text-slate-400 text-xl">/{DAILY_TARGET}</span>
              </p>
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div className="mt-2 w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${kpiProgress}%`,
                  background: "linear-gradient(90deg, #f59e0b, #fde68a)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric strip */}
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
              <p className={`text-sm md:text-base font-bold ${m.good ? "text-emerald-400" : "text-white"}`}>
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
                <p className="text-xs text-muted-foreground">View + kos per view (7 hari)</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {materialData.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{m.views}</span> view · RM {m.cpv}/view
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Terlaris */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Design Terlaris</h3>
                <p className="text-xs text-muted-foreground">7 hari terakhir</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {designData.map((d, idx) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Live Orders Table */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Radio className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Order Terbaru Live</h3>
              <p className="text-xs text-muted-foreground">Auto-refresh setiap 7 saat · 10 terkini</p>
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
                <th className="text-left px-4 py-3">Material / Design</th>
                <th className="text-left px-4 py-3">Model Kereta</th>
                <th className="text-right px-4 py-3">Harga</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Masa</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr
                  key={o.id}
                  className={`border-t transition-colors hover:bg-muted/40 ${
                    idx === 0 ? "animate-fade-in bg-emerald-500/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{o.customer}</td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{o.material}</div>
                    <div className="text-xs text-muted-foreground">{o.design}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.carModel}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    RM {o.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        o.status === "TAHNIAH"
                          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30"
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {formatRelativeTime(o.time, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
