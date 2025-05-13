
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
    <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      {(expanded || isMobile) && (
        <div className="flex items-center overflow-hidden">
          <img 
            src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" 
            alt="ACS Logo" 
            className="h-7 w-auto mr-2 flex-shrink-0" 
          />
          <h2 className="text-lg font-bold animate-fade-in truncate">ACS Legacy</h2>
        </div>
      )}
      <Button 
        onClick={toggleSidebar} 
        variant="ghost" 
        size="icon"
        className={cn(
          "h-7 w-7 text-white hover:bg-white/10 flex-shrink-0",
          !expanded && !isMobile && "ml-auto"
        )}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isMobile ? (
          <X size={16} />
        ) : expanded ? (
          <X size={16} />
        ) : (
          <Menu size={16} />
        )}
      </Button>
    </div>
  );
}
