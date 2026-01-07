import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { SummaryStatCards } from "./dashboard/SummaryStatCards";
import { MonthlyComparisonCards } from "./dashboard/MonthlyComparisonCards";
import { RevenueProfitChart } from "./dashboard/RevenueProfitChart";

export default function Dashboard() {
  const [revenueData, setRevenueData] = useState({
    currentYear: {
      year: new Date().getFullYear(),
      total: 0,
    },
    thisMonth: { revenue: 0, profit: 0 },
    lastMonth: { revenue: 0, profit: 0 },
  });

  const [totalAllTimeRevenue, setTotalAllTimeRevenue] = useState(0);
  const [totalAllTimeProfit, setTotalAllTimeProfit] = useState(0);
  const [totalProfitYearFromCustomers, setTotalProfitYearFromCustomers] = useState(0);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth() + 1;
        const lastMonthYear = lastMonthDate.getFullYear();

        const { data: allCustomers, error: allCustomersError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_status, order_date");
        if (allCustomersError) throw allCustomersError;

        const { data: yearlySalesData, error: yearlySalesError } = await supabase
          .from("yearly_sales")
          .select("*")
          .order("year", { ascending: false });
        if (yearlySalesError) throw yearlySalesError;

        const calculatedTotalAllTimeRevenue = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + item.total_revenue, 0)
          : 0;
        const calculatedTotalAllTimeProfit = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + (item.total_profit || 0), 0)
          : 0;

        setTotalAllTimeRevenue(calculatedTotalAllTimeRevenue);
        setTotalAllTimeProfit(calculatedTotalAllTimeProfit);

        const customersThisYear = allCustomers.filter((item) => {
          const orderYear = item.order_date ? new Date(item.order_date).getFullYear() : null;
          return orderYear === currentYear;
        });
        const totalRevenueYear = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const totalProfitYearFromCustomersTable = customersThisYear.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );
        setTotalProfitYearFromCustomers(totalProfitYearFromCustomersTable);

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          .toISOString()
          .split("T")[0];

        const { data: monthData, error: monthError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", firstDayOfMonth)
          .lt("order_date", firstDayNextMonth);
        if (monthError) throw monthError;

        const thisMonthRevenue = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const thisMonthProfit = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );

        const firstDayLastMonth = new Date(lastMonthYear, lastMonth - 1, 1)
          .toISOString()
          .split("T")[0];
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];

        const { data: lastMonthData, error: lastMonthError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", firstDayLastMonth)
          .lt("order_date", firstDayCurrentMonth);
        if (lastMonthError) throw lastMonthError;

        const lastMonthRevenue = lastMonthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const lastMonthProfit = lastMonthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );

        setRevenueData({
          currentYear: { year: currentYear, total: totalRevenueYear },
          thisMonth: { revenue: thisMonthRevenue, profit: thisMonthProfit },
          lastMonth: { revenue: lastMonthRevenue, profit: lastMonthProfit },
        });

        const dailyData = await generateDailyData(currentMonth, currentYear);
        setDailyRevenueData(dailyData);

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

          const { data, error } = await supabase
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

          const { data, error } = await supabase
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

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - Compact like Lead Management */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Selamat datang! Berikut adalah ringkasan prestasi perniagaan anda.
          </p>
        </div>

        <SummaryStatCards
          revenueData={revenueData}
          totalAllTimeRevenue={totalAllTimeRevenue}
          totalAllTimeProfit={totalAllTimeProfit}
          totalProfitYearFromCustomers={totalProfitYearFromCustomers}
        />
        
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
      </div>
    </MainLayout>
  );
}
