
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, MoreHorizontal } from "lucide-react";

export default function Customers() {
  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </section>
      
      <Card className="animate-fade-in delay-100">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>View and manage your customer list</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9 w-full sm:w-[260px]"
              />
            </div>
            <Button size="sm" className="whitespace-nowrap">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Orders</th>
                  <th className="text-left py-3 px-4 font-medium">Spent</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <CustomerRow name="Sarah Johnson" email="sarah.j@example.com" orders={12} spent="$1,245.90" />
                <CustomerRow name="Michael Chen" email="mchen@example.com" orders={8} spent="$879.45" />
                <CustomerRow name="Emma Watson" email="emma.w@example.com" orders={5} spent="$627.80" />
                <CustomerRow name="James Wilson" email="jwilson@example.com" orders={15} spent="$1,897.50" />
                <CustomerRow name="Olivia Martinez" email="omartinez@example.com" orders={3} spent="$349.99" />
                <CustomerRow name="Sophia Rodriguez" email="srodriguez@example.com" orders={7} spent="$752.35" />
                <CustomerRow name="Noah Garcia" email="ngarcia@example.com" orders={4} spent="$429.95" />
                <CustomerRow name="Ava Miller" email="amiller@example.com" orders={9} spent="$1,021.75" />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

function CustomerRow({ name, email, orders, spent }: { name: string; email: string; orders: number; spent: string }) {
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-sm font-medium">{name}</td>
      <td className="py-3 px-4 text-sm">{email}</td>
      <td className="py-3 px-4 text-sm">{orders}</td>
      <td className="py-3 px-4 text-sm">{spent}</td>
      <td className="py-3 px-4 text-sm text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
