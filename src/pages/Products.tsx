import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Edit, Trash, Loader2, Save, Image, Grid3X3, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariation } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/products/ProductForm";
import DeleteProductDialog from "@/components/products/DeleteProductDialog";
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
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (productsError) throw productsError;
      
      const { data: variationsData, error: variationsError } = await supabase
        .from("product_variations")
        .select("*");

      if (variationsError) throw variationsError;
      
      const productsWithVariations: Product[] = productsData.map(product => {
        const productVariations: ProductVariation[] = variationsData
          ? variationsData
              .filter(variation => variation.product_id === product.id)
              .map(v => ({
                id: v.id,
                product_id: v.product_id,
                name: v.name,
                price: v.price,
                cost: v.cost || 0
              }))
          : [];
        
        return {
          ...product,
          variations: productVariations.length > 0 ? productVariations : undefined
        };
      });
      
      setProducts(productsWithVariations);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Ralat",
        description: "Terdapat masalah semasa mengambil produk",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSuccess = () => {
    fetchProducts();
    setIsAddDialogOpen(false);
  };

  const handleEditSuccess = () => {
    fetchProducts();
    setIsEditDialogOpen(false);
  };

  const handleDeleteSuccess = () => {
    fetchProducts();
    setSelectedProduct(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const renderGridView = () => {
    if (filteredProducts.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          {searchTerm ? "Tiada produk sepadan dengan carian anda" : "Tiada produk ditemui"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const lowestPrice = product.variations
            ? Math.min(...product.variations.map(v => v.price))
            : product.price;
            
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow border-0 shadow-sm">
              <div className="relative">
                <AspectRatio ratio={4/3}>
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                      <Image className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                </AspectRatio>
              </div>
              <CardHeader className="p-3 pb-1">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2">
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
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-semibold text-primary">
                  {formatPrice(lowestPrice)}
                </div>
                {product.variations && product.variations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {product.variations.slice(0, 2).map((variation) => (
                      <div key={variation.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{variation.name}</span>
                        <span>{formatPrice(variation.price)}</span>
                      </div>
                    ))}
                    {product.variations.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{product.variations.length - 2} lagi</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="overflow-x-auto rounded-lg border bg-card">
        {filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchTerm ? "Tiada produk sepadan dengan carian anda" : "Tiada produk ditemui"}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2.5 px-3 font-medium text-sm">Nama Produk</th>
                <th colSpan={2} className="text-center py-2.5 px-2 font-medium text-sm">2 Seater</th>
                <th colSpan={2} className="text-center py-2.5 px-2 font-medium text-sm">5 Seater</th>
                <th colSpan={2} className="text-center py-2.5 px-2 font-medium text-sm">7 Seater</th>
                <th className="text-right py-2.5 px-3 font-medium text-sm">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const twoSeater = product.variations?.find(v => v.name === "2 Seater");
                const fiveSeater = product.variations?.find(v => v.name === "5 Seater");
                const sevenSeater = product.variations?.find(v => v.name === "7 Seater");
                
                return (
                  <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-sm">{product.name}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-sm">
                      {twoSeater ? formatPrice(twoSeater.price) : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground">
                      {twoSeater?.cost ? formatPrice(twoSeater.cost) : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-sm">
                      {fiveSeater ? formatPrice(fiveSeater.price) : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground">
                      {fiveSeater?.cost ? formatPrice(fiveSeater.cost) : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-sm">
                      {sevenSeater ? formatPrice(sevenSeater.price) : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-center text-xs text-muted-foreground">
                      {sevenSeater?.cost ? formatPrice(sevenSeater.cost) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - Compact like Lead Management */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produk</h1>
            <p className="text-muted-foreground text-sm">Urus inventori produk anda</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-9 w-full sm:w-[200px] h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button className="h-9 gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </Button>
          </div>
        </div>

        {/* Stats Card - Same style as Lead Management */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/90">Total Produk</p>
                <Package className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'grid' ? (
          renderGridView()
        ) : (
          renderTableView()
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>
              Isi maklumat untuk membuat produk baru.
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            onSuccess={handleAddSuccess} 
            onCancel={() => setIsAddDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Produk</DialogTitle>
              <DialogDescription>
                Kemaskini maklumat produk {selectedProduct.name}.
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSuccess={handleEditSuccess} 
              onCancel={() => setIsEditDialogOpen(false)}
              initialData={{
                id: selectedProduct.id,
                name: selectedProduct.name,
                image_url: selectedProduct.image_url || "",
                variations: selectedProduct.variations || []
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedProduct && (
        <DeleteProductDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </MainLayout>
  );
}
