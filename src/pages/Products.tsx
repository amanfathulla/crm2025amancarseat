import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, MoreHorizontal, Edit, Trash, Loader2, Plus, ChevronLeft, Package, ExternalLink, Eye, EyeOff, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Product, ProductVariation } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/products/ProductForm";
import DeleteProductDialog from "@/components/products/DeleteProductDialog";
import { uploadProductImage } from "@/utils/productImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryConfig {
  name: string;
  gradient: string;
  icon: string;
  accent: string;
  hotSelling?: boolean;
}

const materialCategories: CategoryConfig[] = [
  { name: "Kain Mesh", gradient: "from-blue-500 to-blue-600", icon: "🔵", accent: "bg-blue-500" },
  { name: "Kain Nylon", gradient: "from-emerald-500 to-emerald-600", icon: "🟢", accent: "bg-emerald-500" },
  { name: "Kain Fullsilk", gradient: "from-purple-500 to-purple-600", icon: "🟣", hotSelling: true, accent: "bg-purple-500" },
  { name: "Semi Leather Kalis Air", gradient: "from-amber-500 to-amber-600", icon: "🟡", hotSelling: true, accent: "bg-amber-500" },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryEnabled, setCategoryEnabled] = useState<Record<string, boolean>>({});
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState<string | null>(null);
  const [togglingCategory, setTogglingCategory] = useState<string | null>(null);
  const { toast } = useToast();
  const { authClient } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, variationsRes, categorySettingsRes] = await Promise.all([
        authClient.from("admin_products" as any).select("*").order("name"),
        authClient.from("admin_product_variations" as any).select("*"),
        authClient.from("category_settings" as any).select("*"),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (variationsRes.error) throw variationsRes.error;

      const productsWithVariations: Product[] = ((productsRes.data || []) as any[]).map((product: any) => {
        const productVariations: ProductVariation[] = ((variationsRes.data || []) as any[])
          .filter((v: any) => v.product_id === product.id)
          .map((v: any) => ({
            id: v.id,
            product_id: v.product_id,
            name: v.name,
            price: v.price,
            cost: v.cost || 0
          }));

        return {
          ...product,
          image_urls: product.image_urls || [],
          variations: productVariations.length > 0 ? productVariations : undefined
        };
      });

      setProducts(productsWithVariations);

      // Build category enabled map
      const enabledMap: Record<string, boolean> = {};
      const imagesMap: Record<string, string> = {};
      materialCategories.forEach(c => { enabledMap[c.name] = true; }); // default all enabled
      (categorySettingsRes.data || []).forEach((row: any) => {
        enabledMap[row.name] = row.is_enabled;
        if (row.image_url) imagesMap[row.name] = row.image_url;
      });
      setCategoryEnabled(enabledMap);
      setCategoryImages(imagesMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Ralat", description: "Terdapat masalah semasa mengambil produk", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authClient]);

  const handleToggleCategory = async (categoryName: string, newValue: boolean) => {
    setTogglingCategory(categoryName);
    try {
      const { error } = await authClient
        .from("category_settings" as any)
        .upsert({ name: categoryName, is_enabled: newValue }, { onConflict: "name" } as any);
      if (error) throw error;
      setCategoryEnabled(prev => ({ ...prev, [categoryName]: newValue }));
      toast({
        title: newValue ? "✅ Kategori diaktifkan" : "🔕 Kategori dilumpuhkan",
        description: `${categoryName} ${newValue ? "akan terlihat" : "tidak akan terlihat"} dalam laman tempahan`,
      });
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setTogglingCategory(null);
    }
  };

  const handleCategoryImageUpload = async (categoryName: string, file: File) => {
    setUploadingCategoryImage(categoryName);
    try {
      const url = await uploadProductImage(authClient, file, `category-${categoryName}`);
      const { error } = await authClient
        .from("category_settings" as any)
        .upsert({ name: categoryName, image_url: url }, { onConflict: "name" } as any);
      if (error) throw error;
      setCategoryImages(prev => ({ ...prev, [categoryName]: url }));
      toast({ title: "✅ Gambar dimuat naik", description: `Gambar utama ${categoryName} dikemaskini.` });
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCategoryImage(null);
    }
  };

  const handleRemoveCategoryImage = async (categoryName: string) => {
    setUploadingCategoryImage(categoryName);
    try {
      const { error } = await authClient
        .from("category_settings" as any)
        .upsert({ name: categoryName, image_url: null }, { onConflict: "name" } as any);
      if (error) throw error;
      setCategoryImages(prev => { const n = { ...prev }; delete n[categoryName]; return n; });
      toast({ title: "Gambar dibuang" });
    } catch (err: any) {
      toast({ title: "Ralat", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCategoryImage(null);
    }
  };
  const getProductsByCategory = (categoryName: string) =>
    products.filter(p => p.category === categoryName);

  const getCategoryCount = (categoryName: string) =>
    products.filter(p => p.category === categoryName).length;

  const filteredProducts = selectedCategory
    ? getProductsByCategory(selectedCategory).filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSuccess = () => { fetchProducts(); setIsAddDialogOpen(false); };
  const handleEditSuccess = () => { fetchProducts(); setIsEditDialogOpen(false); };
  const handleDeleteSuccess = () => { fetchProducts(); setSelectedProduct(null); };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(price);

  // Category Cards View
  const renderCategoryCards = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produk</h1>
          <p className="text-muted-foreground text-sm">Pilih kategori material untuk lihat senarai produk</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Enable/Disable info banner */}
      <div className="flex items-start gap-2 bg-muted/40 rounded-xl px-4 py-3 border text-sm text-muted-foreground">
        <Eye className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>Toggle <strong>Enable/Disable</strong> pada setiap kad untuk tunjuk atau sembunyikan kategori dalam <strong>laman tempahan pelanggan</strong>.</span>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {materialCategories.map((category) => {
          const count = getCategoryCount(category.name);
          const isEnabled = categoryEnabled[category.name] !== false;
          const isToggling = togglingCategory === category.name;
          const img = categoryImages[category.name];

          return (
            <div key={category.name} className="flex flex-col h-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Top: name, count, hot badge, toggle */}
              <div className="flex items-start justify-between gap-3 px-4 pt-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${category.accent} shrink-0`} />
                    <h3 className="font-semibold text-foreground truncate">{category.name}</h3>
                    {category.hotSelling && isEnabled && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shrink-0">🔥 Best Seller</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{count} produk</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isToggling && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(v) => handleToggleCategory(category.name, v)}
                    disabled={isToggling}
                  />
                </div>
              </div>

              {/* Middle: thumbnail focus */}
              <div className="px-4 pt-3">
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-muted/40 border border-border">
                  {img ? (
                    <img
                      src={img}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/60 transition-colors gap-1">
                      {uploadingCategoryImage === category.name ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Muat naik gambar</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCategoryImage === category.name}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCategoryImageUpload(category.name, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Bottom: actions */}
              <div className="px-4 py-3 mt-auto flex items-center justify-between gap-2 border-t border-border">
                <div className="flex items-center gap-3 min-w-0">
                  {img ? (
                    <>
                      <label className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer shrink-0">
                        <ImagePlus className="h-3.5 w-3.5" /> Tukar Gambar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCategoryImage === category.name}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCategoryImageUpload(category.name, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        onClick={() => handleRemoveCategoryImage(category.name)}
                        disabled={uploadingCategoryImage === category.name}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline shrink-0"
                      >
                        <X className="h-3.5 w-3.5" /> Buang
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Tiada gambar utama</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedCategory(category.name)} className="shrink-0 gap-1">
                  Lihat Produk
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jumlah Produk</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Link tempahan setiap material & tetapan kos penghantaran kini berada di menu <strong>Link Tempahan</strong> pada sidebar.
        </p>
      </div>
    </div>
  );

  // Product List View for Selected Category
  const renderProductList = () => {
    const categoryConfig = materialCategories.find(c => c.name === selectedCategory);

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => { setSelectedCategory(null); setSearchTerm(""); }}
            className="w-fit gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{categoryConfig?.icon}</span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">{selectedCategory}</h1>
                <p className="text-muted-foreground text-sm">{filteredProducts.length} produk</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>

        <div className="bg-card rounded-xl border divide-y">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{searchTerm ? "Tiada produk dijumpai" : "Tiada produk dalam kategori ini"}</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const twoSeater = product.variations?.find(v => v.name === "2 Seater");
              const fiveSeater = product.variations?.find(v => v.name === "5 Seater");
              const sevenSeater = product.variations?.find(v => v.name === "7 Seater");
              const images = (product.image_urls && product.image_urls.length > 0)
                ? product.image_urls
                : product.image_url ? [product.image_url] : [];

              return (
                <div key={product.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={cn("font-semibold truncate", product.status === "inactive" ? "text-muted-foreground line-through" : "text-foreground")}>{product.name}</h3>
                        {product.status === "inactive" && (
                          <span className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-medium">Habis Stok</span>
                        )}
                        {images.length > 0 && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                            📷 {images.length}
                          </span>
                        )}
                        {product.youtube_url && (
                          <a href={product.youtube_url} target="_blank" rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-600 shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className={cn("grid grid-cols-3 gap-2 text-sm", product.status === "inactive" && "opacity-50")}>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">2 Seater</p>
                          <p className="font-medium">{twoSeater ? formatPrice(twoSeater.price) : "-"}</p>
                          {twoSeater?.cost ? <p className="text-xs text-muted-foreground">Kos: {formatPrice(twoSeater.cost)}</p> : null}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">5 Seater</p>
                          <p className="font-medium">{fiveSeater ? formatPrice(fiveSeater.price) : "-"}</p>
                          {fiveSeater?.cost ? <p className="text-xs text-muted-foreground">Kos: {formatPrice(fiveSeater.cost)}</p> : null}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">7 Seater</p>
                          <p className="font-medium">{sevenSeater ? formatPrice(sevenSeater.price) : "-"}</p>
                          {sevenSeater?.cost ? <p className="text-xs text-muted-foreground">Kos: {formatPrice(sevenSeater.cost)}</p> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Switch
                        checked={product.status !== "inactive"}
                        onCheckedChange={async (val) => {
                          const newStatus = val ? "active" : "inactive";
                          try {
                            const { error } = await authClient.from("products").update({ status: newStatus }).eq("id", product.id);
                            if (error) throw error;
                            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
                            toast({ title: val ? "✅ Produk diaktifkan" : "🔕 Produk dilumpuhkan (Habis Stok)" });
                          } catch (err: any) {
                            toast({ title: "Ralat", description: err.message, variant: "destructive" });
                          }
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Buang
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {selectedCategory ? renderProductList() : renderCategoryCards()}
    </div>
  );
}
