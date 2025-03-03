
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// Sample data for charts
const salesData = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 1900 },
  { name: "Mar", total: 1500 },
  { name: "Apr", total: 2400 },
  { name: "May", total: 2700 },
  { name: "Jun", total: 3000 },
  { name: "Jul", total: 2500 },
];

const customerData = [
  { name: "Jan", new: 120, returning: 80 },
  { name: "Feb", new: 130, returning: 100 },
  { name: "Mar", new: 100, returning: 110 },
  { name: "Apr", new: 150, returning: 120 },
  { name: "May", new: 180, returning: 140 },
  { name: "Jun", new: 190, returning: 160 },
  { name: "Jul", new: 160, returning: 170 },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up delay-100">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </section>
      
      {/* Stats cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue" 
          value="$24,563" 
          change="+12.5%" 
          trend="up"
          icon={DollarSign}
          delay="100"
        />
        <StatCard 
          title="New Customers" 
          value="573" 
          change="+8.2%" 
          trend="up"
          icon={Users}
          delay="200"
        />
        <StatCard 
          title="Total Products" 
          value="294" 
          change="+3.1%" 
          trend="up"
          icon={Package}
          delay="300"
        />
        <StatCard 
          title="Order Rate" 
          value="6.4%" 
          change="-1.2%" 
          trend="down"
          icon={ShoppingCart}
          delay="400"
        />
      </section>
      
      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="animate-slide-up delay-500">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for current year</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{ 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  strokeWidth={3}
                  dot={{ strokeWidth: 0, r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  stroke="hsl(var(--primary))"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="animate-slide-up delay-600">
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>New vs returning customers</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Bar 
                  dataKey="new" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                  name="New"
                />
                <Bar 
                  dataKey="returning" 
                  fill="hsl(var(--muted))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                  name="Returning"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
      
      {/* Recent orders */}
      <section className="animate-slide-up delay-700">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your most recent customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <OrderRow id="ORD-7291" customer="Sarah Johnson" date="July 12, 2023" status="Completed" amount="$129.99" />
                  <OrderRow id="ORD-7290" customer="Michael Chen" date="July 11, 2023" status="Processing" amount="$59.49" />
                  <OrderRow id="ORD-7289" customer="Emma Watson" date="July 10, 2023" status="Completed" amount="$89.99" />
                  <OrderRow id="ORD-7288" customer="James Wilson" date="July 9, 2023" status="Completed" amount="$144.95" />
                  <OrderRow id="ORD-7287" customer="Olivia Martinez" date="July 9, 2023" status="Shipped" amount="$249.99" />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  delay = "0"
}: { 
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  delay?: string;
}) {
  return (
    <Card className={cn("animate-slide-up", `delay-${delay}`)}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
          <div className="bg-primary/10 p-2.5 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-xs font-medium">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 mr-1 text-red-500" />
          )}
          <span className={cn(
            trend === "up" ? "text-emerald-500" : "text-red-500",
            "mr-2"
          )}>
            {change}
          </span>
          <span className="text-muted-foreground">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderRow({ id, customer, date, status, amount }: { id: string; customer: string; date: string; status: string; amount: string }) {
  return (
    <tr className="border-b">
      <td className="py-3 px-4 text-sm">{id}</td>
      <td className="py-3 px-4 text-sm">{customer}</td>
      <td className="py-3 px-4 text-sm">{date}</td>
      <td className="py-3 px-4 text-sm">
        <span className={cn(
          "py-1 px-2 rounded-full text-xs font-medium",
          status === "Completed" && "bg-emerald-100 text-emerald-800",
          status === "Processing" && "bg-blue-100 text-blue-800",
          status === "Shipped" && "bg-amber-100 text-amber-800",
        )}>
          {status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-right font-medium">{amount}</td>
    </tr>
  );
}
