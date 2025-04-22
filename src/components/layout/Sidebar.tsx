
import { Link, useLocation } from "react-router-dom"
import {
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  Menu,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const menuItems = [
    {
      title: "Dashboard",
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      title: "Pelanggan",
      icon: Users,
      href: "/customers",
    },
    {
      title: "Produk",
      icon: ShoppingBag,
      href: "/products",
    },
    {
      title: "Jualan",
      icon: BarChart3,
      href: "/sales",
    },
    {
      title: "Tetapan",
      icon: Settings,
      href: "/settings",
    },
  ]

  return (
    <SidebarProvider defaultOpen>
      <SidebarContainer variant="sidebar" className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarHeader className="flex h-[60px] items-center border-b px-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/logo.png" alt="Logo" className="h-6 w-6" />
            <span className="text-xl">Admin</span>
          </Link>
          <SidebarTrigger className="ml-auto h-8 w-8" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  data-active={currentPath === item.href}
                  className="w-full"
                >
                  <Link to={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform",
                        currentPath === item.href && "rotate-90"
                      )}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </SidebarContainer>
    </SidebarProvider>
  )
}
