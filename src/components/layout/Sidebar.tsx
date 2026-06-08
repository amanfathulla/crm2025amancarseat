import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  Users,
  BarChart3,
  Package,
  ChevronsRight,
  X,
  Menu,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
  Megaphone,
  LogOut,
  ShoppingBag,
  ExternalLink,
  Copy,
  CreditCard,
  Star,
} from "lucide-react";

interface SidebarItemType {
  title: string;
  path: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout, authClient } = useAuth();

  const [orderCounts, setOrderCounts] = useState({
    processing: 0,
    completed: 0,
    cancelled: 0,
  });

  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalProfit: 0,
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
        const { data: processingData } = await authClient
          .from("customers")
          .select("id")
          .eq("order_status", "processing");

        const { data: completedData } = await authClient
          .from("customers")
          .select("id")
          .eq("order_status", "completed");

        const { data: cancelledData } = await authClient
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

    const subscription = authClient
      .channel("public:customers")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => {
        fetchOrderCounts();
      })
      .subscribe();

    return () => { authClient.removeChannel(subscription); };
  }, [authClient]);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const { data: yearlySalesData, error } = await authClient
          .from("yearly_sales")
          .select("total_revenue, total_profit");

        if (error) throw error;

        const totalRevenue = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_revenue)), 0)
          : 0;

        const totalProfit = yearlySalesData
          ? yearlySalesData.reduce((sum, item) => sum + parseFloat(String(item.total_profit)), 0)
          : 0;

        setSalesData({ totalRevenue, totalProfit });
      } catch (error) {
        console.error("Error fetching sales data:", error);
      }
    };

    fetchSalesData();

    const channel = authClient
      .channel("sidebar-sales-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "yearly_sales" }, () => {
        fetchSalesData();
      })
      .subscribe();

    return () => { authClient.removeChannel(channel); };
  }, [authClient]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `RM${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `RM${(value / 1000).toFixed(0)}K`;
    return `RM${value.toFixed(0)}`;
  };

  const mainItems: SidebarItemType[] = [
    { title: "Dashboard", path: "/", icon: Home },
    { title: "Lead Management", path: "/leads", icon: Target },
    { title: "Marketing", path: "/marketing", icon: Megaphone },
    { title: "Products", path: "/products", icon: Package },
    { title: "Reviews", path: "/reviews", icon: Star },
    { title: "Payment Gateways", path: "/payment-gateways", icon: CreditCard },
  ];

  const orderPageUrl = "/order";

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
              </NavLink>
            );
          })}

          {/* Customers Card */}
          {(expanded || (isMobile && mobileOpen)) && (
            <NavLink
              to="/customers"
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "block rounded-xl p-3 mt-3 transition-all duration-200 border",
                location.pathname === "/customers"
                  ? "bg-blue-600 border-blue-400 shadow-lg"
                  : "bg-blue-600/15 border-blue-500/30 hover:bg-blue-600/25"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-semibold text-white">Customers</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-2 text-center">
                  <Clock className="h-3 w-3 mx-auto mb-1 text-amber-300" />
                  <span className="block text-lg font-bold text-white">{orderCounts.processing}</span>
                  <span className="text-[10px] text-amber-100/80">Process</span>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-2 text-center">
                  <CheckCircle className="h-3 w-3 mx-auto mb-1 text-emerald-300" />
                  <span className="block text-lg font-bold text-white">{orderCounts.completed}</span>
                  <span className="text-[10px] text-emerald-100/80">Done</span>
                </div>
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-2 text-center">
                  <XCircle className="h-3 w-3 mx-auto mb-1 text-red-300" />
                  <span className="block text-lg font-bold text-white">{orderCounts.cancelled}</span>
                  <span className="text-[10px] text-red-100/80">Cancel</span>
                </div>
              </div>
            </NavLink>
          )}

          {/* Collapsed Customers Icon */}
          {!expanded && !isMobile && (
            <NavLink
              to="/customers"
              className={cn(
                "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                location.pathname === "/customers"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="grid h-full w-12 place-content-center">
                <Users className="h-5 w-5" />
              </div>
            </NavLink>
          )}

          {/* Sales Card */}
          {(expanded || (isMobile && mobileOpen)) && (
            <NavLink
              to="/sales"
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "block rounded-xl p-3 mt-2 transition-all duration-200 border",
                location.pathname === "/sales"
                  ? "bg-emerald-600 border-emerald-400 shadow-lg"
                  : "bg-emerald-600/15 border-emerald-500/30 hover:bg-emerald-600/25"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-emerald-200" />
                <span className="text-sm font-semibold text-white">Sales</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Wallet className="h-3 w-3 text-blue-300" />
                    <span className="text-[10px] text-blue-100/80">Revenue</span>
                  </div>
                  <span className="block text-sm font-bold text-white">{formatCurrency(salesData.totalRevenue)}</span>
                </div>
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-green-300" />
                    <span className="text-[10px] text-green-100/80">Profit</span>
                  </div>
                  <span className="block text-sm font-bold text-white">{formatCurrency(salesData.totalProfit)}</span>
                </div>
              </div>
            </NavLink>
          )}

          {/* Collapsed Sales Icon */}
          {!expanded && !isMobile && (
            <NavLink
              to="/sales"
              className={cn(
                "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                location.pathname === "/sales"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="grid h-full w-12 place-content-center">
                <BarChart3 className="h-5 w-5" />
              </div>
            </NavLink>
          )}

          {/* Link Tempahan Card -> Dashboard khas */}
          {(expanded || (isMobile && mobileOpen)) && (
            <NavLink
              to="/link-tempahan"
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "block rounded-xl p-3 mt-2 transition-all duration-200 border",
                location.pathname === "/link-tempahan"
                  ? "bg-violet-600 border-violet-400 shadow-lg"
                  : "bg-gradient-to-br from-violet-500/20 to-violet-600/20 border-violet-500/30 hover:from-violet-500/30 hover:to-violet-600/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-violet-300" />
                  <span className="text-sm font-semibold text-white">Link Tempahan</span>
                </div>
                <a
                  href={`${window.location.origin}/order`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-violet-300 hover:text-violet-100"
                  title="Buka link tempahan"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-1 mt-2 bg-white/10 rounded-lg px-2 py-1">
                <span className="text-[10px] text-white/70 flex-1 truncate">
                  Urus link & kos penghantaran
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${window.location.origin}/order`);
                    setCopied(true);
                    toast({ title: "✅ Link disalin!", description: `${window.location.origin}/order` });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 text-violet-300 hover:text-white transition-colors"
                  title="Salin link"
                >
                  {copied ? <CheckCircle className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </NavLink>
          )}

          {/* Collapsed Order Icon */}
          {!expanded && !isMobile && (
            <NavLink
              to="/link-tempahan"
              className={cn(
                "relative flex h-11 w-full items-center rounded-lg transition-all duration-200",
                location.pathname === "/link-tempahan"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="grid h-full w-12 place-content-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </NavLink>
          )}



        </nav>

        {/* Logout Button */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={logout}
            className={cn(
              "flex h-11 w-full items-center rounded-lg transition-all duration-200",
              "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            )}
          >
            <div className="grid h-full w-12 place-content-center">
              <LogOut className="h-5 w-5" />
            </div>
            {(expanded || (isMobile && mobileOpen)) && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>

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
