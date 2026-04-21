import { useMemo, useState } from "react";

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

// Stylized SVG paths for Malaysia (Peninsular + Sabah + Sarawak + Labuan + WP).
// Coordinates are designed for a 1000x520 viewBox. Shapes are simplified
// representations — sufficient for an interactive click-map dashboard.
const STATE_PATHS: { id: string; name: string; d: string; labelX: number; labelY: number }[] = [
  // ── Peninsular Malaysia (left side) ──
  { id: "Perlis", name: "Perlis", d: "M120,90 L155,80 L160,108 L130,115 Z", labelX: 140, labelY: 100 },
  { id: "Kedah", name: "Kedah", d: "M130,115 L180,108 L195,160 L150,175 L125,150 Z", labelX: 158, labelY: 145 },
  { id: "Pulau Pinang", name: "Pulau Pinang", d: "M95,160 L120,150 L125,170 L100,180 Z", labelX: 110, labelY: 168 },
  { id: "Perak", name: "Perak", d: "M125,150 L195,160 L210,240 L160,260 L130,220 Z", labelX: 170, labelY: 210 },
  { id: "Kelantan", name: "Kelantan", d: "M195,160 L255,150 L270,210 L210,225 Z", labelX: 230, labelY: 190 },
  { id: "Terengganu", name: "Terengganu", d: "M255,150 L300,165 L315,240 L270,250 L255,200 Z", labelX: 285, labelY: 205 },
  { id: "Pahang", name: "Pahang", d: "M195,225 L315,240 L320,320 L260,340 L195,310 Z", labelX: 255, labelY: 285 },
  { id: "Selangor", name: "Selangor", d: "M150,260 L210,250 L220,310 L165,320 Z", labelX: 185, labelY: 290 },
  { id: "Kuala Lumpur", name: "Kuala Lumpur", d: "M188,288 L205,285 L208,302 L190,305 Z", labelX: 198, labelY: 296 },
  { id: "Putrajaya", name: "Putrajaya", d: "M195,310 L210,308 L212,320 L197,322 Z", labelX: 204, labelY: 316 },
  { id: "Negeri Sembilan", name: "Negeri Sembilan", d: "M165,320 L260,340 L240,370 L180,365 Z", labelX: 215, labelY: 350 },
  { id: "Melaka", name: "Melaka", d: "M180,365 L240,370 L230,395 L185,390 Z", labelX: 210, labelY: 380 },
  { id: "Johor", name: "Johor", d: "M185,390 L230,395 L290,400 L300,460 L220,475 L175,440 Z", labelX: 240, labelY: 435 },

  // ── East Malaysia (right side) ──
  { id: "Sarawak", name: "Sarawak", d: "M450,290 L620,280 L720,330 L700,400 L520,420 L440,360 Z", labelX: 580, labelY: 355 },
  { id: "Labuan", name: "Labuan", d: "M735,275 L760,272 L763,295 L737,298 Z", labelX: 749, labelY: 286 },
  { id: "Sabah", name: "Sabah", d: "M720,160 L880,170 L920,250 L890,320 L800,330 L740,280 L725,220 Z", labelX: 820, labelY: 240 },
];

function getColorIntensity(count: number, max: number): string {
  if (count === 0) return "hsl(var(--muted))";
  const ratio = max > 0 ? count / max : 0;
  // Blue scale from light to dark
  if (ratio > 0.75) return "hsl(217, 91%, 45%)";
  if (ratio > 0.5) return "hsl(217, 91%, 55%)";
  if (ratio > 0.25) return "hsl(217, 91%, 65%)";
  return "hsl(217, 91%, 78%)";
}

export function MalaysiaMap({ stateStats, selectedState, onSelectState }: MalaysiaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const statsMap = useMemo(() => {
    const m = new Map<string, StateStat>();
    stateStats.forEach((s) => m.set(s.state, s));
    return m;
  }, [stateStats]);

  const maxCount = useMemo(
    () => Math.max(0, ...stateStats.map((s) => s.count)),
    [stateStats]
  );

  const totalCount = useMemo(
    () => stateStats.reduce((sum, s) => sum + s.count, 0),
    [stateStats]
  );

  const totalAmount = useMemo(
    () => stateStats.reduce((sum, s) => sum + s.amount, 0),
    [stateStats]
  );

  const activeState = hovered || selectedState;
  const activeData = activeState ? statsMap.get(activeState) : null;

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Map */}
        <div className="relative rounded-xl border border-border bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
          <svg
            viewBox="0 0 1000 520"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background ocean */}
            <rect width="1000" height="520" fill="transparent" />

            {/* States */}
            {STATE_PATHS.map((stateShape) => {
              const stat = statsMap.get(stateShape.name);
              const count = stat?.count ?? 0;
              const isActive = selectedState === stateShape.name;
              const isHovered = hovered === stateShape.name;
              const fill = getColorIntensity(count, maxCount);

              return (
                <g
                  key={stateShape.id}
                  onMouseEnter={() => setHovered(stateShape.name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectState(stateShape.name)}
                  className="cursor-pointer transition-all"
                  style={{ filter: isActive || isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" : undefined }}
                >
                  <path
                    d={stateShape.d}
                    fill={fill}
                    stroke={isActive ? "hsl(var(--foreground))" : "white"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    opacity={isHovered ? 0.85 : 1}
                    className="transition-all duration-200"
                  />
                  {count > 0 && (
                    <text
                      x={stateShape.labelX}
                      y={stateShape.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none font-bold"
                      fontSize="13"
                      fill="white"
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth="0.5"
                      paintOrder="stroke"
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Region labels */}
            <text x="180" y="40" fontSize="12" fill="hsl(var(--muted-foreground))" fontWeight="600">
              SEMENANJUNG
            </text>
            <text x="700" y="130" fontSize="12" fill="hsl(var(--muted-foreground))" fontWeight="600">
              SABAH &amp; SARAWAK
            </text>
          </svg>

          {/* Color legend */}
          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border shadow-sm">
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Tahap Tempahan</p>
            <div className="flex items-center gap-1">
              <div className="h-3 w-6 rounded-sm" style={{ background: "hsl(var(--muted))" }} />
              <div className="h-3 w-6" style={{ background: "hsl(217, 91%, 78%)" }} />
              <div className="h-3 w-6" style={{ background: "hsl(217, 91%, 65%)" }} />
              <div className="h-3 w-6" style={{ background: "hsl(217, 91%, 55%)" }} />
              <div className="h-3 w-6 rounded-sm" style={{ background: "hsl(217, 91%, 45%)" }} />
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
          <div className="rounded-xl border border-border bg-card p-4 min-h-[140px]">
            <p className="text-xs text-muted-foreground mb-1">
              {activeState ? "Negeri Dipilih" : "Hover atau klik negeri"}
            </p>
            <h3 className="text-lg font-bold text-foreground">
              {activeState || "—"}
            </h3>
            {activeData && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Jumlah Tempahan</span>
                  <span className="text-xl font-bold text-blue-600">{activeData.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Sales</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    RM {activeData.amount.toFixed(2)}
                  </span>
                </div>
                {selectedState === activeState && (
                  <button
                    onClick={() => onSelectState(activeState)}
                    className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Reset filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Jumlah Keseluruhan</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs">Tempahan</span>
                <span className="text-sm font-bold">{totalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Sales</span>
                <span className="text-sm font-bold">RM {totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Top 5 states */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Top 5 Negeri</p>
            <div className="space-y-1.5">
              {[...stateStats]
                .filter((s) => s.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((s, i) => (
                  <button
                    key={s.state}
                    onClick={() => onSelectState(s.state)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-xs hover:bg-muted transition-colors ${
                      selectedState === s.state ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground w-3">{i + 1}.</span>
                      <span className="font-medium truncate">{s.state}</span>
                    </span>
                    <span className="font-bold text-blue-600 shrink-0">{s.count}</span>
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
