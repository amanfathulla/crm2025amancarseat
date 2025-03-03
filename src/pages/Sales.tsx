import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, MoreHorizontal, PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YearlySalesForm } from "@/components/sales/YearlySalesForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { YearlySalesRecord, SalesAnalytics } from "@/types/sales";
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

export default function Sales() {
  const { toast } = useToast();
  const [yearlySales, setYearlySales] = useState<YearlySalesRecord[]>([]);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      // Fetch yearly sales data
      const { data, error } = await supabase
        .from("yearly_sales")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;

      // Convert the database records to our app's type format
      const typedData = data?.map(record => ({
        id: record.id,
        year: record.year,
        total_revenue: record.total_revenue,
        quarter_1: record.quarter_1,
        quarter_2: record.quarter_2,
        quarter_3: record.quarter_3,
        quarter_4: record.quarter_4,
        created_at: record.created_at
      })) || [];
      
      setYearlySales(typedData);
      
      // Generate analytics
      if (typedData.length >= 2) {
        const sortedYears = [...typedData].sort((a, b) => b.year - a.year);
        const currentYear = sortedYears[0];
        const previousYear = sortedYears[1];
        
        const percentageChange = previousYear.total_revenue > 0
          ? ((currentYear.total_revenue - previousYear.total_revenue) / previousYear.total_revenue) * 100
          : 100;
        
        // Since we're no longer tracking quarterly data, we'll set equal values for visualization
        const quarterlyData = [
          {
            quarter: "Q1",
            currentYear: currentYear.total_revenue / 4,
            previousYear: previousYear.total_revenue / 4,
          },
          {
            quarter: "Q2",
            currentYear: currentYear.total_revenue / 4,
            previousYear: previousYear.total_revenue / 4,
          },
          {
            quarter: "Q3",
            currentYear: currentYear.total_revenue / 4,
            previousYear: previousYear.total_revenue / 4,
          },
          {
            quarter: "Q4",
            currentYear: currentYear.total_revenue / 4,
            previousYear: previousYear.total_revenue / 4,
          },
        ];
        
        setAnalytics({
          currentYearRevenue: currentYear.total_revenue,
          previousYearRevenue: previousYear.total_revenue,
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

  useEffect(() => {
    fetchSalesData();
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Sales</h1>
        <p className="text-muted-foreground">Manage orders and sales analytics</p>
      </section>
      
      {/* Sales Analytics */}
      <Card className="mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Performance overview for yearly sales</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Not enough data to display analytics. Add at least two years of sales data.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Revenue (Current Year)</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.currentYearRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Revenue (Previous Year)</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.previousYearRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Year-Over-Year Change</p>
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
      
      {/* Yearly Sales Records */}
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Yearly Sales Records</CardTitle>
            <CardDescription>View and manage yearly sales data</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddFormOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Year
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Year</th>
                  <th className="text-right py-3 px-4 font-medium">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-muted-foreground">
                      Loading sales data...
                    </td>
                  </tr>
                ) : yearlySales.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-muted-foreground">
                      No sales data found. Add your first year record to get started.
                    </td>
                  </tr>
                ) : (
                  yearlySales.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{record.year}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {formatCurrency(record.total_revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Orders List */}
      <Tabs defaultValue="all" className="animate-fade-in delay-200 mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Payment</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <OrderRow 
                      id="ORD-7291" 
                      customer="Sarah Johnson" 
                      date="July 12, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$129.99" 
                    />
                    <OrderRow 
                      id="ORD-7290" 
                      customer="Michael Chen" 
                      date="July 11, 2023" 
                      status="Processing" 
                      payment="PayPal"
                      amount="$59.49" 
                    />
                    <OrderRow 
                      id="ORD-7289" 
                      customer="Emma Watson" 
                      date="July 10, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$89.99" 
                    />
                    <OrderRow 
                      id="ORD-7288" 
                      customer="James Wilson" 
                      date="July 9, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$144.95" 
                    />
                    <OrderRow 
                      id="ORD-7287" 
                      customer="Olivia Martinez" 
                      date="July 9, 2023" 
                      status="Shipped" 
                      payment="PayPal"
                      amount="$249.99" 
                    />
                    <OrderRow 
                      id="ORD-7286" 
                      customer="Noah Garcia" 
                      date="July 8, 2023" 
                      status="Pending" 
                      payment="Credit Card"
                      amount="$74.95" 
                    />
                    <OrderRow 
                      id="ORD-7285" 
                      customer="Ava Miller" 
                      date="July 8, 2023" 
                      status="Processing" 
                      payment="PayPal"
                      amount="$129.99" 
                    />
                    <OrderRow 
                      id="ORD-7284" 
                      customer="William Brown" 
                      date="July 7, 2023" 
                      status="Shipped" 
                      payment="Credit Card"
                      amount="$189.95" 
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered pending orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processing" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered processing orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered completed orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Yearly Sales Form */}
      {isAddFormOpen && (
        <YearlySalesForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchSalesData}
        />
      )}
    </MainLayout>
  );
}

function OrderRow({ id, customer, date, status, payment, amount }: { id: string; customer: string; date: string; status: string; payment: string; amount: string }) {
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{id}</td>
      <td className="py-3 px-4 text-sm">{customer}</td>
      <td className="py-3 px-4 text-sm">{date}</td>
      <td className="py-3 px-4 text-sm">
        <span className={`py-1 px-2 rounded-full text-xs font-medium ${
          status === "Completed" ? "bg-emerald-100 text-emerald-800" :
          status === "Processing" ? "bg-blue-100 text-blue-800" :
          status === "Shipped" ? "bg-amber-100 text-amber-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm">{payment}</td>
      <td className="py-3 px-4 text-sm text-right font-medium">{amount}</td>
      <td className="py-3 px-4 text-sm text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
