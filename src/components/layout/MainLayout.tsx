
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
      navigate("/admin");
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
    // Struktur asal dikekalkan, kecuali pada padding kiri (pl-0 di mobile, lg:pl-64 di desktop)
    <div className={cn(
      "min-h-screen bg-background flex w-full h-full",
      // Sidebar ambil ruang 64 (256px), pastikan content bermula selepas itu di desktop
      !isMobile && "lg:pl-64" // space for sidebar at desktop
    )}>
      <main
        className={cn(
          "flex-1 min-h-screen w-full h-full transition-all duration-300 ease-in-out",
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
}
