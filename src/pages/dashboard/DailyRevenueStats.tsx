
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import React from "react";

interface DailyRevenueStatsProps {
  revenueData: any;
}

export function DailyRevenueStats({ revenueData }: DailyRevenueStatsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-300">
      <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Semalam</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mt-3">
            RM
            {revenueData.yesterday.revenue.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span>{revenueData.yesterday.orders} pesanan</span>
            <span className="mx-2">•</span>
            <span>{revenueData.yesterday.products} produk</span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Hari Ini</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mt-3">
            RM
            {revenueData.today.revenue.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span>{revenueData.today.orders} pesanan</span>
            <span className="mx-2">•</span>
            <span>{revenueData.today.products} produk</span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Bulan Ini</h3>
            </div>
          </div>
          <p className="text-3xl font-bold mt-3">
            RM
            {revenueData.thisMonth.revenue.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span>{revenueData.thisMonth.orders} pesanan</span>
            <span className="mx-2">•</span>
            <span>{revenueData.thisMonth.products} produk</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
