import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, BarChart4, TrendingUp } from "lucide-react";
import React from "react";

interface GrossProfitStatsProps {
  revenueData: any;
}

export function GrossProfitStats({ revenueData }: GrossProfitStatsProps) {
  const stats = [
    {
      title: "Untung Kasar Hari Ini",
      value: revenueData.grossProfit.today,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Untung Kasar Bulan Ini",
      value: revenueData.grossProfit.thisMonth,
      icon: BarChart4,
      iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Untung Kasar Tahun Ini",
      value: revenueData.grossProfit.thisYear,
      icon: TrendingUp,
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-400">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border border-border/50 bg-card hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              RM
              {stat.value.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
