
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  PackageCheck,
  PackageX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Always collapse sidebar on mobile by default
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Order status counts
  const [orderCounts, setOrderCounts] = useState({
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  
  // Fetch order status counts
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        // Fetch processing orders
        const { data: processingData, error: processingError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'processing');
        
        // Fetch completed orders
        const { data: completedData, error: completedError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'completed');
        
        // Fetch cancelled orders
        const { data: cancelledData, error: cancelledError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'cancelled');
        
        if (processingError || completedError || cancelledError) {
          console.error("Error fetching order counts", processingError || completedError || cancelledError);
          return;
        }
        
        setOrderCounts({
          processing: processingData?.length || 0,
          completed: completedData?.length || 0,
          cancelled: cancelledData?.length || 0
        });
      } catch (error) {
        console.error("Error fetching order counts:", error);
      }
    };
    
    fetchOrderCounts();
    
    // Set up a subscription to refresh counts when data changes
    const subscription = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchOrderCounts();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };
  
  // Handle filter by order status
  const handleOrderFilter = (status) => {
    navigate(`/customers?status=${status}`);
    if (isMobile) setMobileOpen(false);
  };

  // Base sidebar items - simplified with no children/dropdowns
  const sidebarItems = [
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
          icon: ShoppingBag
        },
        { 
          label: `${orderCounts.completed}`, 
          variant: "default", 
          tooltip: "Completed Orders",
          onClick: () => handleOrderFilter('completed'),
          icon: PackageCheck
        },
        { 
          label: `${orderCounts.cancelled}`, 
          variant: "destructive", 
          tooltip: "Cancelled Orders",
          onClick: () => handleOrderFilter('cancelled'),
          icon: PackageX
        }
      ]
    },
    { title: "Sales", path: "/sales", icon: ShoppingCart },
    { title: "Products", path: "/products", icon: Package },
  ];

  // Handle mobile sidebar visibility
  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = expanded && !isMobile ? "w-64" : "w-20";

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
    
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r shadow-sm transition-all duration-300 ease-in-out",
          "bg-sidebar text-sidebar-foreground",
          sidebarWidth,
          isMobile && "transition-transform",
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "w-64 translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-sidebar/80 backdrop-blur-sm">
          {(expanded || isMobile) && (
            <h2 className="text-xl font-bold animate-fade-in">Admin Panel</h2>
          )}
          <Button 
            onClick={toggleSidebar} 
            variant="ghost" 
            size="icon"
            className={cn(
              "h-8 w-8",
              !expanded && !isMobile && "ml-auto"
            )}
          >
            {isMobile ? (
              <X size={18} />
            ) : expanded ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </Button>
        </div>
        
        {/* Navigation - Simplified without dropdowns */}
        <nav className="flex flex-col gap-2 px-2 py-4 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div key={item.path} className="relative">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground",
                    !expanded && !isMobile && "justify-center px-2"
                  )}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  <Icon size={20} />
                  {(expanded || isMobile) && (
                    <>
                      <span className="animate-fade-in">{item.title}</span>
                      
                      {/* Order status badges */}
                      {item.badges && (
                        <div className="ml-auto flex items-center gap-1.5">
                          {item.badges.map((badge, index) => {
                            const BadgeIcon = badge.icon;
                            return (
                              <Badge 
                                key={index} 
                                variant={badge.variant as any}
                                className="h-6 min-w-6 cursor-pointer flex justify-center items-center gap-1 px-2"
                                title={badge.tooltip}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  badge.onClick();
                                }}
                              >
                                <BadgeIcon size={12} />
                                {badge.label}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
                
                {/* Badges for collapsed state */}
                {!expanded && !isMobile && item.badges && (
                  <div className="absolute -right-1 top-0.5 flex flex-col gap-1">
                    {item.badges.map((badge, index) => {
                      const BadgeIcon = badge.icon;
                      return (
                        <Badge 
                          key={index} 
                          variant={badge.variant as any}
                          className="h-6 min-w-6 cursor-pointer flex justify-center items-center gap-1 px-1.5"
                          title={badge.tooltip}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            badge.onClick();
                          }}
                        >
                          <BadgeIcon size={12} />
                          {badge.label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Logout button */}
        <div className="p-3 mt-auto border-t">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
              !expanded && !isMobile && "justify-center px-2"
            )}
          >
            <LogOut size={20} />
            {(expanded || isMobile) && (
              <span className="animate-fade-in">Logout</span>
            )}
          </Button>
        </div>
      </aside>
      
      {/* Mobile toggle button */}
      {isMobile && !mobileOpen && (
        <Button
          onClick={toggleSidebar}
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-40 h-10 w-10 shadow-md"
        >
          <Menu size={20} />
        </Button>
      )}
    </>
  );
}
