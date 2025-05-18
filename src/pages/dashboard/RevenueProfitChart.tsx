
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import React from "react";

interface RevenueProfitChartProps {
  dailyRevenueData: any[];
  isLoading: boolean;
}

export function RevenueProfitChart({ dailyRevenueData, isLoading }: RevenueProfitChartProps) {
  return (
    <section className="grid grid-cols-1 gap-6 mb-8 animate-slide-up delay-600">
      <Card>
        <CardHeader>
          <CardTitle>Jumlah Jualan & Untung Kasar</CardTitle>
          <CardDescription>Data harian untuk bulan ini</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Memuat data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => `RM${value}`}
                />
                <Tooltip
                  formatter={(value) => [`RM${value}`, ""]}
                  labelFormatter={(label) => `Tarikh: ${label}`}
                  contentStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    border: "none",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  strokeWidth={3}
                  dot={{ strokeWidth: 0, r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  stroke="hsl(var(--primary))"
                  name="Jumlah Jualan"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  strokeWidth={3}
                  dot={{ strokeWidth: 0, r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  stroke="rgb(239, 68, 68)"
                  name="Untung Kasar"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
