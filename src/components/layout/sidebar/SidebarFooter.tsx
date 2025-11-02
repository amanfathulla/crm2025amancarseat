
import React from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface SidebarFooterProps {
  expanded: boolean;
  isMobile: boolean;
}

export function SidebarFooter({ expanded, isMobile }: SidebarFooterProps) {
  const { logout } = useAuth();
  
  return (
    <div className="p-3 mt-auto border-t border-white/10">
      <Button
        variant="ghost"
        onClick={logout}
        className={cn(
          "w-full flex items-center gap-3 text-white/80 hover:bg-white/10 hover:text-white",
          !expanded && !isMobile && "justify-center px-2"
        )}
      >
        <LogOut size={20} />
        {(expanded || isMobile) && (
          <span className="animate-fade-in">Logout</span>
        )}
      </Button>
    </div>
  );
}
