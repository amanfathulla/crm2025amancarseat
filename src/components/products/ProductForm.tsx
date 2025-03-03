
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const productVariationSchema = z.object({
  name: z.string(),
  price: z.coerce.number().positive({ message: "Harga mesti positif" }),
  cost: z.coerce.number().nonnegative({ message: "Kos mesti sifar atau positif" }),
});

const productSchema = z.object({
  name: z.string().min(2, { message: "Nama produk mesti sekurang-kurangnya 2 aksara" }),
  image_url: z.string().url({ message: "URL imej tidak sah" }).optional().or(z.literal('')),
  variations: z.array(productVariationSchema),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductVariationFormValues = z.infer<typeof productVariationSchema>;

type ProductFormProps = {
  onSuccess: () => void;
  initialData?: ProductFormValues & { id: string };
  onCancel: () => void;
};

const defaultVariations = [
  { name: "2 Seater", price: 0, cost: 0 },
  { name: "5 Seater", price: 0, cost: 0 },
  { name: "7 Seater", price: 0, cost: 0 }
];

const ProductForm = ({ onSuccess, initialData, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const isEditing = !!initialData;
  const [variations, setVariations] = useState<ProductVariationFormValues[]>(
    initialData?.variations || defaultVariations
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      image_url: "",
      variations: defaultVariations,
    },
  });

  const handleVariationChange = (index: number, field: keyof ProductVariationFormValues, value: string | number) => {
    const newVariations = [...variations];
    newVariations[index] = {
      ...newVariations[index],
      [field]: field === 'name' ? value : Number(value)
    };
    setVariations(newVariations);
    
    // This is important to update the form values with the latest variations
    form.setValue('variations', newVariations);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Include variations in form data
      data.variations = variations;

      let basePrice = 0;
      // Calculate base price from first variation's price
      if (variations.length > 0) {
        basePrice = variations[0].price;
      }

      if (isEditing && initialData) {
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            price: basePrice,
            image_url: data.image_url || null,
          })
          .eq("id", initialData.id);

        if (error) throw error;

        // Delete existing variations
        const { error: deleteError } = await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", initialData.id);

        if (deleteError) throw deleteError;

        // Insert new variations
        const { error: variationsError } = await supabase
          .from("product_variations")
          .insert(
            variations.map(v => ({
              product_id: initialData.id,
              name: v.name,
              price: v.price,
              cost: v.cost
            }))
          );

        if (variationsError) throw variationsError;

        toast({
          title: "Produk dikemaskini",
          description: "Produk telah berjaya dikemaskini",
        });
      } else {
        // Insert new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            name: data.name,
            price: basePrice,
            image_url: data.image_url || null,
          })
          .select();

        if (error) throw error;

        if (newProduct && newProduct[0]) {
          const productId = newProduct[0].id;
          
          const { error: variationsError } = await supabase
            .from("product_variations")
            .insert(
              variations.map(v => ({
                product_id: productId,
                name: v.name,
                price: v.price,
                cost: v.cost
              }))
            );

          if (variationsError) throw variationsError;
        }

        toast({
          title: "Produk ditambah",
          description: "Produk telah berjaya ditambah",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error menyimpan produk:", error);
      toast({
        title: "Ralat",
        description: "Terdapat masalah semasa menyimpan produk",
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
              <FormLabel>Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nama produk" {...field} />
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
              <FormLabel>URL Imej</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-medium">Variasi Produk</h3>
          <div className="space-y-4">
            {variations.map((variation, index) => (
              <Card key={index} className="bg-muted/40">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormLabel>Jenis</FormLabel>
                      <Input 
                        value={variation.name} 
                        onChange={(e) => handleVariationChange(index, 'name', e.target.value)} 
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <FormLabel>Harga Jualan (RM)</FormLabel>
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
                      <FormLabel>Kos Produk (RM)</FormLabel>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={variation.cost} 
                        onChange={(e) => handleVariationChange(index, 'cost', e.target.value)} 
                      />
                      <div className="text-sm text-muted-foreground">
                        RM {parseFloat(variation.cost.toString()).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">{isEditing ? "Simpan" : "Simpan Produk"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
