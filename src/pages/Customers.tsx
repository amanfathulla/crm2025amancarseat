import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, UserPlus, MoreHorizontal, Pencil, Trash2, 
  Users, DollarSign, TrendingUp, Filter, MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { Customer, CustomerFormData } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// Malaysian states
const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
  "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"
];

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [stateStats, setStateStats] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    grossProfit: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
  
  // Sort options
  const [sortBy, setSortBy] = useState<string>("order_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Form states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | null>(null);
  
  // Check for status filter from URL
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("*");
      
      // Apply status filter if set
      if (statusFilter) {
        query = query.eq("order_status", statusFilter);
      }
      
      // Apply state filter if set
      if (stateFilter) {
        query = query.eq("city", stateFilter);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortDirection === "asc" });
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Map database records to our Customer type
      const mappedCustomers = data?.map(record => ({
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone || "",
        location: record.city || record.address || "",
        car_model: record.car_model || "",  
        product: record.product || "",
        product_variation: record.product_variation || "",
        sales_amount: record.sales_amount || 0,
        gross_profit: record.gross_profit || 0,
        order_date: record.order_date || "",
        order_status: record.order_status || "processing",
        total_orders: record.total_orders || 0,
        total_spent: record.total_spent || 0,
        created_at: record.created_at || "",
        updated_at: record.updated_at || "",
      })) || [];
      
      setCustomers(mappedCustomers);
      
      // Calculate stats
      const stats = calculateCustomerStats(mappedCustomers);
      setCustomerStats(stats);
      
      // Calculate state statistics
      calculateStateStats();
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load customers.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch state statistics - updated to ensure all states are displayed
  const calculateStateStats = async () => {
    try {
      // Initialize data for all states with zero values
      const initialStateData = malaysianStates.map(state => ({
        state,
        count: 0,
        amount: 0
      }));
      
      // Fetch order counts and sales amounts for each state
      for (let i = 0; i < malaysianStates.length; i++) {
        const state = malaysianStates[i];
        const { data, error } = await supabase
          .from("customers")
          .select("id, sales_amount")
          .eq("city", state);
          
        if (error) {
          console.error(`Error fetching data for ${state}:`, error);
          continue;
        }
        
        // Update data if orders exist for this state
        if (data && data.length > 0) {
          const count = data.length;
          const totalAmount = data.reduce((sum, customer) => sum + (customer.sales_amount || 0), 0);
          
          // Update the corresponding state in our array
          initialStateData[i].count = count;
          initialStateData[i].amount = totalAmount;
        }
      }
      
      // Sort by count descending
      initialStateData.sort((a, b) => b.count - a.count);
      
      setStateStats(initialStateData);
    } catch (error) {
      console.error("Error calculating state stats:", error);
    }
  };

  const calculateCustomerStats = (customers: Customer[]) => {
    const totalCustomers = customers.length;
    const totalSales = customers.reduce((sum, customer) => sum + customer.sales_amount, 0);
    const grossProfit = customers.reduce((sum, customer) => sum + customer.gross_profit, 0);
    
    // Count all orders by status (regardless of current filters)
    const processingOrders = customers.filter(c => c.order_status === "processing").length;
    const completedOrders = customers.filter(c => c.order_status === "completed").length;
    const cancelledOrders = customers.filter(c => c.order_status === "cancelled").length;
    
    return {
      totalCustomers,
      totalSales,
      grossProfit,
      processingOrders,
      completedOrders,
      cancelledOrders
    };
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, stateFilter, sortBy, sortDirection]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const clearFilters = () => {
    setStatusFilter(null);
    setStateFilter(null);
    setSearchParams({});
  };
  
  const handleStateFilter = (state: string) => {
    setStateFilter(state === stateFilter ? null : state);
  };
  
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? null : status);
    
    // Update URL params
    if (status === statusFilter) {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if clicking on same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.car_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.product_variation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.order_status && customer.order_status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
      car_model: customer.car_model,
      product: customer.product,
      product_variation: customer.product_variation,
      sales_amount: customer.sales_amount,
      gross_profit: customer.gross_profit,
      order_date: customer.order_date,
      order_status: customer.order_status || "processing",
    });
    setIsEditFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
      car_model: customer.car_model,
      product: customer.product,
      product_variation: customer.product_variation,
      sales_amount: customer.sales_amount,
      gross_profit: customer.gross_profit,
      order_date: customer.order_date,
      order_status: customer.order_status || "processing",
    });
    setIsDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };
  
  // Chart colors
  const stateColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EC4899", 
    "#8B5CF6", "#06B6D4", "#84CC16", "#EF4444", "#F97316",
    "#14B8A6", "#6D28D9", "#D946EF", "#0EA5E9"
  ];

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow-lg border">
          <p className="font-bold">{label}</p>
          <p className="text-sm">Orders: <span className="font-medium">{payload[0].value}</span></p>
          <p className="text-sm">Sales: <span className="font-medium">{formatCurrency(payload[0].payload.amount)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </section>
      
      {/* Customer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fade-in">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <span className="text-3xl font-bold mt-1">{customerStats.totalCustomers}</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Sales</span>
              <span className="text-3xl font-bold mt-1">{formatCurrency(customerStats.totalSales)}</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Gross Profit</span>
              <span className="text-3xl font-bold mt-1">{formatCurrency(customerStats.grossProfit)}</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Status Stats */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Card 
          className={`flex-1 min-w-[180px] cursor-pointer ${statusFilter === 'processing' ? 'border-primary' : ''}`}
          onClick={() => handleStatusFilter('processing')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="secondary" className="h-6 px-3">
              {customerStats.processingOrders}
            </Badge>
            <span className="font-medium">Orders In Process</span>
          </CardContent>
        </Card>
        
        <Card 
          className={`flex-1 min-w-[180px] cursor-pointer ${statusFilter === 'completed' ? 'border-primary' : ''}`}
          onClick={() => handleStatusFilter('completed')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="default" className="h-6 px-3">
              {customerStats.completedOrders}
            </Badge>
            <span className="font-medium">Completed Orders</span>
          </CardContent>
        </Card>
        
        <Card 
          className={`flex-1 min-w-[180px] cursor-pointer ${statusFilter === 'cancelled' ? 'border-primary' : ''}`}
          onClick={() => handleStatusFilter('cancelled')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="destructive" className="h-6 px-3">
              {customerStats.cancelledOrders}
            </Badge>
            <span className="font-medium">Cancelled Orders</span>
          </CardContent>
        </Card>
      </div>
      
      {/* Malaysia States Chart - Updated to show all states */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Orders by Malaysian States (Negeri)</CardTitle>
          <CardDescription>Overview of orders distribution across all Malaysian states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stateStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="state" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Orders" onClick={(data) => handleStateFilter(data.state)}>
                  {stateStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={stateColors[index % stateColors.length]} 
                      fillOpacity={stateFilter === entry.state ? 1 : entry.count > 0 ? 0.75 : 0.25}
                      stroke={stateFilter === entry.state ? "#000" : "none"}
                      strokeWidth={stateFilter === entry.state ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in delay-100 shadow-soft">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="font-semibold tracking-tight">All Customers</CardTitle>
            <CardDescription>
              {statusFilter || stateFilter ? (
                <div className="flex items-center gap-2">
                  <span>Filtered view</span>
                  {statusFilter && (
                    <Badge variant={
                      statusFilter === 'processing' ? 'secondary' :
                      statusFilter === 'completed' ? 'default' : 'destructive'
                    }>
                      {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </Badge>
                  )}
                  {stateFilter && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin size={12} />
                      {stateFilter}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
                    Clear filters
                  </Button>
                </div>
              ) : 'View and manage your customer list'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9 w-full sm:w-[260px]"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-10 w-10">
                  <Filter size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-0">Order Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "processing"}
                    onCheckedChange={() => handleStatusFilter("processing")}
                  >
                    In Process
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "completed"}
                    onCheckedChange={() => handleStatusFilter("completed")}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "cancelled"}
                    onCheckedChange={() => handleStatusFilter("cancelled")}
                  >
                    Cancelled
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-0">State (Negeri)</DropdownMenuLabel>
                  {malaysianStates.map(state => (
                    <DropdownMenuCheckboxItem
                      key={state}
                      checked={stateFilter === state}
                      onCheckedChange={() => handleStateFilter(state)}
                    >
                      {state}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-0">Sort By</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSort("order_date")}>
                    Order Date {sortBy === "order_date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("name")}>
                    Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort("sales_amount")}>
                    Sales Amount {sortBy === "sales_amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" className="whitespace-nowrap" onClick={() => setIsAddFormOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Name</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Email</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Phone</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">State</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Car Model</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Product</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Variation</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4 text-right">Sales Amount</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4 text-right">Profit</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Order Date</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Status</TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      {searchQuery || statusFilter || stateFilter
                        ? "No customers match your search criteria."
                        : "No customers found. Add your first customer to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      onEdit={() => handleEditCustomer(customer)}
                      onDelete={() => handleDeleteCustomer(customer)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Form Dialog */}
      {isAddFormOpen && (
        <CustomerForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchCustomers}
          malaysianStates={malaysianStates}
        />
      )}

      {/* Edit Customer Form Dialog */}
      {isEditFormOpen && selectedCustomer && (
        <CustomerForm
          isOpen={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onSuccess={fetchCustomers}
          malaysianStates={malaysianStates}
        />
      )}

      {/* Delete Customer Dialog */}
      {isDeleteDialogOpen && selectedCustomer && (
        <DeleteCustomerDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedCustomer(null);
          }}
          customerEmail={selectedCustomer.email}
          customerName={selectedCustomer.name}
          onSuccess={fetchCustomers}
        />
      )}
    </MainLayout>
  );
}

function CustomerRow({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "processing":
        return <Badge variant="secondary">In Process</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <TableRow className="border-b hover:bg-muted/30 transition-colors">
      <TableCell className="py-3 px-4 text-sm font-medium">{customer.name}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.email}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.phone}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.location}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.car_model}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.product}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{customer.product_variation}</TableCell>
      <TableCell className="py-3 px-4 text-sm font-medium text-right">{formatCurrency(customer.sales_amount)}</TableCell>
      <TableCell className="py-3 px-4 text-sm font-medium text-right">{formatCurrency(customer.gross_profit)}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{formatDate(customer.order_date)}</TableCell>
      <TableCell className="py-3 px-4 text-sm">{getStatusBadge(customer.order_status || "processing")}</TableCell>
      <TableCell className="py-3 px-4 text-sm text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

