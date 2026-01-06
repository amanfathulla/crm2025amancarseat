import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    today: { revenue: 0, orders: 0, products: 0 },
    yesterday: { revenue: 0, orders: 0, products: 0 },
    thisMonth: { revenue: 0, orders: 0, products: 0 },
    orders: {
      today: 0,
      thisMonth: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    },
    grossProfit: { today: 0, thisMonth: 0, thisYear: 0 },
    yearlySalesTotal: 0,
  });

  const [totalAllTimeRevenue, setTotalAllTimeRevenue] = useState(0);
  const [totalAllTimeProfit, setTotalAllTimeProfit] = useState(0);
  const [totalProfitYearFromCustomers, setTotalProfitYearFromCustomers] = useState(0);
  const [dailyRevenueData, setDailyRevenueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const today = now.toISOString().split("T")[0];

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          .toISOString()
          .split("T")[0];

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

        const completedOrders = allCustomers.filter(
          (item) => item.order_status === "completed"
        ).length;

        const { data: yearData, error: yearError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", `${currentYear}-01-01`)
          .lt("order_date", `${currentYear + 1}-01-01`);
        if (yearError) throw yearError;

        const { data: todayData, error: todayError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", today)
          .lt("order_date", new Date(now.getTime() + 86400000).toISOString().split("T")[0]);
        if (todayError) throw todayError;

        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", yesterdayStr)
          .lt("order_date", today);
        if (yesterdayError) throw yesterdayError;

        const { data: monthData, error: monthError } = await supabase
          .from("customers")
          .select("sales_amount, gross_profit, order_date")
          .gte("order_date", firstDayOfMonth)
          .lt("order_date", firstDayNextMonth);
        if (monthError) throw monthError;

        const { data: processingOrders } = await supabase
          .from("customers")
          .select("id")
          .eq("order_status", "processing");

        const { data: cancelledOrders } = await supabase
          .from("customers")
          .select("id")
          .eq("order_status", "cancelled");

        const todayRevenue = todayData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const todayProfit = todayData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );

        const yesterdayRevenue = yesterdayData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );

        const monthlyRevenue = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0),
          0
        );
        const monthlyProfit = monthData.reduce(
          (sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0),
          0
        );

        setRevenueData({
          currentYear: { year: currentYear, total: totalRevenueYear },
          today: { revenue: todayRevenue, orders: todayData.length, products: todayData.length },
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
            cancelled: cancelledOrders?.length || 0,
          },
          grossProfit: {
            today: todayProfit,
            thisMonth: monthlyProfit,
            thisYear: totalProfitYearFromCustomersTable,
          },
          yearlySalesTotal: calculatedTotalAllTimeRevenue,
        });

        const dailyData = await generateDailyData(currentMonth, currentYear);
        setDailyRevenueData(dailyData);
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
      <section className="mb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">
          Selamat datang! Berikut adalah ringkasan prestasi perniagaan anda.
        </p>
      </section>

      <SummaryStatCards
        revenueData={revenueData}
        totalAllTimeRevenue={totalAllTimeRevenue}
        totalAllTimeProfit={totalAllTimeProfit}
        totalProfitYearFromCustomers={totalProfitYearFromCustomers}
      />
      <DailyRevenueStats revenueData={revenueData} />
      <GrossProfitStats revenueData={revenueData} />
      <RevenueProfitChart dailyRevenueData={dailyRevenueData} isLoading={isLoading} />
    </MainLayout>
  );
}
