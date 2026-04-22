import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  LayoutDashboard,
  Users,
  Megaphone,
  Package,
  BarChart3,
  Settings,
  CreditCard,
  Target,
  Activity,
  Wifi,
  WifiOff,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusType = "ok" | "error" | "checking" | "warn";

interface SystemCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: StatusType;
  message: string;
  responseTime?: number;
  gradient?: string;
  extra?: Record<string, string | number>;
}

const INITIAL_CHECKS: Omit<SystemCheck, "status" | "message" | "responseTime" | "extra">[] = [
  { id: "database", name: "Database Supabase", description: "Sambungan utama ke pangkalan data", icon: Activity, gradient: "from-violet-500 to-violet-600" },
  { id: "dashboard", name: "Dashboard", description: "Data jualan & statistik pelanggan", icon: LayoutDashboard, gradient: "from-blue-500 to-blue-600" },
  { id: "customers", name: "Customers", description: "Rekod & status pesanan pelanggan", icon: Users, gradient: "from-cyan-500 to-cyan-600" },
  { id: "order-flow", name: "Link Tempahan", description: "Aliran pesanan WhatsApp & BillPlz", icon: ShoppingBag, gradient: "from-pink-500 to-pink-600" },
  { id: "leads", name: "Lead Management", description: "Pengurusan prospek & leads", icon: Target, gradient: "from-orange-500 to-orange-600" },
  { id: "marketing", name: "Marketing", description: "Nota & tugas pemasaran", icon: Megaphone, gradient: "from-rose-500 to-rose-600" },
  { id: "products", name: "Products", description: "Katalog produk & variasi", icon: Package, gradient: "from-emerald-500 to-emerald-600" },
  { id: "sales", name: "Sales Records", description: "Data rekod jualan tahunan", icon: BarChart3, gradient: "from-teal-500 to-teal-600" },
  { id: "settings", name: "Settings (Admin)", description: "Tetapan admin & konfigurasi", icon: Settings, gradient: "from-slate-500 to-slate-600" },
  { id: "billplz", name: "Billplz Payment", description: "Konfigurasi & kelayakan Billplz", icon: CreditCard, gradient: "from-indigo-500 to-indigo-600" },
  { id: "coupons", name: "Sistem Kupon", description: "Urus kod diskaun pelanggan", icon: Activity, gradient: "from-amber-500 to-amber-600" },
];

export default function SystemStatus() {
  const { authClient } = useAuth();
  const [checks, setChecks] = useState<SystemCheck[]>(
    INITIAL_CHECKS.map((c) => ({ ...c, status: "checking" as StatusType, message: "Memeriksa..." }))
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overallStatus, setOverallStatus] = useState<StatusType>("checking");

  const updateCheck = (id: string, status: StatusType, message: string, responseTime?: number, extra?: Record<string, string | number>) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, message, responseTime, extra } : c))
    );
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `RM${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `RM${(value / 1000).toFixed(0)}K`;
    return `RM${value.toFixed(0)}`;
  };

  const runChecks = useCallback(async () => {
    setIsRefreshing(true);
    setChecks((prev) => prev.map((c) => ({ ...c, status: "checking" as StatusType, message: "Memeriksa...", extra: undefined })));

    // 1. Database
    const dbStart = Date.now();
    try {
      const { error } = await authClient.from("customers").select("id").limit(1);
      if (error) throw error;
      updateCheck("database", "ok", "Sambungan berjaya", Date.now() - dbStart);
    } catch {
      updateCheck("database", "error", "Gagal sambung ke database");
    }

    // 2. Dashboard
    const dashStart = Date.now();
    try {
      const [r1, r2] = await Promise.all([
        authClient.from("customers").select("id").limit(1),
        authClient.from("yearly_sales").select("id").limit(1),
      ]);
      if (r1.error || r2.error) throw r1.error || r2.error;
      updateCheck("dashboard", "ok", "Data dashboard boleh diakses", Date.now() - dashStart);
    } catch {
      updateCheck("dashboard", "error", "Gagal muatkan data dashboard");
    }

    // 3. Customers with stats
    const custStart = Date.now();
    try {
      const [totalRes, procRes, compRes, cancelRes, revenueRes] = await Promise.all([
        authClient.from("customers").select("id", { count: "exact", head: true }),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("order_status", "processing"),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("order_status", "completed"),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("order_status", "cancelled"),
        authClient.from("customers").select("sales_amount, paid_amount"),
      ]);
      if (totalRes.error) throw totalRes.error;
      const totalSales = (revenueRes.data || []).reduce((s, r) => s + parseFloat(String(r.sales_amount || 0)), 0);
      updateCheck("customers", "ok", `${totalRes.count ?? 0} pelanggan`, Date.now() - custStart, {
        processing: procRes.count ?? 0,
        completed: compRes.count ?? 0,
        cancelled: cancelRes.count ?? 0,
        totalSales,
      });
    } catch {
      updateCheck("customers", "error", "Gagal akses jadual customers");
    }

    // 4. Order Flow (WhatsApp & BillPlz tracking)
    const orderStart = Date.now();
    try {
      const [wpRes, bpRes, wpCompRes, bpCompRes] = await Promise.all([
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("payment_source", "whatsapp"),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("payment_source", "billplz"),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("payment_source", "whatsapp").eq("order_status", "completed"),
        authClient.from("customers").select("id", { count: "exact", head: true }).eq("payment_source", "billplz").eq("order_status", "completed"),
      ]);
      const wpTotal = wpRes.count ?? 0;
      const bpTotal = bpRes.count ?? 0;
      const wpDone = wpCompRes.count ?? 0;
      const bpDone = bpCompRes.count ?? 0;
      updateCheck("order-flow", "ok", `${wpTotal + bpTotal} jumlah tempahan`, Date.now() - orderStart, {
        whatsappTotal: wpTotal,
        whatsappCompleted: wpDone,
        billplzTotal: bpTotal,
        billplzCompleted: bpDone,
      });
    } catch {
      updateCheck("order-flow", "error", "Gagal semak aliran pesanan");
    }

    // 5. Leads
    const leadsStart = Date.now();
    try {
      const { error, count } = await authClient.from("leads").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("leads", "ok", `${count ?? 0} leads ditemui`, Date.now() - leadsStart);
    } catch {
      updateCheck("leads", "error", "Gagal akses jadual leads");
    }

    // 6. Marketing
    const mktStart = Date.now();
    try {
      const { error, count } = await authClient.from("marketing_content").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("marketing", "ok", `${count ?? 0} kandungan pemasaran`, Date.now() - mktStart);
    } catch {
      updateCheck("marketing", "error", "Gagal akses data pemasaran");
    }

    // 7. Products
    const prodStart = Date.now();
    try {
      const [totalRes, activeRes, inactiveRes] = await Promise.all([
        authClient.from("products").select("id", { count: "exact", head: true }),
        authClient.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        authClient.from("products").select("id", { count: "exact", head: true }).eq("status", "inactive"),
      ]);
      if (totalRes.error) throw totalRes.error;
      updateCheck("products", "ok", `${totalRes.count ?? 0} produk`, Date.now() - prodStart, {
        active: activeRes.count ?? 0,
        inactive: inactiveRes.count ?? 0,
      });
    } catch {
      updateCheck("products", "error", "Gagal akses jadual produk");
    }

    // 8. Sales
    const salesStart = Date.now();
    try {
      const { data, error } = await authClient.from("yearly_sales").select("total_revenue, total_profit");
      if (error) throw error;
      const rev = (data || []).reduce((s, r) => s + parseFloat(String(r.total_revenue)), 0);
      const prof = (data || []).reduce((s, r) => s + parseFloat(String(r.total_profit)), 0);
      updateCheck("sales", "ok", "Data jualan boleh diakses", Date.now() - salesStart, {
        totalRevenue: rev,
        totalProfit: prof,
      });
    } catch {
      updateCheck("sales", "error", "Gagal akses rekod jualan");
    }

    // 9. Settings
    const settingsStart = Date.now();
    try {
      const { error } = await authClient.from("billplz_settings").select("api_key").limit(1).single();
      if (error) throw error;
      updateCheck("settings", "ok", "Tetapan admin boleh diakses", Date.now() - settingsStart);
    } catch {
      updateCheck("settings", "error", "Gagal akses tetapan admin");
    }

    // 10. Billplz - real health check (config + edge function reachability)
    const billplzStart = Date.now();
    try {
      const { data, error } = await authClient.from("billplz_settings").select("api_key, collection_id, x_signature_key").limit(1).single();
      if (error) throw error;
      const hasApiKey = data?.api_key?.trim();
      const hasCol = data?.collection_id?.trim();
      const hasSig = data?.x_signature_key?.trim();
      if (!hasApiKey || !hasCol) {
        updateCheck("billplz", "error", `🚨 ${!hasApiKey ? "API Key " : ""}${!hasCol ? "Collection ID " : ""}belum dikonfigurasi - Pembayaran TIDAK BERFUNGSI`, Date.now() - billplzStart);
      } else {
        // Real ping to edge function with intentionally empty body — should return 400 (function alive & configured)
        try {
          const pingRes = await fetch(
            "https://ywjblrnqygowfixxmigw.supabase.co/functions/v1/billplz-create-bill",
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
          );
          const pingData = await pingRes.json().catch(() => ({}));
          if (pingRes.status === 400 && String(pingData?.error || "").toLowerCase().includes("missing")) {
            updateCheck("billplz", "ok", `Billplz aktif ✓ | X-Sig ${hasSig ? "✓" : "⚠️"}`, Date.now() - billplzStart);
          } else if (pingRes.status === 500 && String(pingData?.error || "").toLowerCase().includes("billplz credentials")) {
            updateCheck("billplz", "error", "🚨 Kredential Billplz tidak dimuat - Pembayaran GAGAL", Date.now() - billplzStart);
          } else if (pingRes.status >= 500) {
            updateCheck("billplz", "error", `🚨 Edge function ralat (HTTP ${pingRes.status}) - Pembayaran GAGAL`, Date.now() - billplzStart);
          } else {
            updateCheck("billplz", "warn", `⚠️ Respons tidak dijangka: ${pingRes.status} - ${pingData?.error || "unknown"}`, Date.now() - billplzStart);
          }
        } catch (pingErr: any) {
          updateCheck("billplz", "error", `🚨 Edge function tidak dapat dihubungi: ${pingErr?.message || "network error"}`, Date.now() - billplzStart);
        }
      }
    } catch {
      updateCheck("billplz", "error", "🚨 Gagal semak konfigurasi Billplz - Pembayaran TIDAK BERFUNGSI");
    }

    // 11. Coupons
    const couponStart = Date.now();
    try {
      const { error, count } = await authClient.from("coupons").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("coupons", "ok", `${count ?? 0} kupon dalam sistem`, Date.now() - couponStart);
    } catch {
      updateCheck("coupons", "error", "Gagal akses jadual kupon");
    }

    setLastChecked(new Date());
    setIsRefreshing(false);
  }, [authClient]);

  useEffect(() => {
    const allDone = checks.every((c) => c.status !== "checking");
    if (!allDone) { setOverallStatus("checking"); return; }
    if (checks.some((c) => c.status === "error")) setOverallStatus("error");
    else if (checks.some((c) => c.status === "warn")) setOverallStatus("warn");
    else setOverallStatus("ok");
  }, [checks]);

  useEffect(() => { runChecks(); }, [runChecks]);

  const okCount = checks.filter((c) => c.status === "ok").length;
  const errCount = checks.filter((c) => c.status === "error").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  const renderExtraContent = (check: SystemCheck) => {
    if (!check.extra) return null;

    if (check.id === "customers") {
      return (
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
            <Clock className="h-3 w-3 mx-auto mb-0.5 text-yellow-400" />
            <span className="block text-sm font-bold text-yellow-300">{check.extra.processing}</span>
            <span className="text-[9px] text-yellow-400/70">Process</span>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 text-center">
            <CheckCircle className="h-3 w-3 mx-auto mb-0.5 text-green-400" />
            <span className="block text-sm font-bold text-green-300">{check.extra.completed}</span>
            <span className="text-[9px] text-green-400/70">Selesai</span>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 text-center">
            <XCircle className="h-3 w-3 mx-auto mb-0.5 text-red-400" />
            <span className="block text-sm font-bold text-red-300">{check.extra.cancelled}</span>
            <span className="text-[9px] text-red-400/70">Batal</span>
          </div>
        </div>
      );
    }

    if (check.id === "order-flow") {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-green-500/10 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="h-3 w-3 text-green-400" />
              <span className="text-[10px] text-green-400/80">WhatsApp</span>
            </div>
            <span className="text-sm font-bold text-green-300">{check.extra.whatsappCompleted}/{check.extra.whatsappTotal}</span>
            <span className="text-[9px] text-muted-foreground ml-1">selesai</span>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] text-blue-400/80">BillPlz</span>
            </div>
            <span className="text-sm font-bold text-blue-300">{check.extra.billplzCompleted}/{check.extra.billplzTotal}</span>
            <span className="text-[9px] text-muted-foreground ml-1">selesai</span>
          </div>
        </div>
      );
    }

    if (check.id === "products") {
      return (
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          <div className="bg-green-500/10 rounded-lg p-2 text-center">
            <span className="block text-sm font-bold text-green-300">{check.extra.active}</span>
            <span className="text-[9px] text-green-400/70">Aktif</span>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 text-center">
            <span className="block text-sm font-bold text-red-300">{check.extra.inactive}</span>
            <span className="text-[9px] text-red-400/70">Habis Stok</span>
          </div>
        </div>
      );
    }

    if (check.id === "sales") {
      return (
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          <div className="bg-blue-500/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Wallet className="h-3 w-3 text-blue-400" />
              <span className="text-[9px] text-blue-400/70">Revenue</span>
            </div>
            <span className="text-sm font-bold text-blue-300">{formatCurrency(Number(check.extra.totalRevenue))}</span>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[9px] text-green-400/70">Profit</span>
            </div>
            <span className="text-sm font-bold text-green-300">{formatCurrency(Number(check.extra.totalProfit))}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sistem Monitor</h1>
            <p className="text-muted-foreground text-sm">
              {lastChecked ? `Semakan terakhir: ${lastChecked.toLocaleTimeString("ms-MY")}` : "Memeriksa sistem..."}
            </p>
          </div>
        </div>
        <Button onClick={runChecks} disabled={isRefreshing} variant="outline" className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Memeriksa..." : "Semak Semula"}
        </Button>
      </div>

      {/* Overall Status Banner */}
      <div className={cn(
        "rounded-2xl p-5 border flex items-center gap-4",
        overallStatus === "ok" && "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30",
        overallStatus === "error" && "bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30",
        overallStatus === "warn" && "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30",
        overallStatus === "checking" && "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30"
      )}>
        <div className="h-14 w-14 rounded-full flex items-center justify-center bg-white/10 shrink-0">
          {overallStatus === "ok" && <Wifi className="h-7 w-7 text-green-400" />}
          {overallStatus === "error" && <WifiOff className="h-7 w-7 text-red-400" />}
          {overallStatus === "warn" && <AlertCircle className="h-7 w-7 text-yellow-400" />}
          {overallStatus === "checking" && <RefreshCw className="h-7 w-7 text-blue-400 animate-spin" />}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {overallStatus === "ok" && "✅ Semua Sistem Berfungsi Normal"}
            {overallStatus === "error" && "🚨 Terdapat Ralat Sistem"}
            {overallStatus === "warn" && "⚠️ Beberapa Sistem Perlukan Perhatian"}
            {overallStatus === "checking" && "🔍 Sedang Memeriksa Sistem..."}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {okCount} berfungsi{errCount > 0 && ` · ${errCount} ralat`}{warnCount > 0 && ` · ${warnCount} amaran`} daripada {checks.length} sistem
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/20 text-center">
          <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-green-400">{okCount}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Berfungsi</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-500/20 text-center">
          <AlertCircle className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-yellow-400">{warnCount}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Amaran</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-red-500/15 to-rose-500/10 border border-red-500/20 text-center">
          <XCircle className="h-6 w-6 text-red-400 mx-auto mb-1" />
          <span className="text-2xl font-bold text-red-400">{errCount}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Ralat</p>
        </div>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {checks.map((check) => {
          const Icon = check.icon;
          const isError = check.status === "error";
          const isWarn = check.status === "warn";
          const isChecking = check.status === "checking";
          return (
            <div
              key={check.id}
              className={cn(
                "rounded-lg border bg-card transition-all",
                isError && "border-red-500/40 bg-red-500/5",
                isWarn && "border-yellow-500/40 bg-yellow-500/5",
                !isError && !isWarn && "border-border hover:border-border/80",
                isChecking && "opacity-70"
              )}
            >
              {/* Card Header — neutral */}
              <div className="p-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      isError && "bg-red-500/15 text-red-500",
                      isWarn && "bg-yellow-500/15 text-yellow-600",
                      !isError && !isWarn && "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground text-sm truncate">{check.name}</h3>
                      <p className="text-[10px] text-muted-foreground truncate">{check.description}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {check.status === "ok" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {isError && <XCircle className="h-4 w-4 text-red-500" />}
                    {isWarn && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {isChecking && <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-xs flex-1 truncate",
                    isError && "text-red-500 font-medium",
                    isWarn && "text-yellow-600 font-medium",
                    !isError && !isWarn && "text-muted-foreground"
                  )}>{check.message}</p>
                  {check.responseTime !== undefined && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                    )}>{check.responseTime}ms</span>
                  )}
                </div>

                {/* Response time bar — only show when slow */}
                {check.responseTime !== undefined && check.responseTime >= 500 && (
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        check.responseTime < 1000 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(100, (check.responseTime / 2000) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Extra content for specific cards */}
                {renderExtraContent(check)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-xl p-4 bg-muted/30 border border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Panduan Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /><span>Berfungsi normal</span></div>
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-400" /><span>Perlukan konfigurasi</span></div>
          <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-400" /><span>Ralat / Tidak boleh akses</span></div>
          <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-blue-400" /><span>Sedang memeriksa</span></div>
        </div>
      </div>
    </div>
  );
}
