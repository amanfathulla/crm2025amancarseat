
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, MoreHorizontal, PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesRecordForm } from "@/components/sales/SalesRecordForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SalesRecord, SalesAnalytics } from "@/types/sales";
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
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      // Fetch sales records
      const { data, error } = await supabase
        .from("sales_records")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      // Convert the database records to our app's type format
      const typedData = data?.map(record => ({
        id: record.id,
        date: record.date,
        amount: record.amount,
        description: record.description,
        category: record.category,
        created_at: record.created_at
      })) || [];
      
      setSalesRecords(typedData);
      
      // Generate analytics if we have data
      if (typedData.length >= 2) {
        // Calculate total revenue for current and previous months
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const currentMonthData = typedData.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === currentMonth && 
                 recordDate.getFullYear() === currentYear;
        });
        
        const previousMonthData = typedData.filter(record => {
          const recordDate = new Date(record.date);
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return recordDate.getMonth() === prevMonth && 
                 recordDate.getFullYear() === prevYear;
        });
        
        const currentMonthRevenue = currentMonthData.reduce((sum, record) => sum + record.amount, 0);
        const previousMonthRevenue = previousMonthData.reduce((sum, record) => sum + record.amount, 0);
        
        const percentageChange = previousMonthRevenue > 0
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 100;
        
        // Create quarterly data for chart visualization
        const quarterlyData = [
          {
            quarter: "Q1",
            currentYear: getQuarterRevenue(typedData, 0, currentYear),
            previousYear: getQuarterRevenue(typedData, 0, currentYear - 1),
          },
          {
            quarter: "Q2",
            currentYear: getQuarterRevenue(typedData, 3, currentYear),
            previousYear: getQuarterRevenue(typedData, 3, currentYear - 1),
          },
          {
            quarter: "Q3",
            currentYear: getQuarterRevenue(typedData, 6, currentYear),
            previousYear: getQuarterRevenue(typedData, 6, currentYear - 1),
          },
          {
            quarter: "Q4",
            currentYear: getQuarterRevenue(typedData, 9, currentYear),
            previousYear: getQuarterRevenue(typedData, 9, currentYear - 1),
          },
        ];
        
        setAnalytics({
          currentYearRevenue: currentMonthRevenue,
          previousYearRevenue: previousMonthRevenue,
          percentageChange,
          quarterlyData,
        });
      } else {
        setAnalytics(null);
      }
      
    } catch (error: any) {
      console.error("Error fetching sales data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sales data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get revenue for a specific quarter and year
  const getQuarterRevenue = (records: SalesRecord[], startMonth: number, year: number) => {
    return records.filter(record => {
      const date = new Date(record.date);
      const month = date.getMonth();
      return date.getFullYear() === year && 
             month >= startMonth && 
             month < startMonth + 3;
    }).reduce((sum, record) => sum + record.amount, 0);
  };

  useEffect(() => {
    fetchSalesData();
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter sales records based on search query
  const filteredSalesRecords = salesRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const descriptionMatch = record.description?.toLowerCase().includes(searchLower) || false;
    const categoryMatch = record.category?.toLowerCase().includes(searchLower) || false;
    const amountMatch = record.amount.toString().includes(searchQuery);
    const dateMatch = record.date.includes(searchQuery);
    
    return descriptionMatch || categoryMatch || amountMatch || dateMatch;
  });

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Sales</h1>
        <p className="text-muted-foreground">Manage sales records and analytics</p>
      </section>
      
      {/* Sales Analytics */}
      <Card className="mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Performance overview for monthly sales</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Not enough data to display analytics. Add at least two sales records.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Revenue (Current Month)</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.currentYearRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Revenue (Previous Month)</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.previousYearRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Month-Over-Month Change</p>
                      <div className="flex items-center justify-center">
                        {analytics.percentageChange >= 0 ? (
                          <TrendingUp className="mr-2 h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                        )}
                        <p 
                          className={`text-3xl font-bold ${
                            analytics.percentageChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {analytics.percentageChange >= 0 ? '+' : ''}
                          {analytics.percentageChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.quarterlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'Revenue']}
                    />
                    <Legend />
                    <Bar dataKey="currentYear" name="Current Year" fill="#4f46e5" />
                    <Bar dataKey="previousYear" name="Previous Year" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Sales Records */}
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>View and manage individual sales transactions</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddFormOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Sale
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 w-full mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Description</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading sales data...
                    </td>
                  </tr>
                ) : filteredSalesRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      {searchQuery ? "No matching sales records found." : "No sales records found. Add your first sale to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredSalesRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">
                        {format(new Date(record.date), 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.category || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Sales Record Form */}
      {isAddFormOpen && (
        <SalesRecordForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchSalesData}
        />
      )}
    </MainLayout>
  );
}
