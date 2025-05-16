
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
    if (!isLoading && requireAuth && !user) {
      navigate("/login");
    }
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [user, isLoading, requireAuth, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }
  if (requireAuth && !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-row w-full h-full">
      <main
        className={cn(
          "flex-1 min-h-screen w-full h-full transition-all duration-300 ease-in-out",
          // Entrance animation
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{}}
      >
        {/* Responsive, no constraint, with soft horizontal padding */}
        <div className="w-full h-full px-2 sm:px-4 md:px-6 py-4">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

