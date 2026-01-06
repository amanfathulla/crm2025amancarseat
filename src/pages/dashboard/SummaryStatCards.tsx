import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import React from "react";

interface SummaryStatCardsProps {
  revenueData: any;
  totalAllTimeRevenue: number;
  totalAllTimeProfit: number;
  totalProfitYearFromCustomers: number;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return n.toLocaleString("en-MY");
  return n.toFixed(2);
}

export function SummaryStatCards({
  revenueData,
  totalAllTimeRevenue,
  totalAllTimeProfit,
  totalProfitYearFromCustomers,
}: SummaryStatCardsProps) {
  const currentYearRevenue = revenueData.currentYear.total;

  const stats = [
    {
      title: `Jualan ${revenueData.currentYear.year}`,
      value: currentYearRevenue,
      icon: DollarSign,
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: `Untung ${revenueData.currentYear.year}`,
      value: totalProfitYearFromCustomers,
      icon: TrendingUp,
      iconBg: "bg-green-500/10 dark:bg-green-500/20",
      iconColor: "text-green-600 dark:text-green-400",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: totalAllTimeRevenue,
      icon: Wallet,
      iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Total Profit",
      value: totalAllTimeProfit,
      icon: PiggyBank,
      iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      trend: "+3%",
      trendUp: true,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up delay-200">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border border-border/50 bg-card hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trendUp
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-foreground">
                RM{formatNumber(stat.value)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
