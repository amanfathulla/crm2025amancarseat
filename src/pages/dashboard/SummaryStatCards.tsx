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
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      cardBorder: "border-l-4 border-l-blue-500",
    },
    {
      title: `Untung ${revenueData.currentYear.year}`,
      value: totalProfitYearFromCustomers,
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      cardBorder: "border-l-4 border-l-green-500",
    },
    {
      title: "Total Revenue",
      value: totalAllTimeRevenue,
      icon: Wallet,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      cardBorder: "border-l-4 border-l-purple-500",
    },
    {
      title: "Total Profit",
      value: totalAllTimeProfit,
      icon: PiggyBank,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      cardBorder: "border-l-4 border-l-orange-500",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up delay-200">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`border-0 shadow-sm bg-card hover:shadow-md transition-all duration-200 ${stat.cardBorder}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  RM{formatNumber(stat.value)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
