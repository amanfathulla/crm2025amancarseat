
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

type SidebarItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  children?: SubItem[];
};

type SubItem = {
  title: string;
  path: string;
  icon?: React.ElementType;
  data?: any;
};

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { logout } = useAuth();
  const [recentCustomers, setRecentCustomers] = useState<SubItem[]>([]);
  const [products, setProducts] = useState<SubItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Customers: false,
    Products: false
  });
  
  // Always collapse sidebar on mobile by default
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  // Toggle a specific section (like Customers or Products)
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  // Fetch recent customers - added throttling to prevent too many requests
  useEffect(() => {
    const fetchRecentCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        const customerItems: SubItem[] = data.map((customer) => ({
          title: customer.name,
          path: `/customers?id=${customer.id}`,
          icon: User,
          data: customer
        }));

        setRecentCustomers(customerItems);
      } catch (error) {
        console.error("Error fetching recent customers:", error);
      }
    };

    // Initial fetch
    fetchRecentCustomers();

    // Set up a polling interval to check for new customers - if on the customers page
    const interval = setInterval(() => {
      if (location.pathname === '/customers') {
        fetchRecentCustomers();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [location.pathname]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name")
          .order("name");

        if (error) throw error;

        const productItems: SubItem[] = data.map((product) => ({
          title: product.name,
          path: `/products?id=${product.id}`,
          icon: Package,
          data: product
        }));

        setProducts(productItems);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Initial fetch
    fetchProducts();

    // Set up a polling interval to check for new products - if on the products page
    const interval = setInterval(() => {
      if (location.pathname === '/products') {
        fetchProducts();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [location.pathname]);

  // Base sidebar items
  const sidebarItems: SidebarItem[] = [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { 
      title: "Customers", 
      path: "/customers", 
      icon: Users,
      children: recentCustomers 
    },
    { title: "Sales", path: "/sales", icon: ShoppingCart },
    { 
      title: "Products", 
      path: "/products", 
      icon: Package,
      children: products
    },
    { title: "Marketing", path: "/marketing", icon: TrendingUp },
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
        
        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-2 py-4 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections[item.title];
            
            return (
              <div key={item.path} className="flex flex-col">
                {hasChildren ? (
                  <>
                    {/* Parent item with children */}
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground",
                        !expanded && !isMobile && "justify-center px-2"
                      )}
                      onClick={() => (expanded || isMobile) && toggleSection(item.title)}
                    >
                      <Icon size={20} />
                      {(expanded || isMobile) && (
                        <>
                          <span className="flex-1 animate-fade-in">{item.title}</span>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </>
                      )}
                    </div>
                    
                    {/* Children items (dropdown) */}
                    {(expanded || isMobile) && isExpanded && (
                      <div className="ml-8 mt-1 flex flex-col gap-1">
                        {item.children?.map((child) => (
                          <NavLink
                            key={`${child.title}-${child.path}`}
                            to={child.path}
                            className={({ isActive }) => cn(
                              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200",
                              "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                              isActive ? "bg-sidebar-accent/50 text-sidebar-accent-foreground" : "text-sidebar-foreground"
                            )}
                            onClick={() => isMobile && setMobileOpen(false)}
                          >
                            {child.icon && <child.icon size={16} />}
                            <span className="truncate">{child.title}</span>
                          </NavLink>
                        ))}
                        
                        {/* View All link */}
                        <NavLink
                          to={item.path}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:underline"
                          onClick={() => isMobile && setMobileOpen(false)}
                        >
                          <span>Lihat Semua {item.title}</span>
                        </NavLink>
                      </div>
                    )}
                  </>
                ) : (
                  /* Regular menu item without children */
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
                      <span className="animate-fade-in">{item.title}</span>
                    )}
                  </NavLink>
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
