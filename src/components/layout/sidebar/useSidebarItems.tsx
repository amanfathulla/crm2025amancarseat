
import { useNavigate } from "react-router-dom";
import { Users, ShoppingCart, Package, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSidebarItems(orderCounts: {
  processing: number;
  completed: number;
  cancelled: number;
}) {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalProfit: 0
  });
  
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Fetch all customer data - EXACTLY same as dashboard "Total Revenue" & "Total Profit"
        const { data: allCustomers, error } = await supabase
          .from('customers')
          .select('sales_amount, gross_profit');
        
        if (error) throw error;
        
        console.log("Sidebar: All customers data:", allCustomers);
        
        // Calculate EXACTLY same as dashboard - Total Revenue
        const totalRevenue = allCustomers
          ? allCustomers.reduce((sum, item) => sum + (parseFloat(String(item.sales_amount)) || 0), 0)
          : 0;
        
        // Calculate EXACTLY same as dashboard - Total Profit
        const totalProfit = allCustomers
          ? allCustomers.reduce((sum, item) => sum + (parseFloat(String(item.gross_profit)) || 0), 0)
          : 0;
        
        console.log("Sidebar calculated - Total Revenue:", totalRevenue, "Total Profit:", totalProfit);
        
        setSalesData({
          totalRevenue,
          totalProfit
        });
      } catch (error) {
        console.error("Error fetching sales data for sidebar:", error);
      }
    };
    
    fetchSalesData();
    
    // Set up realtime subscription to update sidebar when customer data changes
    const channel = supabase
      .channel('sidebar-sales-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, () => {
        fetchSalesData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
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
          label: `${salesData.totalRevenue.toLocaleString('en-MY', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
          })}`,
          variant: "default",
          tooltip: "Total Revenue",
          onClick: () => navigate('/sales'),
          className: "bg-blue-600 hover:bg-blue-700 text-white"
        },
        {
          label: `${salesData.totalProfit.toLocaleString('en-MY', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
          })}`,
          variant: "default", 
          tooltip: "Total Profit",
          onClick: () => navigate('/sales'),
          className: "bg-green-600 hover:bg-green-700 text-white"
        }
      ]
    },
    { title: "Products", path: "/products", icon: Package },
  ];
}
