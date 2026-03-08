import { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, UserPlus, MoreHorizontal, Pencil, Trash2, 
  Users, DollarSign, TrendingUp, Filter, MapPin, FileDown, FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Accordion } from "@/components/ui/accordion";
import { CustomerDetails } from "@/components/customers/CustomerDetails";
import { compareDates, formatCurrency } from "@/lib/utils";
import { DownloadCustomersDialog } from "@/components/customers/DownloadCustomersDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkDeleteCustomersDialog } from "@/components/customers/BulkDeleteCustomersDialog";

const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
  "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"
];

const CUSTOMERS_PER_PAGE = 20;

function Customers() {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const navigate = useNavigate();
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  const [sortBy, setSortBy] = useState<string>("order_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | null>(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      let countQuery = supabase
        .from("customers")
        .select("id", { count: "exact" });
      
      if (statusFilter) {
        countQuery = countQuery.eq("order_status", statusFilter);
      }
      
      if (stateFilter) {
        countQuery = countQuery.eq("city", stateFilter);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      if (count !== null) {
        setTotalCustomers(count);
        setTotalPages(Math.ceil(count / CUSTOMERS_PER_PAGE));
      }
      
      let query = supabase
        .from("customers")
        .select("*");
      
      if (statusFilter) {
        query = query.eq("order_status", statusFilter);
      }
      
      if (stateFilter) {
        query = query.eq("city", stateFilter);
      }
      
      const startIndex = (currentPage - 1) * CUSTOMERS_PER_PAGE;
      query = query
        .order(sortBy, { ascending: sortDirection === "asc" })
        .range(startIndex, startIndex + CUSTOMERS_PER_PAGE - 1);
      
      const { data, error } = await query;

      if (error) throw error;
      
      const mappedCustomers = data?.map(record => ({
        id: record.id,
        name: record.name,
        email: record.email,
        phone: record.phone || "",
        location: record.city || "",
        address: record.address || "",
        city: record.city || "",
        state: record.state || "",
        zip_code: record.zip_code || "",
        car_model: record.car_model || "",  
        product: record.product || "",
        product_variation: record.product_variation || "",
        sales_amount: record.sales_amount || 0,
        gross_profit: record.gross_profit || 0,
        paid_amount: record.paid_amount || 0,
        order_date: record.order_date || "",
        order_status: record.order_status || "processing",
        order_time: record.order_time || "",
        total_orders: record.total_orders || 0,
        total_spent: record.total_spent || 0,
        created_at: record.created_at || "",
        updated_at: record.updated_at || "",
        order_number: (record as any).order_number || null,
      })) || [];
      
      setCustomers(mappedCustomers);
      
      const stats = calculateCustomerStats(mappedCustomers);
      setCustomerStats(stats);
      
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

  const calculateStateStats = async () => {
    try {
      const initialStateData = malaysianStates.map(state => ({
        state,
        count: 0,
        amount: 0
      }));
      
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
        
        if (data && data.length > 0) {
          const count = data.length;
          const totalAmount = data.reduce((sum, customer) => sum + (customer.sales_amount || 0), 0);
          
          initialStateData[i].count = count;
          initialStateData[i].amount = totalAmount;
        }
      }
      
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
  }, [statusFilter, stateFilter, sortBy, sortDirection, currentPage]);

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
    
    if (status === statusFilter) {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };
  
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
      address: customer.address,
      car_model: customer.car_model,
      product: customer.product,
      product_variation: customer.product_variation,
      sales_amount: customer.sales_amount,
      gross_profit: customer.gross_profit,
      paid_amount: customer.paid_amount,
      order_date: customer.order_date,
      order_status: customer.order_status || "processing",
      order_time: customer.order_time,
      payment_status: customer.payment_status,
    });
    setIsEditFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
      address: customer.address,
      car_model: customer.car_model,
      product: customer.product,
      product_variation: customer.product_variation,
      sales_amount: customer.sales_amount,
      gross_profit: customer.gross_profit,
      paid_amount: customer.paid_amount,
      order_date: customer.order_date,
      order_status: customer.order_status || "processing",
      order_time: customer.order_time,
      payment_status: customer.payment_status,
    });
    setIsDeleteDialogOpen(true);
  };

  const handleGenerateReceipt = (customerId: string) => {
    navigate(`/customers/receipt?id=${customerId}`);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  const stateColors = [
    "#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EC4899", 
    "#8B5CF6", "#06B6D4", "#84CC16", "#EF4444", "#F97316",
    "#14B8A6", "#6D28D9", "#D946EF", "#0EA5E9"
  ];

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

  const renderPaginationItems = () => {
    const items = [];
    
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers(prev => [...prev, customerId]);
    } else {
      setSelectedCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const renderCustomerActions = (customer: Customer) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleGenerateReceipt(customer.id)}
          title="Generate Receipt"
        >
          <FileText className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEditCustomer(customer)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDeleteCustomer(customer)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground text-sm">Manage your customer base</p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fade-in">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <span className="text-3xl font-bold mt-1">{totalCustomers}</span>
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
          <div className="flex items-center gap-4 w-full">
            {filteredCustomers.length > 0 && (
              <Checkbox 
                checked={selectedCustomers.length === filteredCustomers.length}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                className="h-5 w-5"
              />
            )}
            <div className="flex items-center gap-2">
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
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedCustomers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus ({selectedCustomers.length})
              </Button>
            )}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9 w-full sm:w-[260px]"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDownloadDialogOpen(true)}
              className="whitespace-nowrap"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Muat Turun
            </Button>
            
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
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery || statusFilter || stateFilter
                ? "No customers match your search criteria."
                : "No customers found. Add your first customer to get started."}
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full">
                {filteredCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={(checked) => 
                        handleSelectCustomer(customer.id, checked as boolean)
                      }
                      className="mt-5 h-5 w-5"
                    />
                    <CustomerDetails
                      customer={customer}
                      onEdit={() => handleEditCustomer(customer)}
                      onDelete={() => handleDeleteCustomer(customer)}
                      index={(currentPage - 1) * CUSTOMERS_PER_PAGE + index + 1}
                      className="flex-1"
                    />
                  </div>
                ))}
              </Accordion>
              
              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : 0}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : 0}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isAddFormOpen && (
        <CustomerForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSuccess={fetchCustomers}
          malaysianStates={malaysianStates}
        />
      )}

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

      {isDownloadDialogOpen && (
        <DownloadCustomersDialog
          isOpen={isDownloadDialogOpen}
          onClose={() => setIsDownloadDialogOpen(false)}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <BulkDeleteCustomersDialog
          isOpen={isBulkDeleteDialogOpen}
          onClose={() => {
            setIsBulkDeleteDialogOpen(false);
            setSelectedCustomers([]);
          }}
          selectedCustomers={selectedCustomers}
          onSuccess={() => {
            fetchCustomers();
            setSelectedCustomers([]);
          }}
        />
      )}
    </div>
  );
}

export default Customers;
