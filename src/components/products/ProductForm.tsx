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
import { Upload, X, Youtube, Image as ImageIcon, Loader2, Plus } from "lucide-react";

const productVariationSchema = z.object({
  name: z.string(),
  price: z.coerce.number().positive({ message: "Harga mesti positif" }),
  cost: z.coerce.number().nonnegative({ message: "Kos mesti sifar atau positif" }),
});

const productSchema = z.object({
  name: z.string().min(2, { message: "Nama produk mesti sekurang-kurangnya 2 aksara" }),
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
  initialData?: ProductFormValues & { id: string; image_url?: string; image_urls?: string[] };
  onCancel: () => void;
};

const defaultVariations = [
  { name: "2 Seater", price: 0, cost: 0 },
  { name: "5 Seater", price: 0, cost: 0 },
  { name: "7 Seater", price: 0, cost: 0 }
];

const getYoutubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const MAX_IMAGES = 5;

const ProductForm = ({ onSuccess, initialData, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const isEditing = !!initialData;

  // Seed existing images from initialData
  const getInitialImages = () => {
    if (initialData?.image_urls && initialData.image_urls.length > 0) return initialData.image_urls;
    if (initialData?.image_url) return [initialData.image_url];
    return [];
  };

  const [imageUrls, setImageUrls] = useState<string[]>(getInitialImages());
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [variations, setVariations] = useState<ProductVariationFormValues[]>(
    initialData?.variations && initialData.variations.length > 0
      ? initialData.variations
      : defaultVariations
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "",
      description: initialData?.description || "",
      youtube_url: initialData?.youtube_url || "",
      variations: initialData?.variations && initialData.variations.length > 0
        ? initialData.variations
        : defaultVariations,
    },
  });

  const youtubeUrl = form.watch("youtube_url") || "";
  const youtubeId = getYoutubeId(youtubeUrl);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageUrls.length >= MAX_IMAGES) {
      toast({ title: `Maksimum ${MAX_IMAGES} gambar sahaja`, variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fail terlalu besar", description: "Maksimum saiz fail 5MB", variant: "destructive" });
      return;
    }

    setUploadingIndex(imageUrls.length);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await authClient.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = authClient.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setImageUrls(prev => [...prev, urlData.publicUrl]);
      toast({ title: `✅ Gambar ${imageUrls.length + 1} berjaya dimuat naik` });
    } catch (err: any) {
      toast({ title: "Ralat muat naik gambar", description: err.message, variant: "destructive" });
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
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
      const basePrice = variations.length > 0 ? variations[0].price : 0;
      const firstImage = imageUrls[0] || null;

      if (isEditing && initialData) {
        const { error } = await authClient
          .from("products")
          .update({
            name: data.name,
            price: basePrice,
            image_url: firstImage,
            image_urls: imageUrls,
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
            image_url: firstImage,
            image_urls: imageUrls,
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
              <Select onValueChange={field.onChange} value={field.value}>
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

        {/* Multi-Image Upload */}
        <div className="space-y-2">
          <FormLabel>Gambar Produk <span className="text-muted-foreground font-normal">(maks. {MAX_IMAGES} gambar)</span></FormLabel>

          {/* Existing images grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                  <img src={url} alt={`Gambar ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">
                      Utama
                    </div>
                  )}
                </div>
              ))}

              {/* Add more button */}
              {imageUrls.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIndex !== null}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  {uploadingIndex !== null ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Plus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tambah</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {imageUrls.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
            >
              {uploadingIndex !== null ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Klik untuk muat naik gambar</span>
                  <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP — maks 5MB setiap satu · sehingga {MAX_IMAGES} gambar</span>
                </>
              )}
            </div>
          )}

          {imageUrls.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingIndex !== null}
              className="w-full"
            >
              {uploadingIndex !== null ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploadingIndex !== null ? "Sedang muat naik..." : "Pilih Gambar"}
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">{imageUrls.length}/{MAX_IMAGES} gambar dimuat naik · Gambar pertama akan jadi gambar utama produk</p>
        </div>

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
                      <Input value={variation.name} readOnly className="bg-muted" />
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
