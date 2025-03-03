import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MoreHorizontal, Pencil, Trash2, Users, DollarSign, TrendingUp } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    grossProfit: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
  
  // Form states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

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
        order_status: record.order_status || "processing", // Make sure to include this field
        total_orders: record.total_orders || 0,
        total_spent: record.total_spent || 0,
        created_at: record.created_at || "",
        updated_at: record.updated_at || "",
      })) || [];
      
      setCustomers(mappedCustomers);
      
      // Calculate stats
      const stats = calculateCustomerStats(mappedCustomers);
      setCustomerStats(stats);
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

  const calculateCustomerStats = (customers: Customer[]) => {
    const totalCustomers = customers.length;
    const totalSales = customers.reduce((sum, customer) => sum + customer.sales_amount, 0);
    const grossProfit = customers.reduce((sum, customer) => sum + customer.gross_profit, 0);
    
    // Count orders by status
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
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
      order_status: customer.order_status || "processing", // Default to processing if not set
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
      order_status: customer.order_status || "processing", // Default to processing if not set
    });
    setIsDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
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
        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="secondary" className="h-6 px-3">
              {customerStats.processingOrders}
            </Badge>
            <span className="font-medium">Orders In Process</span>
          </CardContent>
        </Card>
        
        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="default" className="h-6 px-3">
              {customerStats.completedOrders}
            </Badge>
            <span className="font-medium">Completed Orders</span>
          </CardContent>
        </Card>
        
        <Card className="flex-1 min-w-[180px]">
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="destructive" className="h-6 px-3">
              {customerStats.cancelledOrders}
            </Badge>
            <span className="font-medium">Cancelled Orders</span>
          </CardContent>
        </Card>
      </div>
      
      <Card className="animate-fade-in delay-100 shadow-soft">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="font-semibold tracking-tight">All Customers</CardTitle>
            <CardDescription>View and manage your customer list</CardDescription>
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
                  <TableHead className="font-medium text-xs uppercase tracking-wider py-3 px-4">Location</TableHead>
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
                      {searchQuery
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
