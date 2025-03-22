
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart,
  ShoppingBag,
  DollarSign,
  Users,
  Settings,
  User,
  LogOut,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerSidebar } from "@/components/customers/CustomerSidebar";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Products",
    href: "/products",
    icon: ShoppingBag,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: DollarSign,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCustomersPage = currentPath === "/customers";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex h-14 items-center border-b px-6">
        <SidebarTrigger />
        <div className="flex items-center gap-2 font-semibold">
          <Store className="h-6 w-6 text-primary" />
          <span>My Business</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={currentPath === item.href}
                    onClick={() => navigate(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isCustomersPage && (
          <SidebarGroup className="border-t pt-2">
            <SidebarGroupLabel>Customers</SidebarGroupLabel>
            <SidebarGroupContent>
              <CustomerSidebar />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <div className="flex items-center p-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>MN</AvatarFallback>
          </Avatar>
          <div className="ml-2 space-y-0.5 text-sm">
            <p className="leading-none">Mohd Noorhisham</p>
            <p className="text-xs text-muted-foreground leading-none">Admin</p>
          </div>
          <LogOut className="ml-auto h-5 w-5 text-muted-foreground cursor-pointer" 
            onClick={() => navigate("/login")} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
