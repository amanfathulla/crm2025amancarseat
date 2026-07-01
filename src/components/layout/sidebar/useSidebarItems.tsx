import { useNavigate } from "react-router-dom";
import { Users, ShoppingCart, Package, LayoutDashboard, CreditCard, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useSidebarItems(orderCounts: {
  processing: number;
  completed: number;
  cancelled: number;
}) {
  const navigate = useNavigate();
  const { authClient } = useAuth();
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalProfit: 0
  });
  
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const { data: yearlySalesData, error: yearlySalesError } = await authClient
          .from('yearly_sales')
          .select('total_revenue, total_profit');
        
        if (yearlySalesError) throw yearlySalesError;
        
        const totalRevenue = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_revenue)), 0)
          : 0;
        
        const totalProfit = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_profit)), 0)
          : 0;
        
        setSalesData({ totalRevenue, totalProfit });
      } catch (error) {
        console.error("Error fetching sales data for sidebar:", error);
      }
    };
    
    fetchSalesData();
    
    const channel = authClient
      .channel('sidebar-sales-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'yearly_sales' }, () => {
        fetchSalesData();
      })
      .subscribe();
    
    return () => { authClient.removeChannel(channel); };
  }, [authClient]);
  
  const handleOrderFilter = (status: string) => {
    navigate(`/customers?status=${status}`);
  };

  return [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { 
      title: "Customers", 
      path: "/customers", 
      icon: Users,
      badges: [
        { 
          label: `${orderCounts.processing}`, 
          variant: "secondary", 
          tooltip: "Orders In Process",
          onClick: () => handleOrderFilter('processing'),
        },
        { 
          label: `${orderCounts.completed}`, 
          variant: "default", 
          tooltip: "Completed Orders",
          onClick: () => handleOrderFilter('completed'),
        },
        { 
          label: `${orderCounts.cancelled}`, 
          variant: "destructive", 
          tooltip: "Cancelled Orders",
          onClick: () => handleOrderFilter('cancelled'),
        }
      ]
    },
    { 
      title: "Sales", 
      path: "/sales", 
      icon: ShoppingCart,
      badges: [
        {
          label: `RM${salesData.totalRevenue.toLocaleString('en-MY', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
          })}`,
          variant: "default",
          tooltip: "Total Revenue (Jumlah Jualan Keseluruhan)",
          onClick: () => navigate('/sales'),
          className: "bg-blue-600 hover:bg-blue-700 text-white"
        },
        {
          label: `RM${salesData.totalProfit.toLocaleString('en-MY', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
          })}`,
          variant: "default", 
          tooltip: "Total Profit (Jumlah Untung Keseluruhan)",
          onClick: () => navigate('/sales'),
          className: "bg-green-600 hover:bg-green-700 text-white"
        }
      ]
    },
    { title: "Products", path: "/products", icon: Package },
    { title: "Payment Gateways", path: "/payment-gateways", icon: CreditCard },
  ];
}
