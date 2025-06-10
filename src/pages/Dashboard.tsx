import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart, DollarSign, BarChart4, TrendingUp, Package, ShoppingBag, PackageCheck, PackageX } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Refactored components
import { SummaryStatCards } from "./dashboard/SummaryStatCards";
import { DailyRevenueStats } from "./dashboard/DailyRevenueStats";
import { GrossProfitStats } from "./dashboard/GrossProfitStats";
import { RevenueProfitChart } from "./dashboard/RevenueProfitChart";

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
  // State untuk total profit tahun semasa dan sidebar sales data
  const [totalProfitYear, setTotalProfitYear] = useState(0);
  const [sidebarSalesData, setSidebarSalesData] = useState({
    totalRevenue: 0,
    totalProfit: 0
  });

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
        // Dapatkan tahun & bulan semasa sekali sahaja
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

        // Fetch all customer data for sidebar sales data (same as sidebar calculation)
        const { data: allCustomers, error: allCustomersError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_status, order_date');
        if (allCustomersError) throw allCustomersError;

        // Calculate sidebar sales data - EXACTLY same as sidebar
        const sidebarTotalRevenue = allCustomers
          ? allCustomers.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0)
          : 0;
        const sidebarTotalProfit = allCustomers
          ? allCustomers.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0)
          : 0;

        setSidebarSalesData({
          totalRevenue: sidebarTotalRevenue,
          totalProfit: sidebarTotalProfit
        });

        // Tahun ini - guna pembolehubah berlainan untuk elak duplikasi
        const dashboardYear = currentYear;
        const customersThisYear = allCustomers.filter(
          item => {
            const orderYear = item.order_date ? new Date(item.order_date).getFullYear() : null;
            return orderYear === dashboardYear;
          }
        );
        const totalProfitYear = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0
        );
        const totalRevenueYear = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0
        );

        // Completed orders accurate count
        const completedOrders = allCustomers.filter(item => item.order_status === "completed").length;

        // Fetch yearly data from customers table
        const { data: yearData, error: yearError } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit, order_date')
          .gte('order_date', `${dashboardYear}-01-01`)
          .lt('order_date', `${dashboardYear + 1}-01-01`);

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

        const { data: completedOrdersData, error: completedError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'completed');

        if (completedError) throw completedError;

        const { data: cancelledOrders, error: cancelledError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'cancelled');

        if (cancelledError) throw cancelledError;

        // Calculate sums
        const yearlyRevenue = yearData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const yearlyProfit = yearData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const todayRevenue = todayData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const todayProfit = todayData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const yesterdayRevenue = yesterdayData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const yesterdayProfit = yesterdayData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        const monthlyRevenue = monthData.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0);
        const monthlyProfit = monthData.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0);

        // Update state
        setRevenueData({
          currentYear: {
            year: currentYear,
            total: totalRevenueYear,
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
            completed: completedOrders,
            cancelled: cancelledOrders?.length || 0
          },
          grossProfit: {
            today: todayProfit,
            thisMonth: monthlyProfit,
            thisYear: totalProfitYear
          },
          yearlySalesTotal: sidebarTotalRevenue
        });
        setTotalProfitYear(totalProfitYear);

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
        <p className="text-muted-foreground">
          "Kejayaan bermula dengan langkah berani. Terus maju tanpa ragu! – Aman, Founder AMAN CAR SEAT"
        </p>
      </section>
      <SummaryStatCards
        revenueData={revenueData}
        totalProfitYear={totalProfitYear}
        sidebarSalesData={sidebarSalesData}
      />
      <DailyRevenueStats revenueData={revenueData} />
      <GrossProfitStats revenueData={revenueData} />
      <RevenueProfitChart dailyRevenueData={dailyRevenueData} isLoading={isLoading} />
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
