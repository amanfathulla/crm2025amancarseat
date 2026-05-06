import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SummaryStatCards } from "./dashboard/SummaryStatCards";
import { MonthlyComparisonCards } from "./dashboard/MonthlyComparisonCards";
import { RevenueProfitChart } from "./dashboard/RevenueProfitChart";
import { SalesTargetCard } from "./dashboard/SalesTargetCard";
import { MaterialViewsCard } from "./dashboard/MaterialViewsCard";
import { AdsRoasCard } from "./dashboard/AdsRoasCard";
import { getDailyQuote } from "@/utils/motivationalQuotes";
import { AdminSettingsDialog } from "@/components/settings/AdminSettingsDialog";

export default function Dashboard() {
  const { authClient } = useAuth();
  const [revenueData, setRevenueData] = useState({
    currentYear: {
      year: new Date().getFullYear(),
      total: 0,
    },
    thisMonth: { revenue: 0, profit: 0 },
    lastMonth: { revenue: 0, profit: 0 },
  });

  // Data from yearly_sales table for 2025
  const [sales2025, setSales2025] = useState({ revenue: 0, profit: 0 });
  
  // Total keseluruhan = yearly_sales total + customers data
  const [totalAllTimeRevenue, setTotalAllTimeRevenue] = useState(0);
  const [totalAllTimeProfit, setTotalAllTimeProfit] = useState(0);
  
  const [totalProfitYearFromCustomers, setTotalProfitYearFromCustomers] = useState(0);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Calculate last month
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth() + 1;
        const lastMonthYear = lastMonthDate.getFullYear();

        // Get all customers
        const { data: allCustomers, error: allCustomersError } = await authClient
          .from("customers")
          .select("sales_amount, gross_profit, order_status, order_date");
        if (allCustomersError) throw allCustomersError;

        // Get yearly_sales data for 2025
        const { data: yearlySalesData, error: yearlySalesError } = await authClient
          .from("yearly_sales")
          .select("total_revenue, total_profit, year");
        if (yearlySalesError) throw yearlySalesError;

        // Find 2025 data from yearly_sales
        const sales2025Data = yearlySalesData?.find(item => item.year === 2025);
        const revenue2025 = sales2025Data?.total_revenue || 0;
        const profit2025 = sales2025Data?.total_profit || 0;
        setSales2025({ revenue: revenue2025, profit: profit2025 });

        // Calculate total from yearly_sales (all years except current year)
        const yearlySalesTotalRevenue = yearlySalesData
          ?.filter(item => item.year !== currentYear)
          .reduce((sum, item) => sum + (parseFloat(String(item.total_revenue)) || 0), 0) || 0;
        const yearlySalesTotalProfit = yearlySalesData
          ?.filter(item => item.year !== currentYear)
          .reduce((sum, item) => sum + (parseFloat(String(item.total_profit)) || 0), 0) || 0;

        // Calculate current year totals from customers
        const customersThisYear = allCustomers.filter((item) => {
          const orderYear = item.order_date ? new Date(item.order_date).getFullYear() : null;
          return orderYear === currentYear;
        });
        const totalRevenueYearFromCustomers = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const totalProfitYearFromCustomersTable = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );
        setTotalProfitYearFromCustomers(totalProfitYearFromCustomersTable);

        // Jumlah keseluruhan = yearly_sales total + current year customers data
        setTotalAllTimeRevenue(yearlySalesTotalRevenue + totalRevenueYearFromCustomers);
        setTotalAllTimeProfit(yearlySalesTotalProfit + totalProfitYearFromCustomersTable);

        // Calculate this month data (UTC boundaries to avoid timezone date shifting)
        const monthStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const nextMonthStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
        const firstDayOfMonth = monthStartUtc.toISOString().slice(0, 10);
        const firstDayNextMonth = nextMonthStartUtc.toISOString().slice(0, 10);

        const { data: monthData, error: monthError } = await authClient
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", firstDayOfMonth)
          .lt("order_date", firstDayNextMonth);
        if (monthError) throw monthError;

        const thisMonthRevenue = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0,
        );
        const thisMonthProfit = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0,
        );

        // Calculate last month data (UTC boundaries to avoid timezone date shifting)
        const lastMonthStartUtc = new Date(Date.UTC(lastMonthYear, lastMonth - 1, 1));
        const currentMonthStartUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const firstDayLastMonth = lastMonthStartUtc.toISOString().slice(0, 10);
        const firstDayCurrentMonth = currentMonthStartUtc.toISOString().slice(0, 10);

        const { data: lastMonthData, error: lastMonthError } = await authClient
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", firstDayLastMonth)
          .lt("order_date", firstDayCurrentMonth);
        if (lastMonthError) throw lastMonthError;

        const lastMonthRevenue = lastMonthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0,
        );
        const lastMonthProfit = lastMonthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0,
        );

        setRevenueData({
          currentYear: { year: currentYear, total: totalRevenueYearFromCustomers },
          thisMonth: { revenue: thisMonthRevenue, profit: thisMonthProfit },
          lastMonth: { revenue: lastMonthRevenue, profit: lastMonthProfit },
        });

        // Generate daily data for chart
        const dailyData = await generateDailyData(currentMonth, currentYear);
        setDailyRevenueData(dailyData);

        // Generate monthly data for chart (all months of current year)
        const monthlyData = await generateMonthlyData(currentYear);
        setMonthlyRevenueData(monthlyData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const generateDailyData = async (month: number, year: number) => {
      try {
        const daysInMonth = new Date(year, month, 0).getDate();
        let dailyData = [];

        for (let i = 1; i <= daysInMonth; i++) {
          const dateStr = `${year}-${month.toString().padStart(2, "0")}-${i
            .toString()
            .padStart(2, "0")}`;
          const nextDateStr =
            i === daysInMonth
              ? `${month === 12 ? year + 1 : year}-${(month === 12 ? 1 : month + 1)
                  .toString()
                  .padStart(2, "0")}-01`
              : `${year}-${month.toString().padStart(2, "0")}-${(i + 1)
                  .toString()
                  .padStart(2, "0")}`;

          const { data, error } = await authClient
            .from("customers")
            .select("sales_amount, gross_profit")
            .gte("order_date", dateStr)
            .lt("order_date", nextDateStr);

          if (error) throw error;

          const dayRevenue = data.reduce(
            (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
            0
          );
          const dayProfit = data.reduce(
            (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
            0
          );

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

    const generateMonthlyData = async (year: number) => {
      try {
        let monthlyData = [];

        for (let month = 1; month <= 12; month++) {
          const firstDayOfMonth = `${year}-${month.toString().padStart(2, "0")}-01`;
          const firstDayNextMonth = month === 12 
            ? `${year + 1}-01-01`
            : `${year}-${(month + 1).toString().padStart(2, "0")}-01`;

          const { data, error } = await authClient
            .from("customers")
            .select("sales_amount, gross_profit")
            .gte("order_date", firstDayOfMonth)
            .lt("order_date", firstDayNextMonth);

          if (error) throw error;

          const monthRevenue = data.reduce(
            (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
            0
          );
          const monthProfit = data.reduce(
            (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
            0
          );

          monthlyData.push({
            month: month,
            revenue: monthRevenue,
            profit: monthProfit,
          });
        }

        return monthlyData;
      } catch (error) {
        console.error("Error generating monthly data:", error);
        return [];
      }
    };

    fetchDashboardData();

    const channel = authClient
      .channel("public:customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      authClient.removeChannel(channel);
    };
  }, []);

  const dailyQuote = getDailyQuote();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Branding Header */}
      <section className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" 
            alt="ACS Logo" 
            className="h-10 w-10 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">ACS LEGACY AMANCARSEAT</h1>
            <p className="text-muted-foreground text-sm md:text-base">Dashboard</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-muted-foreground hover:text-foreground"
            title="Tetapan Admin"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        {/* Motivational Quote */}
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm md:text-base text-foreground italic">
            "{dailyQuote}"
          </p>
        </div>
      </section>

      {/* KPI Cards + Target Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-4">
          <SummaryStatCards
            revenueData={revenueData}
            totalAllTimeRevenue={totalAllTimeRevenue}
            totalAllTimeProfit={totalAllTimeProfit}
            totalProfitYearFromCustomers={totalProfitYearFromCustomers}
            sales2025={sales2025}
          />
        </div>
        <div className="lg:col-span-1">
          <SalesTargetCard currentYearRevenue={revenueData.currentYear.total} />
        </div>
      </div>
      
      <MonthlyComparisonCards
        thisMonthRevenue={revenueData.thisMonth.revenue}
        lastMonthRevenue={revenueData.lastMonth.revenue}
        thisMonthProfit={revenueData.thisMonth.profit}
        lastMonthProfit={revenueData.lastMonth.profit}
      />
      
      <RevenueProfitChart 
        dailyRevenueData={dailyRevenueData} 
        monthlyRevenueData={monthlyRevenueData}
        isLoading={isLoading} 
      />

      <AdminSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
