
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { CustomerForm } from "@/components/customers/CustomerForm";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserRound } from "lucide-react";

// Malaysian states
const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
  "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"
];

export function CustomerSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Customer actions state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers?customer=${customerId}`);
  };

  const handleEditCustomer = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setIsEditFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.location && customer.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "processing":
        return <Badge variant="secondary" className="ml-auto text-xs">In Process</Badge>;
      case "completed":
        return <Badge variant="default" className="ml-auto text-xs">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="ml-auto text-xs">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9 h-9 text-sm"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto px-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-center px-4 text-muted-foreground">
            {searchQuery ? "No customers match your search." : "No customers found."}
          </div>
        ) : (
          <SidebarMenu>
            {filteredCustomers.map((customer) => (
              <SidebarMenuItem key={customer.id}>
                <SidebarMenuButton 
                  onClick={() => handleCustomerClick(customer.id)}
                  className="justify-start"
                >
                  <UserRound className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="truncate">{customer.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{customer.location || customer.email}</span>
                  </div>
                  {getStatusBadge(customer.order_status)}
                </SidebarMenuButton>
                <SidebarMenuAction 
                  onClick={(e) => handleEditCustomer(customer, e)}
                  showOnHover
                >
                  <Pencil className="h-4 w-4" />
                </SidebarMenuAction>
                <SidebarMenuAction 
                  onClick={(e) => handleDeleteCustomer(customer, e)}
                  showOnHover
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </div>

      {/* Edit Customer Form Dialog */}
      {isEditFormOpen && selectedCustomer && (
        <CustomerForm
          isOpen={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setSelectedCustomer(null);
          }}
          customer={{
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone,
            location: selectedCustomer.location,
            car_model: selectedCustomer.car_model,
            product: selectedCustomer.product,
            product_variation: selectedCustomer.product_variation,
            sales_amount: selectedCustomer.sales_amount,
            gross_profit: selectedCustomer.gross_profit,
            order_date: selectedCustomer.order_date,
            order_status: selectedCustomer.order_status,
          }}
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
    </div>
  );
}
