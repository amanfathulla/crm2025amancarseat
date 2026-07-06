import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Radio, Lock } from "lucide-react";

// ─── Race Dash — public live sales dashboard ────────────────────────────────
// Route: /live-dashboardacs
// Access: password-gated (verified server-side via RPC), 30-day expiry.
// Read-only, no edit/export buttons, mobile-first.

type Material = {
  name: string;
  views: number;
  orders: number;
  sales: number;
  cpv: number;
  roas: number;
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
  materials: Material[];
  as_of: string;
};

const SS_KEY = "acs_race_dash_pw";

const fmtRM = (v: number, digits = 0) =>
  "RM " +
  Number(v || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

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
    setData(r);
  };

  useEffect(() => {
    if (!pw) return;
    load(pw);
    const iv = setInterval(() => load(pw), 30000);
    return () => clearInterval(iv);
  }, [pw]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const spend = data.ads_spend;
    const revenue = data.today_sales;
    const orders = data.today_orders;
    const roas = spend > 0 ? revenue / spend : 0;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const totalViews = data.total_views;
    const ctr = totalViews > 0 ? (orders / totalViews) * 100 : 0;
    const cpc = 0; // clicks not tracked yet
    const cpl = 0; // leads not tracked here
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
          {fmtRM(data?.today_sales ?? 0, 0)}
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
