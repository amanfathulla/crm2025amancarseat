
import { Product, ProductVariation } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ProductSelectionProps {
  product: string;
  productVariation: string;
  products: Product[];
  variations: ProductVariation[];
  loadingProducts: boolean;
  loadingVariations: boolean;
  onProductChange: (name: string, value: string) => void;
  onVariationChange: (variationName: string, price: number, cost: number) => void;
}

export function ProductSelection({
  product,
  productVariation,
  products,
  variations,
  loadingProducts,
  loadingVariations,
  onProductChange,
  onVariationChange,
}: ProductSelectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="product">Product</Label>
        <Select
          value={product}
          onValueChange={(value) => onProductChange("product", value)}
        >
          <SelectTrigger id="product" className="w-full">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {loadingProducts ? (
              <SelectItem value="loading" disabled>
                Loading products...
              </SelectItem>
            ) : products.length === 0 ? (
              <SelectItem value="none" disabled>
                No products available
              </SelectItem>
            ) : (
              products.map((product) => (
                <SelectItem key={product.id} value={product.name}>
                  {product.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {product && (
        <div className="mt-4">
          <Label>Product Variation</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {loadingVariations ? (
              <div className="text-sm text-muted-foreground py-2">Loading variations...</div>
            ) : variations.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">No variations available for this product</div>
            ) : (
              variations.map((variation) => (
                <Card 
                  key={variation.id} 
                  className={`cursor-pointer hover:bg-accent transition-colors ${productVariation === variation.name ? 'border-primary' : ''}`}
                  onClick={() => onVariationChange(variation.name, variation.price, variation.cost)}
                >
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{variation.name}</div>
                      <div className="text-sm text-muted-foreground">Price: RM {variation.price.toFixed(2)}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border ${productVariation === variation.name ? 'bg-primary border-primary' : 'border-muted'}`}></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
