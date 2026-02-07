import { DollarSign, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import React from "react";

interface SummaryStatCardsProps {
  revenueData: any;
  totalAllTimeRevenue: number;
  totalAllTimeProfit: number;
  totalProfitYearFromCustomers: number;
  sales2025: { revenue: number; profit: number };
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
  sales2025,
}: SummaryStatCardsProps) {
  const currentYearRevenue = revenueData.currentYear.total;

  const stats = [
    {
      title: `Jualan ${revenueData.currentYear.year}`,
      value: currentYearRevenue,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: `Untung ${revenueData.currentYear.year}`,
      value: totalProfitYearFromCustomers,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Total Revenue",
      value: totalAllTimeRevenue,
      icon: Wallet,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Total Profit",
      value: totalAllTimeProfit,
      icon: PiggyBank,
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up delay-200">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-white/5" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/90">
                {stat.title}
              </p>
              <div className="p-2 rounded-lg bg-white/20">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              RM{formatNumber(stat.value)}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
