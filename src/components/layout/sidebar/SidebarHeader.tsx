
import React from "react";
import { cn } from "@/lib/utils";
import { X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  expanded: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
}

export function SidebarHeader({ expanded, isMobile, toggleSidebar }: SidebarHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      {(expanded || isMobile) && (
        <h2 className="text-xl font-bold animate-fade-in">Admin Panel</h2>
      )}
      <Button 
        onClick={toggleSidebar} 
        variant="ghost" 
        size="icon"
        className={cn(
          "h-8 w-8 text-white hover:bg-white/10",
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
  );
}
