import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash, PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Wallet } from "lucide-react";
import { YearlySalesForm } from "@/components/sales/YearlySalesForm";
import { DeleteYearlySalesDialog } from "@/components/sales/DeleteYearlySalesDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { YearlySalesRecord, YearlySalesFormData, YearlyAnalytics } from "@/types/sales";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function Sales() {
  const { toast } = useToast();
  const [yearlySales, setYearlySales] = useState<YearlySalesRecord[]>([]);
  const [analytics, setAnalytics] = useState<YearlyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<YearlySalesFormData | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  
  const fetchYearlySalesData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("yearly_sales")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;

      const typedData = data?.map(record => ({
        id: record.id,
        year: record.year,
        total_revenue: record.total_revenue,
        total_profit: record.total_profit || 0,
        quarter_1: record.quarter_1,
        quarter_2: record.quarter_2,
        quarter_3: record.quarter_3,
        quarter_4: record.quarter_4,
        created_at: record.created_at
      })) || [];
      
      setYearlySales(typedData);
      
      if (typedData.length >= 1) {
        const sortedData = [...typedData].sort((a, b) => b.year - a.year);
        
        const currentYear = new Date().getFullYear();
        const currentYearData = sortedData.find(record => record.year === currentYear);
        const previousYearData = sortedData.find(record => record.year === currentYear - 1);
        
        const currentYearRevenue = currentYearData ? currentYearData.total_revenue : 0;
        const previousYearRevenue = previousYearData ? previousYearData.total_revenue : 0;
        const currentYearProfit = currentYearData ? currentYearData.total_profit : 0;
        const previousYearProfit = previousYearData ? previousYearData.total_profit : 0;
        
        const totalAllTimeRevenue = sortedData.reduce((total, record) => total + record.total_revenue, 0);
        const totalAllTimeProfit = sortedData.reduce((total, record) => total + (record.total_profit || 0), 0);
        
        const percentageChange = previousYearRevenue > 0
          ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
          : currentYearRevenue > 0 ? 100 : 0;
        
        const yearlyData = sortedData.slice(0, 5).map(record => ({
          year: record.year,
          totalRevenue: record.total_revenue,
          totalProfit: record.total_profit || 0,
        }));
        
        setAnalytics({
          currentYearRevenue,
          previousYearRevenue,
          currentYearProfit,
          previousYearProfit,
          percentageChange,
          yearlyData,
          totalAllTimeRevenue,
          totalAllTimeProfit,
          minYear: Math.min(...sortedData.map(record => record.year)),
          maxYear: Math.max(...sortedData.map(record => record.year)),
        });
      } else {
        setAnalytics(null);
      }
      
    } catch (error: any) {
      console.error("Error fetching yearly sales data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load yearly sales data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlySalesData();
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditRecord = (record: YearlySalesRecord) => {
    setSelectedRecord({
      year: record.year,
      total_revenue: record.total_revenue,
      total_profit: record.total_profit,
      quarter_1: record.quarter_1,
      quarter_2: record.quarter_2,
      quarter_3: record.quarter_3,
      quarter_4: record.quarter_4,
    });
    setIsEditFormOpen(true);
  };

  const handleDeleteRecord = (id: string, year: number) => {
    setSelectedRecordId(id);
    setSelectedRecord({ 
      year: year,
      total_revenue: 0,
      total_profit: 0,
      quarter_1: 0,
      quarter_2: 0,
      quarter_3: 0,
      quarter_4: 0
    });
    setIsDeleteDialogOpen(true);
  };

  const filteredYearlySales = yearlySales.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return record.year.toString().includes(searchQuery) || record.total_revenue.toString().includes(searchQuery);
  });

  const statCards = [
    {
      title: "Total Revenue",
      value: analytics?.totalAllTimeRevenue || 0,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Profit",
      value: analytics?.totalAllTimeProfit || 0,
      icon: Wallet,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "YoY Growth",
      value: analytics?.percentageChange || 0,
      icon: analytics?.percentageChange && analytics.percentageChange >= 0 ? TrendingUp : TrendingDown,
      gradient: analytics?.percentageChange && analytics.percentageChange >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
      isPercent: true,
    },
    {
      title: `Tahun ${new Date().getFullYear()}`,
      value: analytics?.currentYearRevenue || 0,
      icon: Calendar,
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - Compact like Lead Management */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Yearly Sales</h1>
            <p className="text-muted-foreground text-sm">Urus rekod jualan tahunan</p>
          </div>
          <Button className="gap-2" onClick={() => setIsAddFormOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Tambah Rekod
          </Button>
        </div>

        {/* Stats Cards - Same style as Lead Management */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-lg`}
            >
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-white/90">{stat.title}</p>
                  <stat.icon className="h-4 w-4 text-white/80" />
                </div>
                <p className="text-xl md:text-2xl font-bold">
                  {stat.isPercent 
                    ? `${stat.value >= 0 ? '+' : ''}${stat.value.toFixed(1)}%`
                    : formatCurrency(stat.value).replace("MYR", "RM")
                  }
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {analytics && analytics.yearlyData.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.yearlyData.slice().reverse()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="totalRevenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalProfit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tahun..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2.5 px-3 font-medium text-sm">Tahun</th>
                  <th className="text-right py-2.5 px-3 font-medium text-sm">Total Revenue</th>
                  <th className="text-right py-2.5 px-3 font-medium text-sm">Total Profit</th>
                  <th className="text-right py-2.5 px-3 font-medium text-sm">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredYearlySales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Tiada rekod ditemui
                    </td>
                  </tr>
                ) : (
                  filteredYearlySales.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-sm font-medium">{record.year}</td>
                      <td className="py-2.5 px-3 text-sm text-right">{formatCurrency(record.total_revenue)}</td>
                      <td className="py-2.5 px-3 text-sm text-right">{formatCurrency(record.total_profit)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditRecord(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRecord(record.id, record.year)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {isAddFormOpen && (
        <YearlySalesForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchYearlySalesData}
        />
      )}
      
      {isEditFormOpen && selectedRecord && (
        <YearlySalesForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          salesRecord={selectedRecord}
          onSuccess={fetchYearlySalesData}
        />
      )}
      
      {isDeleteDialogOpen && selectedRecord && (
        <DeleteYearlySalesDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          salesRecordId={selectedRecordId}
          salesYear={selectedRecord.year}
          onSuccess={fetchYearlySalesData}
        />
      )}
    </MainLayout>
  );
}
