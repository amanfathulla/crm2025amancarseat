
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [orderCounts, setOrderCounts] = useState({
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const { data: processingData, error: processingError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'processing');
        
        const { data: completedData, error: completedError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'completed');
        
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
  
  const handleOrderFilter = (status) => {
    navigate(`/customers?status=${status}`);
    if (isMobile) setMobileOpen(false);
  };

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
    { title: "Sales", path: "/sales", icon: ShoppingCart },
    { title: "Products", path: "/products", icon: Package },
  ];

  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = expanded && !isMobile ? "w-64" : "w-20";

  return (
    <>
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
    
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r shadow-sm transition-all duration-300 ease-in-out",
          "bg-black text-white",
          sidebarWidth,
          isMobile && "transition-transform",
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "w-64 translate-x-0"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-sm">
          {(expanded || isMobile) && (
            <h2 className="text-xl font-bold animate-fade-in">Admin Panel</h2>
          )}
          <Button 
            onClick={toggleSidebar} 
            variant="ghost" 
            size="icon"
            className={cn(
              "h-8 w-8 text-white hover:bg-white/10",
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
                    isActive 
                      ? "bg-white text-black font-medium" 
                      : "hover:bg-white/10 text-white/80",
                    !expanded && !isMobile && "justify-center px-2"
                  )}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  <Icon size={20} className={isActive ? "text-black" : ""} />
                  {(expanded || isMobile) && (
                    <>
                      <span className="animate-fade-in">{item.title}</span>
                      
                      {item.badges && (
                        <div className="ml-auto flex items-center gap-1.5">
                          {item.badges.map((badge, index) => (
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
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
                
                {!expanded && !isMobile && item.badges && (
                  <div className="absolute -right-1 top-0.5 flex flex-col gap-1">
                    {item.badges.map((badge, index) => (
                      <Badge 
                        key={index} 
                        variant={badge.variant as any}
                        className="h-5 min-w-5 cursor-pointer flex justify-center items-center px-1"
                        title={badge.tooltip}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          badge.onClick();
                        }}
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <div className="p-3 mt-auto border-t border-white/10">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 text-white/80 hover:bg-white/10 hover:text-white",
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
      
      {isMobile && !mobileOpen && (
        <Button
          onClick={toggleSidebar}
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-40 h-10 w-10 shadow-md bg-black text-white border-white/20 hover:bg-black/80"
        >
          <Menu size={20} />
        </Button>
      )}
    </>
  );
}
