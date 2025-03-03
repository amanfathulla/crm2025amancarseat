
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Sales() {
  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Sales</h1>
        <p className="text-muted-foreground">Manage orders and transactions</p>
      </section>
      
      <Tabs defaultValue="all" className="animate-fade-in delay-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9 w-full sm:w-[200px]"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Payment</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <OrderRow 
                      id="ORD-7291" 
                      customer="Sarah Johnson" 
                      date="July 12, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$129.99" 
                    />
                    <OrderRow 
                      id="ORD-7290" 
                      customer="Michael Chen" 
                      date="July 11, 2023" 
                      status="Processing" 
                      payment="PayPal"
                      amount="$59.49" 
                    />
                    <OrderRow 
                      id="ORD-7289" 
                      customer="Emma Watson" 
                      date="July 10, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$89.99" 
                    />
                    <OrderRow 
                      id="ORD-7288" 
                      customer="James Wilson" 
                      date="July 9, 2023" 
                      status="Completed" 
                      payment="Credit Card"
                      amount="$144.95" 
                    />
                    <OrderRow 
                      id="ORD-7287" 
                      customer="Olivia Martinez" 
                      date="July 9, 2023" 
                      status="Shipped" 
                      payment="PayPal"
                      amount="$249.99" 
                    />
                    <OrderRow 
                      id="ORD-7286" 
                      customer="Noah Garcia" 
                      date="July 8, 2023" 
                      status="Pending" 
                      payment="Credit Card"
                      amount="$74.95" 
                    />
                    <OrderRow 
                      id="ORD-7285" 
                      customer="Ava Miller" 
                      date="July 8, 2023" 
                      status="Processing" 
                      payment="PayPal"
                      amount="$129.99" 
                    />
                    <OrderRow 
                      id="ORD-7284" 
                      customer="William Brown" 
                      date="July 7, 2023" 
                      status="Shipped" 
                      payment="Credit Card"
                      amount="$189.95" 
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered pending orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processing" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered processing orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">Showing filtered completed orders would appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function OrderRow({ id, customer, date, status, payment, amount }: { id: string; customer: string; date: string; status: string; payment: string; amount: string }) {
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{id}</td>
      <td className="py-3 px-4 text-sm">{customer}</td>
      <td className="py-3 px-4 text-sm">{date}</td>
      <td className="py-3 px-4 text-sm">
        <span className={`py-1 px-2 rounded-full text-xs font-medium ${
          status === "Completed" ? "bg-emerald-100 text-emerald-800" :
          status === "Processing" ? "bg-blue-100 text-blue-800" :
          status === "Shipped" ? "bg-amber-100 text-amber-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm">{payment}</td>
      <td className="py-3 px-4 text-sm text-right font-medium">{amount}</td>
      <td className="py-3 px-4 text-sm text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
