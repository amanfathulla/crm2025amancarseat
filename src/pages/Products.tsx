import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Edit, Trash, Loader2, Save, Image } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariation } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import ProductForm, { ProductFormValues } from "@/components/products/ProductForm";
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Produk</h1>
        <p className="text-muted-foreground">Urus inventori produk anda</p>
      </section>
      
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Semua Produk</CardTitle>
            <CardDescription>Lihat dan urus katalog produk anda</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-9 w-full sm:w-[260px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" className="whitespace-nowrap" onClick={() => setIsAddDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Nama Produk</th>
                    <th colSpan={2} className="text-center py-3 px-4 font-medium">2 Seater</th>
                    <th colSpan={2} className="text-center py-3 px-4 font-medium">5 Seater</th>
                    <th colSpan={2} className="text-center py-3 px-4 font-medium">7 Seater</th>
                    <th className="text-right py-3 px-4 font-medium">Imej</th>
                    <th className="text-right py-3 px-4 font-medium">Tindakan</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-4"></th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Jualan</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Kos</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Jualan</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Kos</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Jualan</th>
                    <th className="text-center py-2 px-2 text-xs text-muted-foreground">Kos</th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        {searchTerm ? "Tiada produk sepadan dengan carian anda" : "Tiada produk ditemui"}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const twoSeater = product.variations?.find(v => v.name === "2 Seater");
                      const fiveSeater = product.variations?.find(v => v.name === "5 Seater");
                      const sevenSeater = product.variations?.find(v => v.name === "7 Seater");
                      
                      return (
                        <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium">{product.name}</div>
                          </td>
                          
                          {/* 2 Seater */}
                          <td className="py-3 px-2 text-center">
                            {twoSeater ? formatPrice(twoSeater.price) : "-"}
                          </td>
                          <td className="py-3 px-2 text-center text-muted-foreground">
                            {twoSeater?.cost ? formatPrice(twoSeater.cost) : "-"}
                          </td>
                          
                          {/* 5 Seater */}
                          <td className="py-3 px-2 text-center">
                            {fiveSeater ? formatPrice(fiveSeater.price) : "-"}
                          </td>
                          <td className="py-3 px-2 text-center text-muted-foreground">
                            {fiveSeater?.cost ? formatPrice(fiveSeater.cost) : "-"}
                          </td>
                          
                          {/* 7 Seater */}
                          <td className="py-3 px-2 text-center">
                            {sevenSeater ? formatPrice(sevenSeater.price) : "-"}
                          </td>
                          <td className="py-3 px-2 text-center text-muted-foreground">
                            {sevenSeater?.cost ? formatPrice(sevenSeater.cost) : "-"}
                          </td>
                          
                          <td className="py-3 px-4 text-center">
                            {product.image_url ? (
                              <div className="flex justify-center">
                                <a href={product.image_url} target="_blank" rel="noopener noreferrer">
                                  <Image className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                                </a>
                              </div>
                            ) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right">
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
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

      {/* Edit Product Dialog */}
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

      {/* Delete Product Dialog */}
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
