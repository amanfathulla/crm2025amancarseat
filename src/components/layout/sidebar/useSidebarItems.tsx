
import { useNavigate } from "react-router-dom";
import { Users, ShoppingCart, Package, LayoutDashboard } from "lucide-react";

export function useSidebarItems(orderCounts: {
  processing: number;
  completed: number;
  cancelled: number;
}) {
  const navigate = useNavigate();
  
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
      icon: ShoppingCart
    },
    { title: "Products", path: "/products", icon: Package },
  ];
}
