
import React from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarFooterProps {
  expanded: boolean;
  isMobile: boolean;
}

export function SidebarFooter({ expanded, isMobile }: SidebarFooterProps) {
  const { logout } = useAuth();
  
  return (
    <button
      onClick={logout}
      className="w-full border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <LogOut size={16} className="text-gray-500 dark:text-gray-400" />
        </div>
        {(expanded || isMobile) && (
          <span className={cn(
            "text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200",
            (expanded || isMobile) ? "opacity-100" : "opacity-0"
          )}>
            Logout
          </span>
        )}
      </div>
    </button>
  );
}
