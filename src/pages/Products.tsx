
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Edit, Trash, Loader2, Image, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
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
import { Badge } from "@/components/ui/badge";

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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // Type safety: ensure all products have status, defaulting to 'active' if missing
      const productsWithStatus = data.map(product => ({
        ...product,
        status: product.status || 'active'
      }));
      
      setProducts(productsWithStatus as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "There was a problem fetching the products",
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

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Products</h1>
        <p className="text-muted-foreground">Manage your product inventory</p>
      </section>
      
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Products</CardTitle>
            <CardDescription>View and manage your product catalog</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9 w-full sm:w-[260px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="sm" className="whitespace-nowrap" onClick={() => setIsAddDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save Product
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
                    <th className="text-left py-3 px-4 font-medium">Product</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Inventory</th>
                    <th className="text-right py-3 px-4 font-medium">Price</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {searchTerm ? "No products match your search" : "No products found"}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center mr-3">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="h-10 w-10 object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = "public/placeholder.svg";
                                  }}
                                />
                              ) : (
                                <Image className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="font-medium">{product.name}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="py-3 px-4 text-sm">{product.inventory || 0}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {formatPrice(product.price)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
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
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new product.
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the details of {selectedProduct.name}.
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSuccess={handleEditSuccess} 
              onCancel={() => setIsEditDialogOpen(false)}
              initialData={{
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                inventory: selectedProduct.inventory || 0,
                cost: selectedProduct.cost || 0,
                image_url: selectedProduct.image_url || "",
                status: selectedProduct.status || "active",
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
