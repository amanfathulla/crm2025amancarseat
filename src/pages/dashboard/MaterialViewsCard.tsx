import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Range = "today" | "yesterday" | "7d" | "30d";

const RANGE_LABELS: Record<Range, string> = {
  today: "Hari Ini",
  yesterday: "Semalam",
  "7d": "7 Hari",
  "30d": "30 Hari",
};

function getRangeBounds(range: Range): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return { start, end };
}

export function MaterialViewsCard() {
  const { authClient } = useAuth();
  const [range, setRange] = useState<Range>("today");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const { start, end } = getRangeBounds(range);
    authClient
      .from("page_views" as any)
      .select("material")
      .gte("viewed_at", start.toISOString())
      .lte("viewed_at", end.toISOString())
      .limit(10000)
      .then(({ data }) => {
        if (!active) return;
        const map: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          map[r.material] = (map[r.material] || 0) + 1;
        });
        setCounts(map);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, authClient]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const materials = ["Kain Mesh", "Kain Nylon", "Kain Fullsilk", "Semi Leather Kalis Air"];
  const max = Math.max(1, ...materials.map((m) => counts[m] || 0));

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">View Pages Material</h3>
            <p className="text-xs text-muted-foreground">Berapa orang masuk link material</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-[10px] text-muted-foreground">jumlah view</p>
        </div>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList className="grid grid-cols-4 w-full">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <TabsTrigger key={r} value={r} className="text-xs">
              {RANGE_LABELS[r]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={range} className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Memuatkan…</p>
          ) : (
            materials.map((m) => {
              const c = counts[m] || 0;
              const pct = (c / max) * 100;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{m}</span>
                    <span className="font-semibold text-foreground">{c}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
