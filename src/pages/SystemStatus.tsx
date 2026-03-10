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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type StatusType = "ok" | "error" | "checking" | "warn";

interface SystemCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: StatusType;
  message: string;
  responseTime?: number;
}

const INITIAL_CHECKS: Omit<SystemCheck, "status" | "message" | "responseTime">[] = [
  {
    id: "database",
    name: "Database Supabase",
    description: "Sambungan utama ke pangkalan data",
    icon: Activity,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Data jualan & statistik pelanggan",
    icon: LayoutDashboard,
  },
  {
    id: "customers",
    name: "Customers",
    description: "Rekod & status pesanan pelanggan",
    icon: Users,
  },
  {
    id: "leads",
    name: "Lead Management",
    description: "Pengurusan prospek & leads",
    icon: Target,
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Nota & tugas pemasaran",
    icon: Megaphone,
  },
  {
    id: "products",
    name: "Products",
    description: "Katalog produk & variasi",
    icon: Package,
  },
  {
    id: "sales",
    name: "Sales Records",
    description: "Data rekod jualan tahunan",
    icon: BarChart3,
  },
  {
    id: "settings",
    name: "Settings (Admin)",
    description: "Tetapan admin & konfigurasi",
    icon: Settings,
  },
  {
    id: "billplz",
    name: "Billplz Payment",
    description: "Konfigurasi & kelayakan Billplz",
    icon: CreditCard,
  },
  {
    id: "coupons",
    name: "Sistem Kupon",
    description: "Urus kod diskaun pelanggan",
    icon: Activity,
  },
];

export default function SystemStatus() {
  const { authClient } = useAuth();
  const [checks, setChecks] = useState<SystemCheck[]>(
    INITIAL_CHECKS.map((c) => ({ ...c, status: "checking", message: "Memeriksa..." }))
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overallStatus, setOverallStatus] = useState<StatusType>("checking");

  const updateCheck = (id: string, status: StatusType, message: string, responseTime?: number) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, message, responseTime } : c))
    );
  };

  const runChecks = useCallback(async () => {
    setIsRefreshing(true);
    setChecks((prev) => prev.map((c) => ({ ...c, status: "checking", message: "Memeriksa..." })));

    // 1. Database connectivity
    const dbStart = Date.now();
    try {
      const { error } = await authClient.from("customers").select("id").limit(1);
      if (error) throw error;
      updateCheck("database", "ok", "Sambungan berjaya", Date.now() - dbStart);
    } catch {
      updateCheck("database", "error", "Gagal sambung ke database");
    }

    // 2. Dashboard data (customers + yearly_sales)
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

    // 3. Customers table
    const custStart = Date.now();
    try {
      const { error, count } = await authClient.from("customers").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("customers", "ok", `${count ?? 0} rekod pelanggan`, Date.now() - custStart);
    } catch {
      updateCheck("customers", "error", "Gagal akses jadual customers");
    }

    // 4. Leads table
    const leadsStart = Date.now();
    try {
      const { error, count } = await authClient.from("leads").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("leads", "ok", `${count ?? 0} leads ditemui`, Date.now() - leadsStart);
    } catch {
      updateCheck("leads", "error", "Gagal akses jadual leads");
    }

    // 5. Marketing
    const mktStart = Date.now();
    try {
      const { error } = await authClient.from("marketing_content").select("id").limit(1);
      if (error) throw error;
      updateCheck("marketing", "ok", "Modul pemasaran berfungsi", Date.now() - mktStart);
    } catch {
      updateCheck("marketing", "error", "Gagal akses data pemasaran");
    }

    // 6. Products
    const prodStart = Date.now();
    try {
      const { error, count } = await authClient.from("products").select("id", { count: "exact", head: true });
      if (error) throw error;
      updateCheck("products", "ok", `${count ?? 0} produk aktif`, Date.now() - prodStart);
    } catch {
      updateCheck("products", "error", "Gagal akses jadual produk");
    }

    // 7. Sales records
    const salesStart = Date.now();
    try {
      const { error } = await authClient.from("yearly_sales").select("id").limit(1);
      if (error) throw error;
      updateCheck("sales", "ok", "Data jualan boleh diakses", Date.now() - salesStart);
    } catch {
      updateCheck("sales", "error", "Gagal akses rekod jualan");
    }

    // 8. Settings (billplz_settings)
    const settingsStart = Date.now();
    try {
      const { data, error } = await authClient
        .from("billplz_settings")
        .select("api_key, collection_id, x_signature_key")
        .limit(1)
        .single();
      if (error) throw error;
      updateCheck("settings", "ok", "Tetapan admin boleh diakses", Date.now() - settingsStart);
    } catch {
      updateCheck("settings", "error", "Gagal akses tetapan admin");
    }

    // 9. Billplz configuration
    const billplzStart = Date.now();
    try {
      const { data, error } = await authClient
        .from("billplz_settings")
        .select("api_key, collection_id, x_signature_key")
        .limit(1)
        .single();
      if (error) throw error;
      const hasApiKey = data?.api_key && data.api_key.trim() !== "";
      const hasCollectionId = data?.collection_id && data.collection_id.trim() !== "";
      const hasXSig = data?.x_signature_key && data.x_signature_key.trim() !== "";

      if (!hasApiKey || !hasCollectionId) {
        updateCheck(
          "billplz",
          "warn",
          `⚠️ ${!hasApiKey ? "API Key " : ""}${!hasCollectionId ? "Collection ID " : ""}${!hasXSig ? "X-Signature " : ""}belum dikonfigurasi`,
          Date.now() - billplzStart
        );
      } else {
        updateCheck("billplz", "ok", `API Key ✓ | Collection ID ✓ | X-Sig ${hasXSig ? "✓" : "⚠️"}`, Date.now() - billplzStart);
      }
    } catch {
      updateCheck("billplz", "error", "Gagal semak konfigurasi Billplz");
    }

    // 10. Coupons
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

  // Compute overall status when checks update
  useEffect(() => {
    const allDone = checks.every((c) => c.status !== "checking");
    if (!allDone) {
      setOverallStatus("checking");
      return;
    }
    if (checks.some((c) => c.status === "error")) {
      setOverallStatus("error");
    } else if (checks.some((c) => c.status === "warn")) {
      setOverallStatus("warn");
    } else {
      setOverallStatus("ok");
    }
  }, [checks]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const statusIcon = {
    ok: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    warn: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    checking: <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />,
  };

  const statusBadge = {
    ok: "bg-green-500/20 text-green-300 border-green-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    warn: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    checking: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };

  const statusLabel = {
    ok: "Berfungsi",
    error: "Ralat",
    warn: "Amaran",
    checking: "Memeriksa...",
  };

  const okCount = checks.filter((c) => c.status === "ok").length;
  const errCount = checks.filter((c) => c.status === "error").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <section className="animate-slide-up">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sistem Monitor</h1>
              <p className="text-muted-foreground text-sm">
                {lastChecked
                  ? `Semakan terakhir: ${lastChecked.toLocaleTimeString("ms-MY")}`
                  : "Memeriksa sistem..."}
              </p>
            </div>
          </div>
          <Button
            onClick={runChecks}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Memeriksa..." : "Semak Semula"}
          </Button>
        </div>
      </section>

      {/* Overall Status Banner */}
      <div
        className={cn(
          "rounded-2xl p-5 border flex items-center gap-4 transition-all",
          overallStatus === "ok" && "bg-green-500/10 border-green-500/30",
          overallStatus === "error" && "bg-red-500/10 border-red-500/30",
          overallStatus === "warn" && "bg-yellow-500/10 border-yellow-500/30",
          overallStatus === "checking" && "bg-blue-500/10 border-blue-500/30"
        )}
      >
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
            {okCount} berfungsi
            {errCount > 0 && ` · ${errCount} ralat`}
            {warnCount > 0 && ` · ${warnCount} amaran`}
            {" "} daripada {checks.length} sistem
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-green-400">{okCount}</span>
          <p className="text-xs text-muted-foreground mt-1">Berfungsi</p>
        </div>
        <div className="rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/20 text-center">
          <AlertCircle className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-yellow-400">{warnCount}</span>
          <p className="text-xs text-muted-foreground mt-1">Amaran</p>
        </div>
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-center">
          <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
          <span className="text-2xl font-bold text-red-400">{errCount}</span>
          <p className="text-xs text-muted-foreground mt-1">Ralat</p>
        </div>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <div
              key={check.id}
              className={cn(
                "rounded-xl p-4 border transition-all",
                check.status === "ok" && "bg-card border-border hover:border-green-500/30",
                check.status === "error" && "bg-red-500/5 border-red-500/30",
                check.status === "warn" && "bg-yellow-500/5 border-yellow-500/30",
                check.status === "checking" && "bg-card border-border opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      check.status === "ok" && "bg-green-500/15",
                      check.status === "error" && "bg-red-500/15",
                      check.status === "warn" && "bg-yellow-500/15",
                      check.status === "checking" && "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        check.status === "ok" && "text-green-400",
                        check.status === "error" && "text-red-400",
                        check.status === "warn" && "text-yellow-400",
                        check.status === "checking" && "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{check.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{check.description}</p>
                  </div>
                </div>
                {statusIcon[check.status]}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground flex-1 truncate">{check.message}</p>
                <div
                  className={cn(
                    "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                    statusBadge[check.status]
                  )}
                >
                  {statusLabel[check.status]}
                </div>
              </div>

              {check.responseTime !== undefined && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        check.responseTime < 500 ? "bg-green-500" : check.responseTime < 1000 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(100, (check.responseTime / 2000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{check.responseTime}ms</span>
                </div>
              )}
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
