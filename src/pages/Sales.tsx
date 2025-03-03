
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Edit, Trash, PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      // Fetch yearly sales records
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
      
      // Generate analytics if we have data
      if (typedData.length >= 2) {
        // Sort by year to ensure correct order
        const sortedData = [...typedData].sort((a, b) => b.year - a.year);
        
        const currentYear = new Date().getFullYear();
        const currentYearData = sortedData.find(record => record.year === currentYear);
        const previousYearData = sortedData.find(record => record.year === currentYear - 1);
        
        const currentYearRevenue = currentYearData ? currentYearData.total_revenue : 0;
        const previousYearRevenue = previousYearData ? previousYearData.total_revenue : 0;
        
        const percentageChange = previousYearRevenue > 0
          ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
          : currentYearRevenue > 0 ? 100 : 0;
        
        // Create yearly data for chart visualization
        const yearlyData = sortedData.slice(0, 5).map(record => ({
          year: record.year,
          totalRevenue: record.total_revenue,
        }));
        
        setAnalytics({
          currentYearRevenue,
          previousYearRevenue,
          percentageChange,
          yearlyData,
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
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Yearly Sales</h1>
        <p className="text-muted-foreground">Manage yearly sales records and analytics</p>
      </section>
      
      {/* Sales Analytics */}
      <Card className="mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Yearly performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : !analytics ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Not enough data to display analytics. Add at least two yearly sales records.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Current Year Revenue</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.currentYearRevenue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Previous Year Revenue</p>
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
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Loading yearly sales data...
                    </td>
                  </tr>
                ) : filteredYearlySales.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
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
    </MainLayout>
  );
}
