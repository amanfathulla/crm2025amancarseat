import { useState, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Edit, Trash, PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YearlySalesForm } from "@/components/sales/YearlySalesForm";
import { DeleteYearlySalesDialog } from "@/components/sales/DeleteYearlySalesDialog";
import { useAuth } from "@/hooks/useAuth";
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
  const { authClient } = useAuth();
  const [yearlySales, setYearlySales] = useState<YearlySalesRecord[]>([]);
  const [analytics, setAnalytics] = useState<YearlyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<YearlySalesFormData | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  
  const fetchYearlySalesData = async () => {
    setIsLoading(true);
    try {
      // Fetch yearly sales records
      const { data, error } = await authClient
        .from("yearly_sales")
        .select("*")
        .order("year", { ascending: false });

      if (error) throw error;

      // Convert the database records to our app's type format
      const typedData = data?.map(record => ({
        id: record.id,
        year: record.year,
        total_revenue: record.total_revenue,
        total_profit: record.total_profit || 0, // Handle null values
        quarter_1: record.quarter_1,
        quarter_2: record.quarter_2,
        quarter_3: record.quarter_3,
        quarter_4: record.quarter_4,
        created_at: record.created_at
      })) || [];
      
      setYearlySales(typedData);
      
      // Set last updated time
      setLastUpdated(format(new Date(), "d MMMM yyyy 'at' hh:mm a"));
      
      // Generate analytics if we have data
      if (typedData.length >= 1) {
        // Sort by year to ensure correct order
        const sortedData = [...typedData].sort((a, b) => b.year - a.year);
        
        const currentYear = new Date().getFullYear();
        const currentYearData = sortedData.find(record => record.year === currentYear);
        const previousYearData = sortedData.find(record => record.year === currentYear - 1);
        
        const currentYearRevenue = currentYearData ? currentYearData.total_revenue : 0;
        const previousYearRevenue = previousYearData ? previousYearData.total_revenue : 0;
        const currentYearProfit = currentYearData ? currentYearData.total_profit : 0;
        const previousYearProfit = previousYearData ? previousYearData.total_profit : 0;
        
        // Calculate total revenue across all years
        const totalAllTimeRevenue = sortedData.reduce((total, record) => total + record.total_revenue, 0);
        const totalAllTimeProfit = sortedData.reduce((total, record) => total + (record.total_profit || 0), 0);
        
        const percentageChange = previousYearRevenue > 0
          ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
          : currentYearRevenue > 0 ? 100 : 0;
        
        // Create yearly data for chart visualization
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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handle edit record
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

  // Handle delete record
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

  // Filter yearly sales records based on search query
  const filteredYearlySales = yearlySales.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const yearMatch = record.year.toString().includes(searchQuery);
    const revenueMatch = record.total_revenue.toString().includes(searchQuery);
    
    return yearMatch || revenueMatch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Yearly Sales</h1>
        <p className="text-muted-foreground text-sm">Manage yearly sales records and analytics</p>
      </section>
      
      {/* Enhanced Sales Analytics */}
      <Card className="mb-8 animate-fade-in">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                {analytics && (
                  <>
                    Yearly sales records ({analytics.minYear}-{analytics.maxYear})
                    <div className="text-xs text-muted-foreground mt-1">
                      Last updated: {lastUpdated}
                    </div>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Not enough data to display analytics. Add at least one yearly sales record.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Revenue Card */}
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(analytics.totalAllTimeRevenue).replace("MYR", "RM")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">All-time total</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Total Profit Card */}
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">Total Profit</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(analytics.totalAllTimeProfit).replace("MYR", "RM")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">All-time total</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Year-over-Year Growth Card */}
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      {analytics.percentageChange >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-rose-500" />
                      )}
                      <span className="text-sm text-muted-foreground">Year-over-Year Growth</span>
                    </div>
                    <div>
                      <p 
                        className={`text-2xl font-bold ${
                          analytics.percentageChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {analytics.percentageChange >= 0 ? '+' : ''}
                        {analytics.percentageChange.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Current year vs previous</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Current Year Card */}
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Current Year ({new Date().getFullYear()})</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatCurrency(analytics.currentYearRevenue).replace("MYR", "RM")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Year to date</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.yearlyData.slice().reverse()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'Revenue']}
                    />
                    <Legend />
                    <Bar dataKey="totalRevenue" name="Total Revenue (RM)" fill="#4f46e5" />
                    <Bar dataKey="totalProfit" name="Total Profit (RM)" fill="#10b981" />
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
            Add Yearly Record
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 w-full mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by year..."
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
                  <th className="text-left py-3 px-4 font-medium">Year</th>
                  <th className="text-right py-3 px-4 font-medium">Total Revenue (RM)</th>
                  <th className="text-right py-3 px-4 font-medium">Total Profit (RM)</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Loading yearly sales data...
                    </td>
                  </tr>
                ) : filteredYearlySales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      {searchQuery ? "No matching yearly sales records found." : "No yearly sales records found. Add your first record to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredYearlySales.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">
                        {record.year}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {formatCurrency(record.total_revenue)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        {formatCurrency(record.total_profit)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRecord(record.id, record.year)}
                          >
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
        </CardContent>
      </Card>
      
      {/* Add Yearly Sales Record Form */}
      {isAddFormOpen && (
        <YearlySalesForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchYearlySalesData}
        />
      )}
      
      {/* Edit Yearly Sales Record Form */}
      {isEditFormOpen && selectedRecord && (
        <YearlySalesForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          salesRecord={selectedRecord}
          onSuccess={fetchYearlySalesData}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedRecord && (
        <DeleteYearlySalesDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          salesRecordId={selectedRecordId}
          salesYear={selectedRecord.year}
          onSuccess={fetchYearlySalesData}
        />
      )}
    </div>
  );
}
