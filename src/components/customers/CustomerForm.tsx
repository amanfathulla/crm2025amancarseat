import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CustomerFormData } from "@/types/customer";
import { Product, ProductVariation } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CustomerInformation } from "./form/CustomerInformation";
import { ProductSelection } from "./form/ProductSelection";
import { PaymentDetails } from "./form/PaymentDetails";
import { OrderStatus } from "./form/OrderStatus";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const defaultMalaysianStates = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", 
  "Sarawak", "Selangor", "Terengganu", "Wilayah Persekutuan"
];

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerFormData;
  onSuccess: () => void;
  malaysianStates?: string[];
}

const getTimePeriod = (timeString: string) => {
  const time = new Date(`2000-01-01T${timeString}`);
  const hours = time.getHours();
  
  if (hours >= 6 && hours < 12) return "Pagi";
  if (hours >= 12 && hours < 18) return "Petang";
  if (hours >= 18 && hours < 24) return "Malam";
  return "Lewat Malam";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('ms-MY', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

export function CustomerForm({ 
  isOpen, 
  onClose, 
  customer, 
  onSuccess, 
  malaysianStates = defaultMalaysianStates 
}: CustomerFormProps) {
  const { toast } = useToast();
  const isEditing = !!customer;
  
  const [formData, setFormData] = useState<CustomerFormData>(
    customer || {
      name: "",
      email: "",
      phone: "",
      location: "",
      address: "",
      car_model: "",
      product: "",
      product_variation: "",
      order_date: new Date().toISOString().split("T")[0],
      sales_amount: 0,
      gross_profit: 0,
      paid_amount: 0,
      order_status: "processing",
      payment_status: "fullpayment",
      order_time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Reset form when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        address: "",
        car_model: "",
        product: "",
        product_variation: "",
        order_date: new Date().toISOString().split("T")[0],
        sales_amount: 0,
        gross_profit: 0,
        paid_amount: 0,
        order_status: "processing",
        payment_status: "fullpayment",
        order_time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      });
    }
  }, [customer]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name");

        if (error) throw error;
        setProducts(data || []);
        
        if (customer?.product) {
          const foundProduct = data?.find(p => p.name === customer.product) || null;
          setSelectedProduct(foundProduct);
          if (foundProduct) {
            fetchProductVariations(foundProduct.id);
          }
        }
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products list.",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [toast, customer]);

  const fetchProductVariations = async (productId: string) => {
    try {
      setLoadingVariations(true);
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", productId)
        .order("name");

      if (error) throw error;
      setVariations(data || []);
      
      if (customer?.product_variation && data) {
        const foundVariation = data.find(v => v.name === customer.product_variation);
        if (foundVariation && !isEditing) {
          handleVariationChange(foundVariation.name, foundVariation.price, foundVariation.cost);
        }
      }
    } catch (error: any) {
      console.error("Error fetching product variations:", error);
      toast({
        title: "Error",
        description: "Failed to load product variations.",
        variant: "destructive",
      });
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "product") {
      setFormData(prev => ({ 
        ...prev, 
        product_variation: "", 
        sales_amount: 0,
        gross_profit: 0,
        paid_amount: 0
      }));
      
      const product = products.find(p => p.name === value) || null;
      setSelectedProduct(product);
      
      if (product) {
        fetchProductVariations(product.id);
      } else {
        setVariations([]);
      }
    }
  };
  
  const handleVariationChange = (variationName: string, price: number, cost: number) => {
    const paidAmount = price;
    const grossProfit = paidAmount - cost;
    
    setFormData(prev => ({
      ...prev,
      product_variation: variationName,
      sales_amount: price,
      gross_profit: grossProfit,
      paid_amount: paidAmount
    }));
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const paidAmount = Number(e.target.value);
    const selectedVariation = variations.find(v => v.name === formData.product_variation);
    
    if (selectedVariation) {
      const newGrossProfit = paidAmount - selectedVariation.cost;
      setFormData(prev => ({
        ...prev,
        paid_amount: paidAmount,
        gross_profit: newGrossProfit
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const timePeriod = getTimePeriod(formData.order_time || '');
      
      if (isEditing) {
        // Only update order_status when editing
        const { error } = await supabase
          .from("customers")
          .update({
            order_status: formData.order_status,
          })
          .eq("id", customer.id || "");

        if (error) throw error;
        toast({
          title: "Customer updated",
          description: `Order status updated successfully.`,
        });
      } else {
        // Insert new customer with all data
        const { error } = await supabase.from("customers").insert([
          {
            name: formData.name,
            email: formData.email || `customer_${Date.now()}@temp.local`,
            phone: formData.phone,
            city: formData.location,
            address: formData.address || null,
            car_model: formData.car_model,
            product: formData.product,
            product_variation: formData.product_variation,
            sales_amount: formData.sales_amount,
            gross_profit: formData.gross_profit,
            paid_amount: formData.paid_amount,
            order_date: formData.order_date,
            order_status: formData.order_status,
            order_time: formData.order_time
          },
        ]);

        if (error) throw error;
        toast({
          title: "Customer added",
          description: `New customer added. Order time: ${formData.order_time} (${timePeriod})`,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save customer information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Edit Form (Order Status Only)
  if (isEditing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Order Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Read-only Customer Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">Maklumat Pelanggan (Tidak boleh diubah)</div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{formData.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Lokasi:</span>
                  <p className="font-medium">{formData.location || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Model Kereta:</span>
                  <p className="font-medium">{formData.car_model || 'N/A'}</p>
                </div>
              </div>
              
              {formData.address && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Alamat Lengkap:</span>
                  <p className="font-medium">{formData.address}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                <div>
                  <span className="text-muted-foreground">Produk:</span>
                  <p className="font-medium">{formData.product || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Variasi:</span>
                  <p className="font-medium">{formData.product_variation || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                <div>
                  <span className="text-muted-foreground">Order Date:</span>
                  <p className="font-medium">{formatDate(formData.order_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Masa Tempahan:</span>
                  <p className="font-medium">
                    {formData.order_time ? `${formData.order_time} (${getTimePeriod(formData.order_time)})` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
                <div>
                  <span className="text-muted-foreground">Jumlah Dibayar:</span>
                  <p className="font-medium text-green-600">RM {formData.paid_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gross Profit:</span>
                  <p className="font-medium">RM {formData.gross_profit?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Editable Order Status */}
            <div className="space-y-2">
              <Label htmlFor="order_status">Order Status (Boleh diubah)</Label>
              <Select
                value={formData.order_status}
                onValueChange={(value) => handleSelectChange("order_status", value)}
              >
                <SelectTrigger id="order_status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processing">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">Processing</Badge>
                      <span>Order In Process</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <Badge variant="default" className="mr-2">Completed</Badge>
                      <span>Order Completed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">Cancelled</Badge>
                      <span>Order Cancelled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Update Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Render Add New Customer Form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <CustomerInformation
            name={formData.name}
            email={formData.email}
            phone={formData.phone}
            location={formData.location}
            address={formData.address}
            carModel={formData.car_model}
            malaysianStates={malaysianStates}
            isEditing={false}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
          />

          <OrderStatus
            orderStatus={formData.order_status}
            orderDate={formData.order_date}
            onSelectChange={handleSelectChange}
            onChange={handleChange}
          />

          <ProductSelection
            product={formData.product}
            productVariation={formData.product_variation}
            products={products}
            variations={variations}
            loadingProducts={loadingProducts}
            loadingVariations={loadingVariations}
            onProductChange={handleSelectChange}
            onVariationChange={handleVariationChange}
          />

          <PaymentDetails
            productVariation={formData.product_variation}
            salesAmount={formData.sales_amount}
            grossProfit={formData.gross_profit}
            paidAmount={formData.paid_amount}
            orderTime={formData.order_time}
            onPaidAmountChange={handlePaidAmountChange}
            getTimePeriod={getTimePeriod}
          />
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (formData.product && !formData.product_variation)}>
              {isLoading ? "Saving..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}