
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const productVariationSchema = z.object({
  name: z.string().min(1, { message: "Variation name is required" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  inventory: z.coerce.number().nonnegative({ message: "Inventory must be a non-negative number" }),
});

const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  inventory: z.coerce.number().nonnegative({ message: "Inventory must be a non-negative number" }),
  cost: z.coerce.number().nonnegative({ message: "Cost must be a non-negative number" }).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.string().optional(),
  variations: z.array(productVariationSchema).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductVariationFormValues = z.infer<typeof productVariationSchema>;

type ProductFormProps = {
  onSuccess: () => void;
  initialData?: ProductFormValues & { id: string };
  onCancel: () => void;
};

const defaultVariations = [
  { name: "2 Seater", price: 0, inventory: 0 },
  { name: "5 Seater", price: 0, inventory: 0 },
  { name: "7 Seater", price: 0, inventory: 0 }
];

const ProductForm = ({ onSuccess, initialData, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const isEditing = !!initialData;
  const [variations, setVariations] = useState<ProductVariationFormValues[]>(
    initialData?.variations || []
  );
  const [hasVariations, setHasVariations] = useState(
    initialData?.variations ? initialData.variations.length > 0 : false
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      price: 0,
      inventory: 0,
      cost: 0,
      image_url: "",
      status: "active",
      variations: [],
    },
  });

  const addVariation = () => {
    if (!hasVariations) {
      setVariations(defaultVariations);
      setHasVariations(true);
    } else {
      setVariations([...variations, { name: "", price: 0, inventory: 0 }]);
    }
  };

  const removeVariation = (index: number) => {
    const newVariations = [...variations];
    newVariations.splice(index, 1);
    setVariations(newVariations);
    if (newVariations.length === 0) {
      setHasVariations(false);
    }
  };

  const handleVariationChange = (index: number, field: keyof ProductVariationFormValues, value: string | number) => {
    const newVariations = [...variations];
    newVariations[index] = {
      ...newVariations[index],
      [field]: field === 'name' ? value : Number(value)
    };
    setVariations(newVariations);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Include variations in form data
      data.variations = hasVariations ? variations : undefined;

      if (isEditing && initialData) {
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            price: data.price,
            inventory: data.inventory || 0,
            cost: data.cost || null,
            image_url: data.image_url || null,
            status: data.status || "active"
          })
          .eq("id", initialData.id);

        if (error) throw error;

        // If product has variations, update them
        if (hasVariations && variations.length > 0) {
          // First delete existing variations
          const { error: deleteError } = await supabase
            .from("product_variations")
            .delete()
            .eq("product_id", initialData.id);

          if (deleteError) throw deleteError;

          // Then insert new variations
          if (variations.length > 0) {
            const { error: variationsError } = await supabase
              .from("product_variations")
              .insert(
                variations.map(v => ({
                  product_id: initialData.id,
                  name: v.name,
                  price: v.price,
                  inventory: v.inventory
                }))
              );

            if (variationsError) throw variationsError;
          }
        }

        toast({
          title: "Product updated",
          description: "Product has been updated successfully",
        });
      } else {
        // Insert new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: data.name,
            price: data.price,
            inventory: data.inventory || 0,
            cost: data.cost || null,
            image_url: data.image_url || null,
            status: data.status || "active"
          })
          .select();

        if (error) throw error;

        // If product has variations, insert them
        if (hasVariations && variations.length > 0 && newProduct && newProduct[0]) {
          const productId = newProduct[0].id;
          
          const { error: variationsError } = await supabase
            .from("product_variations")
            .insert(
              variations.map(v => ({
                product_id: productId,
                name: v.name,
                price: v.price,
                inventory: v.inventory
              }))
            );

          if (variationsError) throw variationsError;
        }

        toast({
          title: "Product added",
          description: "Product has been added successfully",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the product",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Selling Price (RM)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  RM {parseFloat(field.value.toString() || "0").toFixed(2)}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price (RM)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    value={field.value || ""} 
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  RM {parseFloat((field.value || 0).toString()).toFixed(2)}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inventory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Inventory</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Product Variations</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addVariation}
            >
              <Plus className="h-4 w-4 mr-2" />
              {hasVariations ? "Add Variation" : "Add Seating Variations"}
            </Button>
          </div>

          {hasVariations && variations.map((variation, index) => (
            <Card key={index} className="bg-muted/40">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Variation {index + 1}</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeVariation(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormLabel>Variation Name</FormLabel>
                      <Input 
                        value={variation.name} 
                        onChange={(e) => handleVariationChange(index, 'name', e.target.value)} 
                        placeholder="e.g. 2 Seater"
                      />
                    </div>
                    
                    <div>
                      <FormLabel>Price (RM)</FormLabel>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={variation.price} 
                        onChange={(e) => handleVariationChange(index, 'price', e.target.value)} 
                      />
                      <div className="text-sm text-muted-foreground">
                        RM {parseFloat(variation.price.toString()).toFixed(2)}
                      </div>
                    </div>
                    
                    <div>
                      <FormLabel>Inventory</FormLabel>
                      <Input 
                        type="number" 
                        value={variation.inventory} 
                        onChange={(e) => handleVariationChange(index, 'inventory', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Save Changes" : "Save Product"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
