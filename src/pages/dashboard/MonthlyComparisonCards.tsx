import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

interface MonthlyComparisonCardsProps {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  thisMonthProfit: number;
  lastMonthProfit: number;
}

const monthNames = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function getPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function MonthlyComparisonCards({
  thisMonthRevenue,
  lastMonthRevenue,
  thisMonthProfit,
  lastMonthProfit,
}: MonthlyComparisonCardsProps) {
  const now = new Date();
  const currentMonthName = monthNames[now.getMonth()];
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthName = monthNames[lastMonth];

  const revenueChange = getPercentChange(thisMonthRevenue, lastMonthRevenue);
  const profitChange = getPercentChange(thisMonthProfit, lastMonthProfit);

  const stats = [
    {
      label: `Jualan ${currentMonthName}`,
      value: thisMonthRevenue,
      prevLabel: lastMonthName,
      prevValue: lastMonthRevenue,
      change: revenueChange,
      colorClass: "border-l-blue-500",
      bgClass: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: `Untung ${currentMonthName}`,
      value: thisMonthProfit,
      prevLabel: lastMonthName,
      prevValue: lastMonthProfit,
      change: profitChange,
      colorClass: "border-l-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-slide-up delay-300">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`border-0 shadow-sm bg-card hover:shadow-md transition-all duration-200 border-l-4 ${stat.colorClass}`}
        >
          <CardContent className="p-5">
            <div className="flex flex-col gap-4">
              {/* Current Month */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  RM{formatNumber(stat.value)}
                </p>
                
                {/* Change indicator */}
                <div className="flex items-center gap-2 mt-2">
                  {stat.change > 0 ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+{stat.change.toFixed(1)}%</span>
                    </div>
                  ) : stat.change < 0 ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <TrendingDown className="h-4 w-4" />
                      <span>{stat.change.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Minus className="h-4 w-4" />
                      <span>0%</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    vs {stat.prevLabel}
                  </span>
                </div>
              </div>

              {/* Last Month */}
              <div className={`p-3 rounded-lg ${stat.bgClass}`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {stat.prevLabel}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  RM{formatNumber(stat.prevValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
