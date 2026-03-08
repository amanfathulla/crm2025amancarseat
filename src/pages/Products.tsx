import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Edit, Trash, Loader2, Plus, ChevronLeft, Package, Image, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

interface CategoryConfig {
  name: string;
  gradient: string;
  icon: string;
}

const materialCategories: CategoryConfig[] = [
  { name: "Kain Mesh", gradient: "from-blue-500 to-blue-600", icon: "🔵" },
  { name: "Kain Nylon", gradient: "from-emerald-500 to-emerald-600", icon: "🟢" },
  { name: "Kain Fullsilk", gradient: "from-purple-500 to-purple-600", icon: "🟣" },
  { name: "Semi Leather Kalis Air", gradient: "from-amber-500 to-amber-600", icon: "🟡" },
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

  const getProductsByCategory = (categoryName: string) => {
    return products.filter(p => p.category === categoryName);
  };

  const getCategoryCount = (categoryName: string) => {
    return products.filter(p => p.category === categoryName).length;
  };

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

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {materialCategories.map((category) => {
          const count = getCategoryCount(category.name);
          return (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] text-left group`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-black/5" />
              
              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{category.icon}</span>
                <h3 className="text-lg font-semibold mb-1 leading-tight">{category.name}</h3>
                <p className="text-white/80 text-sm">{count} produk</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Produk</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Product List View for Selected Category
  const renderProductList = () => {
    const categoryConfig = materialCategories.find(c => c.name === selectedCategory);
    
    return (
      <div className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedCategory(null);
              setSearchTerm("");
            }}
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

        {/* Search & Add */}
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

        {/* Product List */}
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
              
              return (
                <div 
                  key={product.id} 
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                        {product.image_url && (
                          <a 
                            href={product.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      {/* Price Grid - Responsive */}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">2 Seater</p>
                          <p className="font-medium">{twoSeater ? formatPrice(twoSeater.price) : "-"}</p>
                          {twoSeater?.cost ? (
                            <p className="text-xs text-muted-foreground">Kos: {formatPrice(twoSeater.cost)}</p>
                          ) : null}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">5 Seater</p>
                          <p className="font-medium">{fiveSeater ? formatPrice(fiveSeater.price) : "-"}</p>
                          {fiveSeater?.cost ? (
                            <p className="text-xs text-muted-foreground">Kos: {formatPrice(fiveSeater.cost)}</p>
                          ) : null}
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-1">7 Seater</p>
                          <p className="font-medium">{sevenSeater ? formatPrice(sevenSeater.price) : "-"}</p>
                          {sevenSeater?.cost ? (
                            <p className="text-xs text-muted-foreground">Kos: {formatPrice(sevenSeater.cost)}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                category: selectedProduct.category || "",
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
    </div>
  );
}
