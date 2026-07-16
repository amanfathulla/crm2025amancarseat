import { useMemo, useState } from "react";
import { STATES } from "krackedmaps/data";

interface StateStat {
  state: string;
  count: number;
  amount: number;
}

interface MalaysiaMapProps {
  stateStats: StateStat[];
  selectedState: string | null;
  onSelectState: (state: string) => void;
}

// Supabase `customers.state` (malaysianStates) -> krackedmaps `slug`
const STATE_NAME_TO_SLUG: Record<string, string> = {
  "Perlis": "perlis",
  "Kedah": "kedah",
  "Pulau Pinang": "penang",
  "Penang": "penang",
  "Perak": "perak",
  "Selangor": "selangor",
  "Kuala Lumpur": "kuala-lumpur",
  "Wilayah Persekutuan": "kuala-lumpur",
  "Putrajaya": "putrajaya",
  "Negeri Sembilan": "negeri-sembilan",
  "Melaka": "melaka",
  "Malacca": "melaka",
  "Johor": "johor",
  "Pahang": "pahang",
  "Terengganu": "terengganu",
  "Kelantan": "kelantan",
  "Sabah": "sabah",
  "Sarawak": "sarawak",
  "Labuan": "labuan",
};

const SLUG_TO_DISPLAY: Record<string, string> = {
  "perlis": "Perlis",
  "kedah": "Kedah",
  "penang": "Pulau Pinang",
  "perak": "Perak",
  "selangor": "Selangor",
  "kuala-lumpur": "Wilayah Persekutuan",
  "putrajaya": "Putrajaya",
  "negeri-sembilan": "Negeri Sembilan",
  "melaka": "Melaka",
  "johor": "Johor",
  "pahang": "Pahang",
  "terengganu": "Terengganu",
  "kelantan": "Kelantan",
  "sabah": "Sabah",
  "sarawak": "Sarawak",
  "labuan": "Labuan",
};

// ACS palette: dark base -> red -> gold for top performer
function colorForRatio(t: number) {
  if (t <= 0) return "#2C2C2A";
  if (t < 0.25) return "#4A1B0C";
  if (t < 0.5) return "#712B13";
  if (t < 0.75) return "#993C1D";
  if (t < 0.95) return "#C8203C";
  return "#CFA227";
}

export function MalaysiaMap({ stateStats, selectedState, onSelectState }: MalaysiaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // slug -> customers state name (for select callback)
  const slugToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const [name, slug] of Object.entries(STATE_NAME_TO_SLUG)) {
      if (!m.has(slug)) m.set(slug, name);
    }
    return m;
  }, []);

  const countsBySlug = useMemo(() => {
    const tally: Record<string, { count: number; amount: number }> = {};
    for (const s of stateStats) {
      const slug = STATE_NAME_TO_SLUG[s.state?.trim()];
      if (!slug) continue;
      if (!tally[slug]) tally[slug] = { count: 0, amount: 0 };
      tally[slug].count += s.count;
      tally[slug].amount += s.amount;
    }
    return tally;
  }, [stateStats]);

  const projectedStates = useMemo(
    () =>
      STATES.map((f) => {
        const data = countsBySlug[f.slug];
        return {
          slug: f.slug as string,
          name: SLUG_TO_DISPLAY[f.slug] ?? f.name,
          d: f.d as string,
          count: data?.count ?? 0,
          amount: data?.amount ?? 0,
        };
      }),
    [countsBySlug]
  );

  const maxCount = Math.max(1, ...projectedStates.map((s) => s.count));
  const totalCount = projectedStates.reduce((sum, s) => sum + s.count, 0);
  const totalAmount = projectedStates.reduce((sum, s) => sum + s.amount, 0);

  // Resolve which slug is currently selected
  const selectedSlug = useMemo(() => {
    if (!selectedState) return null;
    if (STATE_NAME_TO_SLUG[selectedState]) return STATE_NAME_TO_SLUG[selectedState];
    return projectedStates.find((s) => s.slug === selectedState || s.name === selectedState)?.slug ?? null;
  }, [selectedState, projectedStates]);

  const activeState = hovered ?? selectedSlug;
  const activeData = activeState ? projectedStates.find((s) => s.slug === activeState) : null;

  const selectState = (slug: string) => onSelectState(slugToName.get(slug) ?? activeData?.name ?? slug);

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Map */}
        <div
          className="relative rounded-xl border border-border overflow-hidden"
          style={{ background: "#0C0E11" }}
        >
          <svg
            viewBox="0 0 799.85 352.74"
            className="w-full h-auto"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Peta jumlah tempahan ikut negeri</title>
            {projectedStates.map((s) => {
              const ratio = s.count / maxCount;
              const h = 3 + ratio * 14;
              const isSelected = selectedSlug === s.slug;
              const isHovered = hovered === s.slug;
              return (
                <g
                  key={s.slug}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(s.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => selectState(s.slug)}
                >
                  <path
                    d={s.d}
                    fill="#000000"
                    opacity={0.35}
                    transform={`translate(${h * 1.4},${h * 1.4})`}
                  />
                  <path
                    d={s.d}
                    fill={colorForRatio(ratio)}
                    stroke={isSelected || isHovered ? "#CFA227" : "#0C0E11"}
                    strokeWidth={isSelected || isHovered ? 1.6 : 0.6}
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div
            className="absolute bottom-3 left-3 rounded-lg px-3 py-2 border border-border shadow-sm"
            style={{ background: "#15181D", borderColor: "#3C3489" }}
          >
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Tahap Tempahan</p>
            <div className="flex items-center gap-1">
              <div className="h-3 w-6 rounded-sm" style={{ background: "#2C2C2A" }} />
              <div className="h-3 w-6" style={{ background: "#712B13" }} />
              <div className="h-3 w-6" style={{ background: "#993C1D" }} />
              <div className="h-3 w-6" style={{ background: "#C8203C" }} />
              <div className="h-3 w-6 rounded-sm" style={{ background: "#CFA227" }} />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>0</span>
              <span>{maxCount}</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Active state info */}
          <div
            className="rounded-xl border p-4 min-h-[140px]"
            style={{ background: "#15181D", borderColor: "#3C3489" }}
          >
            <p className="text-xs text-muted-foreground mb-1">
              {activeState ? "Negeri Dipilih" : "Hover atau klik negeri"}
            </p>
            <h3 className="text-lg font-bold" style={{ color: "#F1EFE8" }}>
              {activeData ? activeData.name : "—"}
            </h3>
            {activeData && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Jumlah Tempahan</span>
                  <span className="text-xl font-bold" style={{ color: "#CFA227" }}>
                    {activeData.count}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Sales</span>
                  <span className="text-sm font-semibold" style={{ color: "#CFA227" }}>
                    RM {activeData.amount.toFixed(2)}
                  </span>
                </div>
                {selectedSlug === activeState && (
                  <button
                    onClick={() => selectState(activeState)}
                    className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#15181D", borderColor: "#3C3489" }}
          >
            <p className="text-xs text-muted-foreground mb-2">Jumlah Keseluruhan</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs">Tempahan</span>
                <span className="text-sm font-bold" style={{ color: "#F1EFE8" }}>
                  {totalCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Sales</span>
                <span className="text-sm font-bold" style={{ color: "#CFA227" }}>
                  RM {totalAmount.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Top 5 states */}
          <div
            className="rounded-xl border p-4"
            style={{ background: "#15181D", borderColor: "#3C3489" }}
          >
            <p className="text-xs text-muted-foreground mb-2">Top 5 Negeri</p>
            <div className="space-y-1.5">
              {[...projectedStates]
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((s, i) => (
                  <button
                    key={s.slug}
                    onClick={() => selectState(s.slug)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs transition-colors ${
                      selectedSlug === s.slug ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground w-3">{i + 1}.</span>
                      <span className="font-medium truncate" style={{ color: "#F1EFE8" }}>
                        {s.name}
                      </span>
                    </span>
                    <span className="font-bold shrink-0" style={{ color: "#CFA227" }}>
                      {s.count}
                    </span>
                  </button>
                ))}
              {totalCount === 0 && (
                <p className="text-xs text-muted-foreground italic">Tiada data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
