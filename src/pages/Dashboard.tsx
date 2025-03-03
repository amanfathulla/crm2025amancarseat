
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingBag, PackageCheck, PackageX, DollarSign, BarChart4, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getSampleRevenueData, getSampleDailyRevenueData } from "@/utils/sampleData";

export default function Dashboard() {
  const revenueData = getSampleRevenueData();
  const dailyRevenueData = getSampleDailyRevenueData();
  
  // Function to format currency
  const formatCurrency = (value: number) => {
    return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return (
    <MainLayout>
      <section className="mb-6 animate-slide-up delay-100">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan Prestasi (Overview)</p>
      </section>
      
      {/* Annual Revenue Overview */}
      <section className="mb-6 animate-slide-up delay-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Jualan {revenueData.currentYear.year}</h3>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(revenueData.currentYear.total)}</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span>Tahun Semasa</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Jualan {revenueData.previousYear.year}</h3>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(revenueData.previousYear.total)}</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span>Tahun Lepas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Daily Revenue Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-300">
        <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Semalam</h3>
              </div>
            </div>
            <p className="text-3xl font-bold mt-3">{formatCurrency(revenueData.yesterday.revenue)}</p>
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
            <p className="text-3xl font-bold mt-3">{formatCurrency(revenueData.today.revenue)}</p>
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
            <p className="text-3xl font-bold mt-3">{formatCurrency(revenueData.thisMonth.revenue)}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>{revenueData.thisMonth.orders} pesanan</span>
              <span className="mx-2">•</span>
              <span>{revenueData.thisMonth.products} produk</span>
            </div>
          </CardContent>
        </Card>
      </section>
      
      {/* Order & Gross Profit Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up delay-400">
        <StatCard 
          title="Order Dalam Proses" 
          value={revenueData.orders.processing.toString()} 
          icon={ShoppingBag}
          iconColor="text-blue-500"
          iconBg="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard 
          title="Order Selesai" 
          value={revenueData.orders.completed.toString()}
          icon={PackageCheck}
          iconColor="text-green-500" 
          iconBg="bg-green-100 dark:bg-green-900/20"
        />
        <StatCard 
          title="Order Dibatalkan" 
          value={revenueData.orders.cancelled.toString()}
          icon={PackageX}
          iconColor="text-red-500"
          iconBg="bg-red-100 dark:bg-red-900/20"
        />
        <StatCard 
          title="Pesanan Bulan Ini" 
          value={revenueData.orders.thisMonth.toString()}
          icon={ShoppingCart}
          iconColor="text-purple-500"
          iconBg="bg-purple-100 dark:bg-purple-900/20"
        />
      </section>
      
      {/* Gross Profit Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-500">
        <GrossProfitCard 
          title="Untung Kasar Hari Ini" 
          value={formatCurrency(revenueData.grossProfit.today)}
          icon={DollarSign}
        />
        <GrossProfitCard 
          title="Untung Kasar Bulan Ini" 
          value={formatCurrency(revenueData.grossProfit.thisMonth)}
          icon={BarChart4}
        />
        <GrossProfitCard 
          title="Untung Kasar Tahun Ini" 
          value={formatCurrency(revenueData.grossProfit.thisYear)}
          icon={TrendingUp}
        />
      </section>
      
      {/* Revenue & Profit Chart */}
      <section className="grid grid-cols-1 gap-6 mb-8 animate-slide-up delay-600">
        <Card>
          <CardHeader>
            <CardTitle>Jumlah Jualan & Untung Kasar</CardTitle>
            <CardDescription>Data harian untuk bulan ini</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--muted-foreground)' }}
                  tickFormatter={(value) => `RM ${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`RM ${value}`, '']}
                  labelFormatter={(label) => `Tarikh: ${label}`}
                  contentStyle={{ 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
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
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: { 
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-full", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gross Profit Card Component
function GrossProfitCard({ 
  title, 
  value, 
  icon: Icon,
}: { 
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="bg-white dark:bg-gray-950 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-medium">{title}</h3>
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
