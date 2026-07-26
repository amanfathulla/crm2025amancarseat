import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, UserPlus, MoreHorizontal, Pencil, Trash2, 
  Users, DollarSign, TrendingUp, Filter, MapPin, FileDown, FileText, Calculator,
  Clock, CheckCircle, XCircle
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
import { CustomerOrdersDialog } from "@/components/customers/CustomerOrdersDialog";
import { compareDates, formatCurrency } from "@/lib/utils";
import { DownloadCustomersDialog } from "@/components/customers/DownloadCustomersDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkDeleteCustomersDialog } from "@/components/customers/BulkDeleteCustomersDialog";
import { MalaysiaMap } from "@/components/customers/MalaysiaMap";

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
  const [groupByPhone, setGroupByPhone] = useState(true);
  const [ordersPhone, setOrdersPhone] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [stateStats, setStateStats] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    grossProfit: 0,
    salesCurrentYear: 0,
    profitCurrentYear: 0,
    salesPreviousYear: 0,
    profitPreviousYear: 0,
    earliestYear: null as number | null,
    latestYear: null as number | null,
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
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateProfit = async () => {
    if (!confirm("Kira semula Gross Profit untuk semua order yang bernilai RM 0.00? Kos akan diambil dari halaman Products.")) return;
    try {
      setIsRecalculating(true);
      const { data, error } = await authClient.rpc("recalculate_gross_profit_all", { p_only_zero: true });
      if (error) throw error;
      toast({
        title: "Gross Profit dikira semula",
        description: `${data ?? 0} rekod telah dikemaskini.`,
      });
      fetchCustomers();
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message || "Gagal kira semula", variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };
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
      let countQuery = authClient
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
      
      let query = authClient
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
        payment_source: (record as any).payment_source || (record as any).payment_gateway || "manual",
        payment_gateway: (record as any).payment_gateway || null,
        total_orders: record.total_orders || 0,
        total_spent: record.total_spent || 0,
        created_at: record.created_at || "",
        updated_at: record.updated_at || "",
        order_number: (record as any).order_number || null,
        seat_image_front: (record as any).seat_image_front || null,
        seat_image_back: (record as any).seat_image_back || null,
        seat_image_third_row: (record as any).seat_image_third_row || null,
        additional_notes: (record as any).additional_notes || null,
        payment_type: (record as any).payment_type || null,
        deposit_amount: Number((record as any).deposit_amount) || 0,
        balance_amount: Number((record as any).balance_amount) || 0,
      })) || [];
      
      setCustomers(mappedCustomers);
      
      await calculateCustomerStats();
      
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
      // Fetch all customers in one query and aggregate locally for accurate counts
      const { data, error } = await authClient
        .from("customers")
        .select("city, sales_amount");

      if (error) {
        console.error("Error fetching state stats:", error);
        return;
      }

      const aggregates = new Map<string, { count: number; amount: number }>();
      malaysianStates.forEach((s) => aggregates.set(s, { count: 0, amount: 0 }));

      (data || []).forEach((row: any) => {
        const stateName = (row.city || "").trim();
        if (!stateName) return;
        const entry = aggregates.get(stateName);
        if (entry) {
          entry.count += 1;
          entry.amount += parseFloat(String(row.sales_amount || 0));
        }
      });

      const stats = malaysianStates.map((state) => ({
        state,
        count: aggregates.get(state)?.count || 0,
        amount: aggregates.get(state)?.amount || 0,
      }));

      stats.sort((a, b) => b.count - a.count);
      setStateStats(stats);
    } catch (error) {
      console.error("Error calculating state stats:", error);
    }
  };

  const calculateCustomerStats = async () => {
    try {
      const { data, error, count } = await authClient
        .from("customers")
        .select("sales_amount, gross_profit, order_status, order_date, created_at", { count: "exact" });
      if (error) throw error;
      const rows = (data || []) as any[];
      const totalCustomers = count || rows.length;
      const totalSales = rows.reduce((s, r) => s + Number(r.sales_amount || 0), 0);
      const grossProfit = rows.reduce((s, r) => s + Number(r.gross_profit || 0), 0);

      const now = new Date();
      const currentYear = now.getFullYear();
      const previousYear = currentYear - 1;
      let salesCurrentYear = 0, profitCurrentYear = 0, salesPreviousYear = 0, profitPreviousYear = 0;
      let earliestYear: number | null = null;
      let latestYear: number | null = null;

      rows.forEach(r => {
        const d = r.order_date || r.created_at;
        if (!d) return;
        const y = new Date(d).getFullYear();
        if (isNaN(y)) return;
        if (earliestYear === null || y < earliestYear) earliestYear = y;
        if (latestYear === null || y > latestYear) latestYear = y;
        if (y === currentYear) {
          salesCurrentYear += Number(r.sales_amount || 0);
          profitCurrentYear += Number(r.gross_profit || 0);
        } else if (y === previousYear) {
          salesPreviousYear += Number(r.sales_amount || 0);
          profitPreviousYear += Number(r.gross_profit || 0);
        }
      });

      const processingOrders = rows.filter(r => r.order_status === "processing").length;
      const completedOrders = rows.filter(r => r.order_status === "completed").length;
      const cancelledOrders = rows.filter(r => r.order_status === "cancelled").length;

      setCustomerStats({
        totalCustomers,
        totalSales,
        grossProfit,
        salesCurrentYear,
        profitCurrentYear,
        salesPreviousYear,
        profitPreviousYear,
        earliestYear,
        latestYear,
        processingOrders,
        completedOrders,
        cancelledOrders,
      });
    } catch (err) {
      console.error("Error calculating customer stats:", err);
    }
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

  // Group by phone: 1 row per unique phone, with all their orders aggregated.
  const groupedCustomers = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of filteredCustomers) {
      const phone = (c.phone || "").trim();
      if (!phone) continue;
      const existing = map.get(phone);
      if (!existing) {
        map.set(phone, {
          phone,
          name: c.name,
          orders: [c],
          orderCount: 1,
          totalSpent: Number(c.sales_amount || 0),
          latestStatus: c.order_status,
          latestDate: c.order_date,
        });
      } else {
        existing.orders.push(c);
        existing.orderCount += 1;
        existing.totalSpent += Number(c.sales_amount || 0);
        if (new Date(c.order_date) > new Date(existing.latestDate || 0)) {
          existing.latestStatus = c.order_status;
          existing.latestDate = c.order_date;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.latestDate || "").localeCompare(a.latestDate || ""));
  }, [filteredCustomers]);

  const listData = groupByPhone ? groupedCustomers : filteredCustomers;

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
      
      {(() => {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        const { salesCurrentYear, profitCurrentYear, salesPreviousYear, profitPreviousYear, earliestYear, latestYear } = customerStats;
        const yearsRange = earliestYear && latestYear
          ? (earliestYear === latestYear ? `${earliestYear}` : `${earliestYear} – ${latestYear}`)
          : "—";
        const noDataThisYear = salesCurrentYear === 0;
        const lastDataYearNote = noDataThisYear && latestYear && latestYear < currentYear
          ? `Tiada data untuk ${currentYear}. Data terakhir: ${latestYear}`
          : null;

        return (
          <div className="space-y-3 mb-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/90">Total Customers</span>
                    <span className="text-3xl font-bold mt-1">{totalCustomers}</span>
                    <span className="text-[11px] text-white/70 mt-1">Sepanjang masa</span>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-white/90">Total Sales ({currentYear})</span>
                      <span className="text-3xl font-bold mt-1">{formatCurrency(salesCurrentYear)}</span>
                      <span className="text-[11px] text-white/80 mt-1">
                        Tahun lepas ({previousYear}): {formatCurrency(salesPreviousYear)}
                      </span>
                      <span className="text-[11px] text-white/70">
                        Sepanjang masa: {formatCurrency(customerStats.totalSales)} • Data: {yearsRange}
                      </span>
                      {lastDataYearNote && (
                        <span className="text-[11px] text-yellow-100 mt-1 font-medium">⚠ {lastDataYearNote}</span>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-white/90">Gross Profit ({currentYear})</span>
                      <span className="text-3xl font-bold mt-1">{formatCurrency(profitCurrentYear)}</span>
                      <span className="text-[11px] text-white/80 mt-1">
                        Tahun lepas ({previousYear}): {formatCurrency(profitPreviousYear)}
                      </span>
                      <span className="text-[11px] text-white/70">
                        Sepanjang masa: {formatCurrency(customerStats.grossProfit)} • Data: {yearsRange}
                      </span>
                      {lastDataYearNote && (
                        <span className="text-[11px] text-yellow-100 mt-1 font-medium">⚠ {lastDataYearNote}</span>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-white/90">In Process</span>
              <span className="text-3xl font-bold mt-1">{customerStats.processingOrders}</span>
              <span className="text-[11px] text-white/70 mt-1">Tempahan sedang diproses</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-white/90">Completed</span>
              <span className="text-3xl font-bold mt-1">{customerStats.completedOrders}</span>
              <span className="text-[11px] text-white/70 mt-1">Tempahan selesai</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-white/90">Cancelled</span>
              <span className="text-3xl font-bold mt-1">{customerStats.cancelledOrders}</span>
              <span className="text-[11px] text-white/70 mt-1">Tempahan dibatalkan</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Peta Tempahan Mengikut Negeri</CardTitle>
          <CardDescription>Klik mana-mana negeri pada peta untuk tapis senarai pelanggan</CardDescription>
        </CardHeader>
        <CardContent>
          <MalaysiaMap
            stateStats={stateStats}
            selectedState={stateFilter}
            onSelectState={handleStateFilter}
          />
        </CardContent>
      </Card>

      {/* ── Add Customer Section ── */}
      <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-3 animate-fade-in">
        <div>
          <p className="font-semibold text-foreground text-sm">Tambah Pelanggan Baru</p>
          <p className="text-muted-foreground text-xs">Rekod pesanan baharu secara manual</p>
        </div>
        <Button size="sm" onClick={() => setIsAddFormOpen(true)} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>
      
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
              onClick={handleRecalculateProfit}
              disabled={isRecalculating}
              className="whitespace-nowrap"
              title="Kira semula Gross Profit untuk order yang bernilai RM 0.00"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isRecalculating ? "Mengira..." : "Recalculate Profit"}
            </Button>

            <Button
              variant={groupByPhone ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByPhone((v) => !v)}
              className="whitespace-nowrap"
              title="Kumpulkan pelanggan mengikut nombor telefon"
            >
              <Users className="h-4 w-4 mr-2" />
              {groupByPhone ? "Group: Phone" : "Group: Order"}
            </Button>

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
            
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading customers...
            </div>
          ) : listData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery || statusFilter || stateFilter
                ? "No customers match your search criteria."
                : "No customers found. Add your first customer to get started."}
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full">
                {listData.map((entry, index) => {
                  if (groupByPhone) {
                    const g = entry as any;
                    const statusBadge =
                      g.latestStatus === "completed"
                        ? "bg-green-500/15 text-green-600 border-green-500/30"
                        : g.latestStatus === "cancelled"
                        ? "bg-red-500/15 text-red-600 border-red-500/30"
                        : "bg-yellow-500/15 text-yellow-600 border-yellow-500/30";
                    return (
                      <div key={g.phone} className="flex items-start gap-4 py-3 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setOrdersPhone(g.phone)}
                              className="font-semibold text-foreground hover:text-primary hover:underline"
                            >
                              {g.name || "—"}
                            </button>
                            <button
                              onClick={() => setOrdersPhone(g.phone)}
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              {g.phone}
                            </button>
                            <Badge variant="secondary" className="text-xs">
                              {g.orderCount} order
                            </Badge>
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${statusBadge}`}>
                              {g.latestStatus === "completed" ? "Completed" : g.latestStatus === "cancelled" ? "Cancelled" : "In Process"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Jumlah dibelanjakan: <span className="font-medium text-foreground">{formatCurrency(g.totalSpent)}</span>
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setOrdersPhone(g.phone)}>
                          Lihat Order
                        </Button>
                      </div>
                    );
                  }
                  const customer = entry as Customer;
                  return (
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
                  );
                })}
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

      <CustomerOrdersDialog
        phone={ordersPhone}
        open={!!ordersPhone}
        onOpenChange={(o) => {
          if (!o) setOrdersPhone(null);
        }}
      />
    </div>
  );
}

export default Customers;
