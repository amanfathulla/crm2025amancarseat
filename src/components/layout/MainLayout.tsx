
import { ReactNode, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children?: ReactNode;
  requireAuth?: boolean;
}

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
    <div className="min-h-screen bg-background flex w-full">
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out w-full",
        "ml-0 md:ml-16", // Add default spacing for collapsed sidebar
        "lg:ml-64", // Add spacing for expanded sidebar on larger screens
        isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="p-3 sm:p-4 md:p-6 max-w-screen-xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
