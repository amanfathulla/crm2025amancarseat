import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

interface DailyRevenueStatsProps {
  revenueData: any;
}

export function DailyRevenueStats({ revenueData }: DailyRevenueStatsProps) {
  const stats = [
    {
      label: "Semalam",
      revenue: revenueData.yesterday.revenue,
      orders: revenueData.yesterday.orders,
      products: revenueData.yesterday.products,
      iconBg: "bg-gray-100 dark:bg-gray-800",
    },
    {
      label: "Hari Ini",
      revenue: revenueData.today.revenue,
      orders: revenueData.today.orders,
      products: revenueData.today.products,
      iconBg: "bg-primary/10 dark:bg-primary/20",
      highlight: true,
    },
    {
      label: "Bulan Ini",
      revenue: revenueData.thisMonth.revenue,
      orders: revenueData.thisMonth.orders,
      products: revenueData.thisMonth.products,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-300">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`border bg-card hover:shadow-md transition-all duration-200 ${
            stat.highlight ? "ring-2 ring-primary/20" : "border-border/50"
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-2">
              RM
              {stat.revenue.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {stat.orders} pesanan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {stat.products} produk
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
