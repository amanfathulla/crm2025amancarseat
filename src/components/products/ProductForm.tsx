
import React, { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Youtube, Image as ImageIcon, Loader2 } from "lucide-react";

const productVariationSchema = z.object({
  name: z.string(),
  price: z.coerce.number().positive({ message: "Harga mesti positif" }),
  cost: z.coerce.number().nonnegative({ message: "Kos mesti sifar atau positif" }),
});

const productSchema = z.object({
  name: z.string().min(2, { message: "Nama produk mesti sekurang-kurangnya 2 aksara" }),
  image_url: z.string().optional().or(z.literal('')),
  category: z.string().min(1, { message: "Sila pilih kategori material" }),
  description: z.string().optional().or(z.literal('')),
  youtube_url: z.string().optional().or(z.literal('')),
  variations: z.array(productVariationSchema),
});

const materialCategories = [
  "Kain Mesh",
  "Kain Nylon",
  "Kain Fullsilk",
  "Semi Leather Kalis Air"
];

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

// Extract YouTube video ID from various URL formats
const getYoutubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const ProductForm = ({ onSuccess, initialData, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const isEditing = !!initialData;
  const [variations, setVariations] = useState<ProductVariationFormValues[]>(
    initialData?.variations || defaultVariations
  );
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "",
      image_url: "",
      category: "",
      description: "",
      youtube_url: "",
      variations: defaultVariations,
    },
  });

  const youtubeUrl = form.watch("youtube_url") || "";
  const youtubeId = getYoutubeId(youtubeUrl);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fail terlalu besar", description: "Maksimum saiz fail 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `product-${Date.now()}.${ext}`;

      const { error: uploadError } = await authClient.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = authClient.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      form.setValue("image_url", publicUrl);
      setImagePreview(publicUrl);
      toast({ title: "✅ Imej berjaya dimuat naik" });
    } catch (err: any) {
      toast({ title: "Ralat muat naik imej", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    form.setValue("image_url", "");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVariationChange = (index: number, field: keyof ProductVariationFormValues, value: string | number) => {
    const newVariations = [...variations];
    newVariations[index] = {
      ...newVariations[index],
      [field]: field === 'name' ? value : Number(value)
    };
    setVariations(newVariations);
    form.setValue('variations', newVariations);
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      data.variations = variations;

      let basePrice = variations.length > 0 ? variations[0].price : 0;

      if (isEditing && initialData) {
        const { error } = await authClient
          .from("products")
          .update({
            name: data.name,
            price: basePrice,
            image_url: data.image_url || null,
            category: data.category,
            description: data.description || null,
            youtube_url: data.youtube_url || null,
          } as any)
          .eq("id", initialData.id);

        if (error) throw error;

        const { error: deleteError } = await authClient
          .from("product_variations")
          .delete()
          .eq("product_id", initialData.id);
        if (deleteError) throw deleteError;

        const { error: variationsError } = await authClient
          .from("product_variations")
          .insert(variations.map(v => ({ product_id: initialData.id, name: v.name, price: v.price, cost: v.cost })));
        if (variationsError) throw variationsError;

        toast({ title: "Produk dikemaskini", description: "Produk telah berjaya dikemaskini" });
      } else {
        const { data: newProduct, error } = await authClient
          .from("products")
          .insert({
            name: data.name,
            price: basePrice,
            image_url: data.image_url || null,
            category: data.category,
            description: data.description || null,
            youtube_url: data.youtube_url || null,
          } as any)
          .select();

        if (error) throw error;

        if (newProduct && newProduct[0]) {
          const { error: variationsError } = await authClient
            .from("product_variations")
            .insert(variations.map(v => ({ product_id: newProduct[0].id, name: v.name, price: v.price, cost: v.cost })));
          if (variationsError) throw variationsError;
        }

        toast({ title: "Produk ditambah", description: "Produk telah berjaya ditambah" });
      }
      onSuccess();
    } catch (error) {
      console.error("Error menyimpan produk:", error);
      toast({ title: "Ralat", description: "Terdapat masalah semasa menyimpan produk", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Nama Produk */}
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

        {/* Kategori */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori Material</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {materialCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upload Imej */}
        <FormField
          control={form.control}
          name="image_url"
          render={() => (
            <FormItem>
              <FormLabel>Gambar Produk</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Klik untuk muat naik gambar</span>
                          <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP — max 5MB</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {!imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploading ? "Sedang muat naik..." : "Pilih Gambar"}
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Penerangan Produk</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Masukkan penerangan produk (opsional)"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* YouTube Link */}
        <FormField
          control={form.control}
          name="youtube_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                Link YouTube (opsional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              {youtubeId && (
                <div className="mt-2 rounded-lg overflow-hidden aspect-video w-full border">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube preview"
                  />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variasi */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-medium">Variasi Produk</h3>
          <div className="space-y-4">
            {variations.map((variation, index) => (
              <Card key={index} className="bg-muted/40">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormLabel>Jenis</FormLabel>
                      <Input value={variation.name} onChange={(e) => handleVariationChange(index, 'name', e.target.value)} readOnly />
                    </div>
                    <div>
                      <FormLabel>Harga Jualan (RM)</FormLabel>
                      <Input type="number" step="0.01" value={variation.price} onChange={(e) => handleVariationChange(index, 'price', e.target.value)} />
                      <div className="text-sm text-muted-foreground">RM {parseFloat(variation.price.toString()).toFixed(2)}</div>
                    </div>
                    <div>
                      <FormLabel>Kos Produk (RM)</FormLabel>
                      <Input type="number" step="0.01" value={variation.cost} onChange={(e) => handleVariationChange(index, 'cost', e.target.value)} />
                      <div className="text-sm text-muted-foreground">RM {parseFloat(variation.cost.toString()).toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
          <Button type="submit">{isEditing ? "Simpan" : "Simpan Produk"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
