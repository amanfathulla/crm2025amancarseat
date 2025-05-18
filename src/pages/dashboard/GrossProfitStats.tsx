
import { DollarSign, BarChart4, TrendingUp } from "lucide-react";
import React from "react";
import { GrossProfitCard } from "./DashboardCards";

interface GrossProfitStatsProps {
  revenueData: any;
}

export function GrossProfitStats({ revenueData }: GrossProfitStatsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-500">
      <GrossProfitCard
        title="Untung Kasar Hari Ini"
        value={`RM${revenueData.grossProfit.today.toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        icon={DollarSign}
      />
      <GrossProfitCard
        title="Untung Kasar Bulan Ini"
        value={`RM${revenueData.grossProfit.thisMonth.toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        icon={BarChart4}
      />
      <GrossProfitCard
        title="Untung Kasar Tahun Ini"
        value={`RM${revenueData.grossProfit.thisYear.toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        icon={TrendingUp}
      />
    </section>
  );
}
