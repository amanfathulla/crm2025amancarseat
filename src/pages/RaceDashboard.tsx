import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio, Lock, Volume2, VolumeX, ShoppingCart } from "lucide-react";

// ─── Race Dash — public live sales dashboard ────────────────────────────────
// Route: /live-dashboardacs
// Access: password-gated (verified server-side via RPC), 30-day expiry.
// Audience: admin + staff only (shared password) — safe to show real customer names.
// Read-only, no edit/export buttons, mobile-first.

type Material = {
  name: string;
  views: number;
  orders: number;
  sales: number;
  cpv: number;
  roas: number;
  clicks?: number; // requires RPC extension: material_clicks table
  cpc?: number; // requires RPC extension
};

type RecentOrder = {
  id: string;
  customer_name: string;
  product: string;
  product_variation?: string | null;
  price: number;
  created_at: string;
};

type DashData = {
  ok: boolean;
  reason?: string;
  hide_sensitive_costs: boolean;
  today_sales: number;
  today_orders: number;
  yesterday_sales: number;
  ads_spend: number;
  total_views: number;
  total_clicks?: number; // requires RPC extension
  materials: Material[];
  recent_orders?: RecentOrder[]; // requires RPC extension
  as_of: string;
};

const SS_KEY = "acs_race_dash_pw";
const MUTE_KEY = "acs_race_dash_muted";

const fmtRM = (v: number, digits = 0) =>
  "RM " +
  Number(v || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

// ─── Count-up hook — animates a number smoothly whenever `value` changes ────
function useCountUp(value: number, durationMs = 1000) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current!);

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [value, durationMs]);

  return display;
}

// ─── Relative time label ("5 saat lalu") ────────────────────────────────────
function relTime(iso: string) {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec} saat lalu`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} minit lalu`;
  const hr = Math.floor(min / 60);
  return `${hr} jam lalu`;
}

// ─── Circular gauge (SVG) ───────────────────────────────────────────────────
function Gauge({
  value,
  max,
  label,
  display,
  accent,
  unavailable,
}: {
  value: number;
  max: number;
  label: string;
  display: string;
  accent: string;
  unavailable?: boolean;
}) {
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Show 240° arc (from -120° to +120°)
  const arcFrac = 240 / 360;
  const dashArc = c * arcFrac;
  const clamped = Math.min(Math.max(value / max, 0), 1);
  const dashProg = unavailable ? 0 : dashArc * clamped;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[210deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#262A31"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dashArc} ${c}`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dashProg} ${c}`}
            style={{
              transition: "stroke-dasharray 0.8s ease-out",
              filter: `drop-shadow(0 0 6px ${accent}88)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-2xl font-black"
            style={{ color: unavailable ? "#7A8088" : accent, fontFamily: "Oswald, sans-serif" }}
          >
            {display}
          </div>
        </div>
      </div>
      <div
        className="mt-1 text-[11px] tracking-[0.25em] uppercase"
        style={{ color: "#7A8088", fontFamily: "Rajdhani, sans-serif" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Live order toast popup ─────────────────────────────────────────────────
type Toast = { key: string; order: RecentOrder };

function OrderToast({ toast, onDone }: { toast: Toast; onDone: (key: string) => void }) {
  const [, force] = useState(0);

  useEffect(() => {
    const dismiss = setTimeout(() => onDone(toast.key), 6000);
    const tick = setInterval(() => force((n) => n + 1), 1000); // refresh relative time
    return () => {
      clearTimeout(dismiss);
      clearInterval(tick);
    };
  }, [toast.key, onDone]);

  return (
    <div
      className="w-72 rounded-xl border p-3 shadow-lg animate-in slide-in-from-right"
      style={{
        background: "#15181D",
        borderColor: "#FF7A1A55",
        boxShadow: "0 4px 24px rgba(255,122,26,0.25)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <ShoppingCart className="h-3.5 w-3.5" style={{ color: "#FF7A1A" }} />
        <span
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "#FF7A1A" }}
        >
          Order baru masuk
        </span>
      </div>
      <div className="text-sm font-bold" style={{ color: "#F2F2F0" }}>
        {toast.order.customer_name} beli {toast.order.product}
        {toast.order.product_variation ? ` — ${toast.order.product_variation}` : ""}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-base font-black" style={{ color: "#00C2A8", fontFamily: "Oswald, sans-serif" }}>
          {fmtRM(toast.order.price, 2)}
        </span>
        <span className="text-[11px]" style={{ color: "#7A8088" }}>
          {relTime(toast.order.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Password gate ──────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { data, error } = await (supabase.rpc as any)(
      "verify_public_dashboard_password",
      { p_password: pw },
    );
    setBusy(false);
    if (error) {
      setErr("Ralat sambungan. Cuba lagi.");
      return;
    }
    const res = data as any;
    if (res?.ok) {
      sessionStorage.setItem(SS_KEY, pw);
      onUnlock(pw);
      return;
    }
    if (res?.reason === "expired") {
      setErr("Password telah tamat tempoh, sila hubungi admin untuk password baru.");
    } else if (res?.reason === "not_configured") {
      setErr("Password belum diset oleh admin.");
    } else {
      setErr("Password salah.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at top, #1A1D22 0%, #0E1013 100%)",
        color: "#F2F2F0",
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border p-6 space-y-5"
        style={{ background: "#15181D", borderColor: "#262A31" }}
      >
        <div className="flex items-center gap-2 text-[#FF7A1A]">
          <Lock className="h-5 w-5" />
          <span
            className="text-xs tracking-[0.3em] uppercase font-bold"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Race Dash · Akses Terhad
          </span>
        </div>
        <div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            AmanCarSeat
          </h1>
          <p className="text-sm text-[#7A8088]">Public Live Sales Dashboard</p>
        </div>
        <div className="space-y-1">
          <label
            className="text-[11px] tracking-widest uppercase text-[#7A8088]"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Password
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            className="w-full rounded-lg px-3 py-2.5 text-base bg-[#0E1013] border outline-none transition"
            style={{
              borderColor: "#262A31",
              color: "#F2F2F0",
              fontFamily: "Rajdhani, sans-serif",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#FF7A1A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#262A31")}
          />
        </div>
        {err && (
          <div className="text-xs rounded-lg px-3 py-2 bg-[#3a0f0f] border border-[#5c1a1a] text-[#ff9999]">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !pw}
          className="w-full rounded-lg py-2.5 font-bold tracking-wide text-black disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FFD9A8, #FF7A1A)",
            fontFamily: "Rajdhani, sans-serif",
            boxShadow: "0 0 20px #FF7A1A55",
          }}
        >
          {busy ? "Menyemak…" : "MASUK"}
        </button>
      </form>
    </div>
  );
}

// ─── Main dashboard ─────────────────────────────────────────────────────────
export default function RaceDashboard() {
  const [pw, setPw] = useState<string | null>(() => sessionStorage.getItem(SS_KEY));
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  const [muted, setMuted] = useState(() => sessionStorage.getItem(MUTE_KEY) === "1");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenOrderIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const firstLoad = useRef(true);

  const dismissToast = (key: string) =>
    setToasts((prev) => prev.filter((t) => t.key !== key));

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      sessionStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const load = async (password: string) => {
    setLoading(true);
    const { data: res, error } = await (supabase.rpc as any)("get_public_race_dash", {
      p_password: password,
    });
    setLoading(false);
    if (error) return;
    const r = res as DashData;
    if (!r?.ok) {
      if (r?.reason === "expired" || r?.reason === "invalid") {
        sessionStorage.removeItem(SS_KEY);
        setPw(null);
        setExpired(r?.reason === "expired");
      }
      return;
    }

    // Detect new orders since last poll → trigger popup + sound
    const recent = r.recent_orders ?? [];
    if (firstLoad.current) {
      // Don't fire popups for orders that already existed before the dashboard was opened
      recent.forEach((o) => seenOrderIds.current.add(o.id));
      firstLoad.current = false;
    } else {
      const fresh = recent.filter((o) => !seenOrderIds.current.has(o.id));
      if (fresh.length > 0) {
        fresh.forEach((o) => seenOrderIds.current.add(o.id));
        setToasts((prev) => [
          ...fresh.map((o) => ({ key: `${o.id}-${Date.now()}`, order: o })),
          ...prev,
        ].slice(0, 3));
        if (!muted) {
          audioRef.current?.play().catch(() => {
            /* autoplay blocked until first user interaction — expected on first load */
          });
        }
      }
    }

    setData(r);
  };

  useEffect(() => {
    if (!pw) return;
    load(pw);
    const iv = setInterval(() => load(pw), 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pw, muted]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const spend = data.ads_spend;
    const revenue = data.today_sales;
    const orders = data.today_orders;
    const roas = spend > 0 ? revenue / spend : 0;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const totalViews = data.total_views;
    const ctr = totalViews > 0 ? (orders / totalViews) * 100 : 0;
    const totalClicks = data.total_clicks ?? 0;
    const cpc = totalClicks > 0 ? spend / totalClicks : 0; // requires RPC extension (material_clicks)
    const cpl = 0; // leads not tracked yet — per Aman: "lead tu nanti dulu"
    const cpo = orders > 0 ? spend / orders : 0;
    const pctVsY =
      data.yesterday_sales > 0
        ? ((revenue - data.yesterday_sales) / data.yesterday_sales) * 100
        : revenue > 0
          ? 100
          : 0;
    return {
      roas,
      roi,
      ctr,
      cpc,
      cpl,
      cpo,
      pctVsY,
      spend,
      orders,
      totalViews,
      noOrders: orders === 0,
      noAds: spend === 0,
    };
  }, [data]);

  if (!pw) {
    return (
      <>
        {expired && (
          <div
            style={{
              position: "fixed",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
              background: "#3a0f0f",
              border: "1px solid #5c1a1a",
              color: "#ff9999",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            Password telah tamat tempoh.
          </div>
        )}
        <PasswordGate
          onUnlock={(p) => {
            setPw(p);
            setExpired(false);
          }}
        />
      </>
    );
  }

  const hideCosts = data?.hide_sensitive_costs ?? false;
  const animatedSales = useCountUp(data?.today_sales ?? 0, 1200);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "radial-gradient(ellipse at top, #1A1D22 0%, #0E1013 100%)",
        color: "#F2F2F0",
        fontFamily: "Rajdhani, sans-serif",
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap"
      />

      {/* Sound + toast layer */}
      <audio ref={audioRef} src="/sounds/kaching.mp3" preload="auto" />
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <OrderToast key={t.key} toast={t} onDone={dismissToast} />
        ))}
      </div>
      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-40 rounded-full p-2.5 border"
        style={{ background: "#15181D", borderColor: "#262A31", color: "#7A8088" }}
        aria-label={muted ? "Hidupkan bunyi" : "Senyapkan bunyi"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* HERO */}
      <section
        className="px-4 pt-6 pb-8"
        style={{
          background: "linear-gradient(180deg, #1E140B 0%, #0E1013 100%)",
          borderBottom: "1px solid #262A31",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span
            className="text-[11px] font-bold tracking-[0.3em] uppercase"
            style={{ color: "#FF7A1A" }}
          >
            Live · Jualan Hari Ini
          </span>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-[#7A8088]" />}
        </div>

        <div
          className="font-black leading-none"
          style={{
            fontFamily: "Oswald, sans-serif",
            fontSize: "clamp(3.2rem, 14vw, 5.5rem)",
            background: "linear-gradient(180deg, #FFD9A8 0%, #FF7A1A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 22px rgba(255,122,26,0.55))",
            letterSpacing: "-0.02em",
          }}
        >
          {fmtRM(animatedSales, 0)}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
            style={{
              background: "rgba(0,194,168,0.15)",
              color: "#00C2A8",
              border: "1px solid rgba(0,194,168,0.35)",
            }}
          >
            {(metrics?.pctVsY ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(metrics?.pctVsY ?? 0).toFixed(0)}%
            <span className="opacity-70 font-medium">dari semalam</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: "rgba(236,72,153,0.15)",
              color: "#f472b6",
              border: "1px solid rgba(236,72,153,0.35)",
            }}
          >
            🛒 {data?.today_orders ?? 0} order baru
          </div>
        </div>
      </section>

      {/* GAUGE CLUSTER */}
      <section className="px-4 pt-6">
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#15181D", borderColor: "#262A31" }}
        >
          <div
            className="text-[11px] tracking-[0.3em] uppercase mb-4"
            style={{ color: "#7A8088" }}
          >
            Performance Cluster
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Gauge
              label="ROAS"
              value={Math.min(metrics?.roas ?? 0, 5)}
              max={5}
              display={
                metrics?.noOrders || metrics?.noAds
                  ? "—"
                  : `${(metrics?.roas ?? 0).toFixed(2)}x`
              }
              accent="#FF7A1A"
              unavailable={metrics?.noOrders || metrics?.noAds}
            />
            <Gauge
              label="ROI"
              value={Math.max(Math.min(((metrics?.roi ?? 0) + 100) / 200, 1) * 100, 0)}
              max={100}
              display={
                metrics?.noOrders || metrics?.noAds
                  ? "N/A"
                  : `${(metrics?.roi ?? 0) >= 0 ? "+" : ""}${(metrics?.roi ?? 0).toFixed(0)}%`
              }
              accent="#00C2A8"
              unavailable={metrics?.noOrders || metrics?.noAds}
            />
            <Gauge
              label="CTR"
              value={Math.min(metrics?.ctr ?? 0, 20)}
              max={20}
              display={`${(metrics?.ctr ?? 0).toFixed(1)}%`}
              accent="#FFD23F"
            />
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      {!hideCosts && (
        <section className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Belanja Iklan" value={fmtRM(metrics?.spend ?? 0, 0)} />
            <StatCard
              label="Cost / Order"
              value={
                metrics?.noOrders
                  ? "—"
                  : fmtRM(metrics?.cpo ?? 0, 2)
              }
            />
            <StatCard label="CPC" value={metrics?.cpc ? fmtRM(metrics?.cpc, 2) : "—"} />
            <StatCard label="CPL" value={metrics?.cpl ? fmtRM(metrics?.cpl, 2) : "—"} />
          </div>
        </section>
      )}

      {/* MATERIAL TELEMETRY */}
      <section className="px-4 pt-4 pb-8">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#15181D", borderColor: "#262A31" }}
        >
          <div
            className="px-4 pt-4 pb-3 text-[11px] tracking-[0.3em] uppercase"
            style={{ color: "#7A8088" }}
          >
            Material Telemetri · Hari Ini
          </div>
          {(data?.materials ?? []).length === 0 ? (
            <div className="px-4 pb-4 text-sm text-[#7A8088]">Tiada data.</div>
          ) : (
            <div>
              {(data?.materials ?? []).map((m, i) => (
                <div
                  key={m.name}
                  className="px-4 py-3 grid grid-cols-[1fr_auto] gap-3 items-center"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid #20242A",
                  }}
                >
                  <div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: "#F2F2F0", fontFamily: "Oswald, sans-serif" }}
                    >
                      {m.name}
                    </div>
                    <div className="text-[11px] text-[#7A8088] mt-0.5">
                      {m.views} view · {m.orders} order
                      {!hideCosts && ` · CPV ${fmtRM(m.cpv, 2)}`}
                      {!hideCosts && m.clicks !== undefined && ` · CPC ${m.cpc ? fmtRM(m.cpc, 2) : "—"}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-black"
                      style={{
                        color: m.roas >= 1 ? "#00C2A8" : m.roas > 0 ? "#FFD23F" : "#7A8088",
                        fontFamily: "Oswald, sans-serif",
                      }}
                    >
                      {m.roas > 0 ? `${m.roas.toFixed(2)}x` : "—"}
                    </div>
                    <div className="text-[10px] tracking-widest uppercase text-[#7A8088]">
                      ROAS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORDER TERKINI */}
        {(data?.recent_orders?.length ?? 0) > 0 && (
          <div
            className="mt-4 rounded-2xl border overflow-hidden"
            style={{ background: "#15181D", borderColor: "#262A31" }}
          >
            <div
              className="px-4 pt-4 pb-3 flex items-center justify-between"
              style={{ color: "#7A8088" }}
            >
              <span className="text-[11px] tracking-[0.3em] uppercase">Order Terkini</span>
              <span className="flex items-center gap-1 text-[10px] text-[#FF7A1A]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A1A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF7A1A]" />
                </span>
                LIVE
              </span>
            </div>
            <div>
              {data!.recent_orders!.slice(0, 10).map((o, i) => {
                const isFresh = Date.now() - new Date(o.created_at).getTime() < 15000;
                return (
                  <div
                    key={o.id}
                    className="px-4 py-3 grid grid-cols-[auto_1fr_auto] gap-3 items-center transition-colors duration-[2000ms]"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #20242A",
                      background: isFresh ? "rgba(255,122,26,0.12)" : "transparent",
                    }}
                  >
                    <span className="text-[10px] text-[#7A8088] w-14">{relTime(o.created_at)}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: "#F2F2F0" }}>
                        {o.customer_name}
                      </div>
                      <div className="text-[11px] text-[#7A8088] truncate">
                        {o.product}
                        {o.product_variation ? ` · ${o.product_variation}` : ""}
                      </div>
                    </div>
                    <div
                      className="text-sm font-black"
                      style={{ color: "#00C2A8", fontFamily: "Oswald, sans-serif" }}
                    >
                      {fmtRM(o.price, 2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-[10px] tracking-[0.3em] uppercase text-[#7A8088] flex items-center justify-center gap-1.5">
          <Radio className="h-3 w-3" />
          Auto-refresh setiap 30s
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "#15181D", borderColor: "#262A31" }}
    >
      <div
        className="text-[10px] tracking-[0.3em] uppercase mb-1"
        style={{ color: "#7A8088" }}
      >
        {label}
      </div>
      <div
        className="text-xl font-black"
        style={{ color: "#F2F2F0", fontFamily: "Oswald, sans-serif" }}
      >
        {value}
      </div>
    </div>
  );
}
