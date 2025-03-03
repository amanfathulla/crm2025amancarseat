
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  inventory: z.coerce.number().nonnegative({ message: "Inventory must be a non-negative number" }),
  cost: z.coerce.number().nonnegative({ message: "Cost must be a non-negative number" }).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  onSuccess: () => void;
  initialData?: ProductFormValues & { id: string };
  onCancel: () => void;
};

const ProductForm = ({ onSuccess, initialData, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const isEditing = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      price: 0,
      inventory: 0,
      cost: 0,
      image_url: "",
      status: "active",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
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
        toast({
          title: "Product updated",
          description: "Product has been updated successfully",
        });
      } else {
        const { error } = await supabase.from("products").insert({
          name: data.name,
          price: data.price,
          inventory: data.inventory || 0,
          cost: data.cost || null,
          image_url: data.image_url || null,
          status: data.status || "active"
        });

        if (error) throw error;
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
                <FormLabel>Selling Price (RM)</FormLabel>
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
              <FormLabel>Inventory</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
