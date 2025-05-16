
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart, DollarSign, BarChart4, TrendingUp, Package, ShoppingBag, PackageCheck, PackageX } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [revenueData, setRevenueData] = useState({
    currentYear: {
      year: new Date().getFullYear(),
      total: 0,
    },
    today: {
      revenue: 0,
      orders: 0,
      products: 0,
    },
    yesterday: {
      revenue: 0,
      orders: 0,
      products: 0,
    },
    thisMonth: {
      revenue: 0,
      orders: 0,
      products: 0,
    },
    orders: {
      today: 0,
      thisMonth: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    },
    grossProfit: {
      today: 0,
      thisMonth: 0,
      thisYear: 0
    },
    yearlySalesTotal: 0
  });
  // Tambah state untuk total profit keseluruhan dan tahun semasa
  const [totalProfitAll, setTotalProfitAll] = useState(0);
  const [totalProfitYear, setTotalProfitYear] = useState(0);

  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to format currency
  const formatCurrency = (value: number) => {
    return `RM${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get current date info
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const today = now.toISOString().split('T')[0];

        // Calculate yesterday's date
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Get first day, last day of month
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        // Last day of month (exclusive)
        const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

        // Fetch yearly data from customers table
        const { data: yearData, error: yearError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_date')
          .gte('order_date', `${currentYear}-01-01`)
          .lt('order_date', `${currentYear + 1}-01-01`);

        if (yearError) throw yearError;

        // Fetch today's data
        const { data: todayData, error: todayError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_date')
          .gte('order_date', today)
          .lt('order_date', new Date(now.getTime() + 86400000).toISOString().split('T')[0]);

        if (todayError) throw todayError;

        // Fetch yesterday's data
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_date')
          .gte('order_date', yesterdayStr)
          .lt('order_date', today);

        if (yesterdayError) throw yesterdayError;

        // Fetch this month's data **FIX: pastikan date range betul dan tally dengan sistem**
        const { data: monthData, error: monthError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_date')
          .gte('order_date', firstDayOfMonth)
          .lt('order_date', firstDayNextMonth);

        if (monthError) throw monthError;

        // Fetch order status counts from customers table
        const { data: processingOrders, error: processingError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'processing');

        if (processingError) throw processingError;

        const { data: completedOrders, error: completedError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'completed');

        if (completedError) throw completedError;

        const { data: cancelledOrders, error: cancelledError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'cancelled');

        if (cancelledError) throw cancelledError;

        // Fetch yearly sales data for total revenue display
        const { data: yearlySalesData, error: yearlySalesError } = await supabase
          .from('yearly_sales')
          .select('total_revenue, total_profit, year');

        if (yearlySalesError) throw yearlySalesError;

        // Calculate yearly sales total
        const yearlySalesTotal = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_revenue)), 0)
          : 0;

        // --- Tambahan: dapatkan total profit keseluruhan & tahun semasa ---
        let totalProfitAllTemp = 0;
        let totalProfitYearTemp = 0;
        if (yearlySalesData) {
          totalProfitAllTemp = yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_profit)), 0);
          // cari data untuk tahun semasa
          const profitYear = yearlySalesData.find((item) => item.year === currentYear);
          totalProfitYearTemp = profitYear ? parseFloat(String(profitYear.total_profit)) : 0;
        }
        setTotalProfitAll(totalProfitAllTemp);
        setTotalProfitYear(totalProfitYearTemp);

        // Calculate sums
        const yearlyRevenue = yearData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const yearlyProfit = yearData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const todayRevenue = todayData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const todayProfit = todayData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const yesterdayRevenue = yesterdayData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const yesterdayProfit = yesterdayData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const monthlyRevenue = monthData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const monthlyProfit = monthData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        // Update state with all fetched data, including correct "thisMonth" stats
        setRevenueData({
          currentYear: {
            year: currentYear,
            total: yearlyRevenue,
          },
          today: {
            revenue: todayRevenue,
            orders: todayData.length,
            products: todayData.length,
          },
          yesterday: {
            revenue: yesterdayRevenue,
            orders: yesterdayData.length,
            products: yesterdayData.length,
          },
          thisMonth: {
            revenue: monthlyRevenue,
            orders: monthData.length,
            products: monthData.length,
          },
          orders: {
            today: todayData.length,
            thisMonth: monthData.length,
            processing: processingOrders?.length || 0,
            completed: completedOrders?.length || 0,
            cancelled: cancelledOrders?.length || 0
          },
          grossProfit: {
            today: todayProfit,
            thisMonth: monthlyProfit,
            thisYear: yearlyProfit
          },
          yearlySalesTotal: yearlySalesTotal
        });

        // Generate daily data for chart (fungsi sedia ada)
        const dailyData = await generateDailyData(currentMonth, currentYear);
        setDailyRevenueData(dailyData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Generate daily revenue and profit data for the chart
    const generateDailyData = async (month: number, year: number) => {
      try {
        const daysInMonth = new Date(year, month, 0).getDate();
        let dailyData = [];

        for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
          const nextDateStr = i === daysInMonth
            ? `${month === 12 ? year + 1 : year}-${(month === 12 ? 1 : month + 1).toString().padStart(2, '0')}-01`
            : `${year}-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;

          const { data, error } = await supabase
            .from('customers')
            .select('sales_amount, gross_profit')
            .gte('order_date', dateStr)
            .lt('order_date', nextDateStr);

          if (error) throw error;

          const dayRevenue = data.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
          const dayProfit = data.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

          dailyData.push({
            date: `${i}/${month}/${year}`,
            revenue: dayRevenue,
            profit: dayProfit,
          });
        }

        return dailyData;
      } catch (error) {
        console.error("Error generating daily data:", error);
        return [];
      }
    };

    // Initial fetch
    fetchDashboardData();

    // Set up realtime subscription to update dashboard when new customer orders are added
    const channel = supabase
      .channel('public:customers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MainLayout>
      <section className="mb-6 animate-slide-up delay-100">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">"Kejayaan bermula dengan langkah berani. Terus maju tanpa ragu! – Aman, Founder AMAN CAR SEAT"</p>
      </section>

      {/* Annual Revenue Section - Now a grid with four cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-slide-up delay-200">
        {/* Customer Orders Revenue */}
        <Card className="bg-black text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Jumlah Jualan {revenueData.currentYear.year}</h2>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-1">
              RM{revenueData.currentYear.total.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-400 mt-2">Jualan dari Pesanan Pelanggan</p>
          </CardContent>
        </Card>

        {/* Total Yearly Sales Revenue */}
        <Card className="bg-indigo-900 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Jumlah Jualan Keseluruhan</h2>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-1">
              RM{revenueData.yearlySalesTotal.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-300 mt-2">Data dari Rekod Jualan Tahunan</p>
          </CardContent>
        </Card>

        {/* NEW: Total Profit ALL TIME */}
        <Card className="bg-green-700 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Jumlah Untung Keseluruhan</h2>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-1">
              RM{totalProfitAll.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-white/80 mt-2">Keseluruhan Untung (Setiap Tahun)</p>
          </CardContent>
        </Card>

        {/* NEW: Total Profit Current Year */}
        <Card className="bg-emerald-900 text-white hover:shadow-md transition-shadow w-full mx-auto rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Jumlah Untung {new Date().getFullYear()}</h2>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-1">
              RM{totalProfitYear.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-white/80 mt-2">Untung Tahun Ini (Auto Update Setiap Tahun)</p>
          </CardContent>
        </Card>
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
            <p className="text-3xl font-bold mt-3">RM{revenueData.yesterday.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            <p className="text-3xl font-bold mt-3">RM{revenueData.today.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            <p className="text-3xl font-bold mt-3">RM{revenueData.thisMonth.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>{revenueData.thisMonth.orders} pesanan</span>
              <span className="mx-2">•</span>
              <span>{revenueData.thisMonth.products} produk</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Gross Profit Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up delay-500">
        <GrossProfitCard
          title="Untung Kasar Hari Ini"
          value={`RM${revenueData.grossProfit.today.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <GrossProfitCard
          title="Untung Kasar Bulan Ini"
          value={`RM${revenueData.grossProfit.thisMonth.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={BarChart4}
        />
        <GrossProfitCard
          title="Untung Kasar Tahun Ini"
          value={`RM${revenueData.grossProfit.thisYear.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--muted-foreground)' }}
                    tickFormatter={(value) => `RM${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`RM${value}`, '']}
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
            )}
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
