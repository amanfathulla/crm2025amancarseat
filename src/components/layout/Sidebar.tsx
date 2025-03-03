
import { useState } from "react";
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
} from "lucide-react";

type SidebarItem = {
  title: string;
  path: string;
  icon: React.ElementType;
};

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", path: "/customers", icon: Users },
  { title: "Sales", path: "/sales", icon: ShoppingCart },
  { title: "Products", path: "/products", icon: Package },
  { title: "Marketing", path: "/marketing", icon: TrendingUp },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { logout } = useAuth();
  
  // Always collapse sidebar on mobile by default
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

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
        <nav className="flex flex-col gap-2 px-2 py-4 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
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
