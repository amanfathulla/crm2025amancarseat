import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { Customer, CustomerFormData } from "@/types/customer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
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
        total_orders: record.total_orders || 0,
        total_spent: record.total_spent || 0,
        created_at: record.created_at || "",
        updated_at: record.updated_at || "",
      })) || [];
      
      setCustomers(mappedCustomers);
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
      customer.product_variation.toLowerCase().includes(searchQuery.toLowerCase())
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
    });
    setIsDeleteDialogOpen(true);
  };

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </section>
      
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Customers</CardTitle>
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
        <CardContent>
          <div className="flex items-center gap-2 w-full mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Car Model</th>
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Variation</th>
                  <th className="text-right py-3 px-4 font-medium">Sales Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Profit</th>
                  <th className="text-left py-3 px-4 font-medium">Order Date</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      {searchQuery
                        ? "No customers match your search criteria."
                        : "No customers found. Add your first customer to get started."}
                    </td>
                  </tr>
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
              </tbody>
            </table>
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

  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{customer.name}</td>
      <td className="py-3 px-4 text-sm">{customer.email}</td>
      <td className="py-3 px-4 text-sm">{customer.phone}</td>
      <td className="py-3 px-4 text-sm">{customer.location}</td>
      <td className="py-3 px-4 text-sm">{customer.car_model}</td>
      <td className="py-3 px-4 text-sm">{customer.product}</td>
      <td className="py-3 px-4 text-sm">{customer.product_variation}</td>
      <td className="py-3 px-4 text-sm text-right">{formatCurrency(customer.sales_amount)}</td>
      <td className="py-3 px-4 text-sm text-right">{formatCurrency(customer.gross_profit)}</td>
      <td className="py-3 px-4 text-sm">{formatDate(customer.order_date)}</td>
      <td className="py-3 px-4 text-sm text-right">
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
      </td>
    </tr>
  );
}
