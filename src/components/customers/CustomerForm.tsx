import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerFormData } from "@/types/customer";
import { Product, ProductVariation } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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

// Function to get time period based on current time
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
      car_model: "",
      product: "",
      product_variation: "",
      order_date: new Date().toISOString().split("T")[0],
      sales_amount: 0,
      gross_profit: 0,
      paid_amount: 0,
      order_status: "processing",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const salesAmount = price;
    const grossProfit = price - cost;
    
    setFormData(prev => ({
      ...prev,
      product_variation: variationName,
      sales_amount: salesAmount,
      gross_profit: grossProfit,
      paid_amount: salesAmount
    }));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "processing": return "secondary";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  // Add a new input for paid amount and order time display
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
            email: formData.email,
            phone: formData.phone,
            city: formData.location,
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
          .eq("email", customer.email);

        if (error) throw error;
        toast({
          title: "Customer updated",
          description: `Customer information updated. Order time: ${formData.order_time} (${timePeriod})`,
        });
      } else {
        const { error } = await supabase.from("customers").insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            city: formData.location,
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
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                readOnly={!!customer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">State (Negeri)</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleSelectChange("location", value)}
              >
                <SelectTrigger id="location" className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {malaysianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="car_model">Car Model</Label>
              <Input
                id="car_model"
                name="car_model"
                value={formData.car_model}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.product}
                onValueChange={(value) => handleSelectChange("product", value)}
              >
                <SelectTrigger id="product" className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProducts ? (
                    <SelectItem value="loading" disabled>
                      Loading products...
                    </SelectItem>
                  ) : products.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No products available
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date</Label>
              <Input
                id="order_date"
                name="order_date"
                type="date"
                value={formData.order_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_status">Order Status</Label>
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
          </div>
          
          {formData.product && (
            <div className="mt-4">
              <Label>Product Variation</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {loadingVariations ? (
                  <div className="text-sm text-muted-foreground py-2">Loading variations...</div>
                ) : variations.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">No variations available for this product</div>
                ) : (
                  variations.map((variation) => (
                    <Card 
                      key={variation.id} 
                      className={`cursor-pointer hover:bg-accent transition-colors ${formData.product_variation === variation.name ? 'border-primary' : ''}`}
                      onClick={() => handleVariationChange(variation.name, variation.price, variation.cost)}
                    >
                      <CardContent className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{variation.name}</div>
                          <div className="text-sm text-muted-foreground">Price: RM {variation.price.toFixed(2)}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border ${formData.product_variation === variation.name ? 'bg-primary border-primary' : 'border-muted'}`}></div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
          
          {formData.product_variation && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="text-sm font-medium mb-2">Order Summary</div>
              <div className="flex justify-between mb-1">
                <span>Selected Variation:</span>
                <span>{formData.product_variation}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Sales Amount:</span>
                <span>RM {formData.sales_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Gross Profit:</span>
                <span>RM {formData.gross_profit.toFixed(2)}</span>
              </div>
              
            <div className="flex justify-between mb-1">
              <span>Jumlah Dibayar Pelanggan:</span>
              <Input
                type="number"
                value={formData.paid_amount}
                onChange={(e) => setFormData(prev => ({
                  ...prev, 
                  paid_amount: Number(e.target.value)
                }))}
                className="w-32 text-right"
                placeholder="RM 0.00"
              />
            </div>
            
            {formData.order_time && (
              <div className="flex justify-between mt-2 pt-2 border-t border-muted-foreground/20">
                <span>Masa Tempahan:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {formData.order_time} 
                    {` (${getTimePeriod(formData.order_time)})`}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
        
          
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
