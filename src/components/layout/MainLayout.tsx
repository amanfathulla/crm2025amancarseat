
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./Sidebar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider } from "@/components/ui/sidebar";

type MainLayoutProps = {
  children: ReactNode;
  requireAuth?: boolean;
};

export function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  useEffect(() => {
    // Redirect to login if authentication is required but user is not logged in
    if (!isLoading && requireAuth && !user) {
      navigate("/login");
    }
    
    // Add a slight delay to show entrance animation
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [user, isLoading, requireAuth, navigate]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }
  
  // If authentication is required and user is not logged in, don't render anything
  // (the useEffect will handle the redirect)
  if (requireAuth && !user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Only show sidebar if user is authenticated */}
        {user && <AppSidebar />}
        
        {/* Main content */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          user ? (isMobile ? "ml-0" : "ml-20 lg:ml-20") : "ml-0",
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
