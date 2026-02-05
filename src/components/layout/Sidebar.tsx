import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShoppingCart,
  BarChart3,
  Package,
  ChevronsRight,
  ChevronDown,
  X,
  Notebook,
  Download,
  Settings,
  HelpCircle,
  Menu,
  Target,
} from "lucide-react";
import { MarketingNotesSection } from "./sidebar/MarketingNotesSection";

interface SidebarItemType {
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [showMarketingNotes, setShowMarketingNotes] = useState(false);

  const [orderCounts, setOrderCounts] = useState({
    processing: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const { data: processingData } = await supabase
          .from("customers")
          .select("id")
          .eq("order_status", "processing");

        const { data: completedData } = await supabase
          .from("customers")
          .select("id")
          .eq("order_status", "completed");

        const { data: cancelledData } = await supabase
          .from("customers")
          .select("id")
          .eq("order_status", "cancelled");

        setOrderCounts({
          processing: processingData?.length || 0,
          completed: completedData?.length || 0,
          cancelled: cancelledData?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching order counts:", error);
      }
    };

    fetchOrderCounts();

    const subscription = supabase
      .channel("public:customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          fetchOrderCounts();
        }
      )
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

  const mainItems: SidebarItemType[] = [
    { title: "Dashboard", path: "/", icon: Home },
    { title: "Lead Management", path: "/leads", icon: Target },
    { title: "Customers", path: "/customers", icon: Users },
    { title: "Products", path: "/products", icon: Package },
    { title: "Sales", path: "/sales", icon: BarChart3 },
  ];

  const accountItems: SidebarItemType[] = [
    { title: "Install App", path: "/install", icon: Download },
  ];

  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = expanded && !isMobile ? "w-64" : "w-16";

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r transition-all duration-300 ease-in-out",
          "bg-sidebar border-sidebar-border",
          sidebarWidth,
          isMobile && "transition-transform",
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "w-64 translate-x-0"
        )}
      >
        {/* Header */}
        <div className="border-b border-sidebar-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-sidebar-primary/20 shadow-md">
                <img
                  src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png"
                  alt="Logo"
                  className="h-7 w-7 object-contain"
                />
              </div>
              {(expanded || (isMobile && mobileOpen)) && (
                <div className="transition-opacity duration-200">
                  <span className="block text-sm font-semibold text-sidebar-foreground">
                    ACS Legacy
                  </span>
                  <span className="block text-xs text-sidebar-foreground/60">
                    CRM System
                  </span>
                </div>
              )}
            </div>
            {isMobile && mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <div className="grid h-full w-12 place-content-center">
                  <item.icon className="h-5 w-5" />
                </div>
                {(expanded || (isMobile && mobileOpen)) && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
                {item.badge && item.badge > 0 && (expanded || (isMobile && mobileOpen)) && (
                  <span className="absolute right-3 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Marketing Notes */}
          <MarketingNotesSection
            expanded={expanded}
            isMobile={isMobile}
            showMarketingNotes={showMarketingNotes}
            setShowMarketingNotes={setShowMarketingNotes}
          />

          {/* Account Section */}
          {(expanded || (isMobile && mobileOpen)) && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <div className="px-3 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wide">
                Account
              </div>
              {accountItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={cn(
                      "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="grid h-full w-12 place-content-center">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          <div className="flex items-center p-3">
            <div className="grid size-10 place-content-center">
              <ChevronsRight
                className={cn(
                  "h-5 w-5 transition-transform duration-300 text-sidebar-foreground/60",
                  expanded && "rotate-180"
                )}
              />
            </div>
            {(expanded || (isMobile && mobileOpen)) && (
              <span className="text-sm font-medium text-sidebar-foreground/70">
                {expanded ? "Collapse" : "Expand"}
              </span>
            )}
          </div>
        </button>
      </aside>

      {/* Mobile Toggle Button */}
      {isMobile && !mobileOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
