
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, MoreHorizontal } from "lucide-react";

export default function Products() {
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
              />
            </div>
            <Button size="sm" className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Inventory</th>
                  <th className="text-left py-3 px-4 font-medium">Sales</th>
                  <th className="text-right py-3 px-4 font-medium">Price</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <ProductRow 
                  name="Premium Bluetooth Headphones" 
                  category="Electronics" 
                  inventory={45} 
                  sales={128} 
                  price="$129.99" 
                />
                <ProductRow 
                  name="Ergonomic Office Chair" 
                  category="Furniture" 
                  inventory={12} 
                  sales={37} 
                  price="$249.95" 
                />
                <ProductRow 
                  name="Smart Watch Series 5" 
                  category="Electronics" 
                  inventory={78} 
                  sales={214} 
                  price="$199.99" 
                />
                <ProductRow 
                  name="Leather Laptop Sleeve" 
                  category="Accessories" 
                  inventory={32} 
                  sales={86} 
                  price="$49.95" 
                />
                <ProductRow 
                  name="Organic Cotton T-Shirt" 
                  category="Clothing" 
                  inventory={124} 
                  sales={367} 
                  price="$29.99" 
                />
                <ProductRow 
                  name="Stainless Steel Water Bottle" 
                  category="Kitchen" 
                  inventory={98} 
                  sales={215} 
                  price="$24.95" 
                />
                <ProductRow 
                  name="Wireless Charging Pad" 
                  category="Electronics" 
                  inventory={56} 
                  sales={143} 
                  price="$39.99" 
                />
                <ProductRow 
                  name="Bamboo Cutting Board Set" 
                  category="Kitchen" 
                  inventory={27} 
                  sales={74} 
                  price="$34.95" 
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

function ProductRow({ name, category, inventory, sales, price }: { name: string; category: string; inventory: number; sales: number; price: string }) {
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{name}</td>
      <td className="py-3 px-4 text-sm">{category}</td>
      <td className="py-3 px-4 text-sm">{inventory}</td>
      <td className="py-3 px-4 text-sm">{sales}</td>
      <td className="py-3 px-4 text-sm text-right font-medium">{price}</td>
      <td className="py-3 px-4 text-sm text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
