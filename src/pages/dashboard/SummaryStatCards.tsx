
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface SummaryStatCardsProps {
  revenueData: any;
  totalAllTimeRevenue: number;
  totalAllTimeProfit: number;
  totalProfitYearFromCustomers: number;
}

export function SummaryStatCards({
  revenueData,
  totalAllTimeRevenue,
  totalAllTimeProfit,
  totalProfitYearFromCustomers,
}: SummaryStatCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 mb-6 animate-slide-up delay-200">
      <Card className="bg-black text-white hover:shadow-lg transition-all duration-300 w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 lg:py-10 lg:px-4 xl:py-12 xl:px-6 text-center">
          <h2 className="text-lg md:text-xl lg:text-xl xl:text-2xl font-bold mb-2 lg:mb-3">
            Jumlah Jualan {revenueData.currentYear.year}
          </h2>
          <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-1 lg:mt-3 xl:mt-4 break-words leading-tight">
            <span className="text-lg lg:text-xl xl:text-2xl mr-1">RM</span>
            {revenueData.currentYear.total.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs lg:text-sm text-gray-400 mt-2 lg:mt-4">Jualan dari Pesanan Pelanggan</p>
        </CardContent>
      </Card>
      <Card className="bg-black text-white hover:shadow-lg transition-all duration-300 w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 lg:py-10 lg:px-4 xl:py-12 xl:px-6 text-center">
          <h2 className="text-lg md:text-xl lg:text-xl xl:text-2xl font-bold mb-2 lg:mb-3">
            Jumlah Untung {new Date().getFullYear()}
          </h2>
          <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-1 lg:mt-3 xl:mt-4 break-words leading-tight">
            <span className="text-lg lg:text-xl xl:text-2xl mr-1">RM</span>
            {totalProfitYearFromCustomers.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs lg:text-sm text-gray-400 mt-2 lg:mt-4">Untung dari Pesanan Pelanggan</p>
        </CardContent>
      </Card>
      <Card className="bg-red-600 text-white hover:shadow-lg transition-all duration-300 w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 lg:py-10 lg:px-4 xl:py-12 xl:px-6 text-center">
          <h2 className="text-lg md:text-xl lg:text-xl xl:text-2xl font-bold mb-2 lg:mb-3">Total Revenue</h2>
          <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-1 lg:mt-3 xl:mt-4 break-words leading-tight">
            <span className="text-lg lg:text-xl xl:text-2xl mr-1">RM</span>
            {totalAllTimeRevenue.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs lg:text-sm text-red-100 mt-2 lg:mt-4">All Time Revenue</p>
        </CardContent>
      </Card>
      <Card className="bg-red-600 text-white hover:shadow-lg transition-all duration-300 w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 lg:py-10 lg:px-4 xl:py-12 xl:px-6 text-center">
          <h2 className="text-lg md:text-xl lg:text-xl xl:text-2xl font-bold mb-2 lg:mb-3">Total Profit</h2>
          <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-1 lg:mt-3 xl:mt-4 break-words leading-tight">
            <span className="text-lg lg:text-xl xl:text-2xl mr-1">RM</span>
            {totalAllTimeProfit.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs lg:text-sm text-red-100 mt-2 lg:mt-4">All Time Profit</p>
        </CardContent>
      </Card>
    </section>
  );
}
