
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface SummaryStatCardsProps {
  revenueData: any;
  totalProfitAll: number;
  totalProfitYear: number;
}

export function SummaryStatCards({
  revenueData,
  totalProfitAll,
  totalProfitYear,
}: SummaryStatCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-slide-up delay-200">
      <Card className="bg-black text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 text-center">
          <h2 className="text-lg md:text-xl font-bold mb-2">
            Jumlah Jualan {revenueData.currentYear.year}
          </h2>
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 break-words">
            RM
            {revenueData.currentYear.total.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">Jualan dari Pesanan Pelanggan</p>
        </CardContent>
      </Card>
      <Card className="bg-emerald-900 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 text-center">
          <h2 className="text-lg md:text-xl font-bold mb-2">
            Jumlah Untung {new Date().getFullYear()}
          </h2>
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 break-words">
            RM
            {totalProfitYear.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-white/80 mt-2">
            Untung Tahun Ini (Auto Update Setiap Tahun)
          </p>
        </CardContent>
      </Card>
      <Card className="bg-indigo-900 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 text-center">
          <h2 className="text-lg md:text-xl font-bold mb-2">Total Revenue</h2>
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 break-words">
            RM
            {revenueData.yearlySalesTotal.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-green-700 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-8 px-2 text-center">
          <h2 className="text-lg md:text-xl font-bold mb-2">Total Profit</h2>
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 break-words">
            RM
            {totalProfitAll.toLocaleString("en-MY", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
