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

export function CustomerForm({ 
  isOpen, 
  onClose, 
  customer, 
  onSuccess, 
  malaysianStates = defaultMalaysianStates 
}: CustomerFormProps) {
  const { toast } = useToast();
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
        if (foundVariation) {
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

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "processing": return "secondary";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const timePeriod = getTimePeriod(formData.order_time || '');
      
      if (customer) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: formData.name,
            email: formData.email || null,
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
          })
          .eq("id", customer.id || "");

        if (error) throw error;
        toast({
          title: "Customer updated",
          description: `Customer information updated. Order time: ${formData.order_time} (${timePeriod})`,
        });
      } else {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomerInformation
            name={formData.name}
            email={formData.email}
            phone={formData.phone}
            location={formData.location}
            address={formData.address}
            carModel={formData.car_model}
            malaysianStates={malaysianStates}
            isEditing={!!customer}
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
              {isLoading ? "Saving..." : customer ? "Update" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
