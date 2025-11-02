
import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SidebarHeaderProps {
  expanded: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

export function SidebarHeader({ expanded, isMobile, onClose }: SidebarHeaderProps) {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        {(expanded || isMobile) ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <img 
                  src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" 
                  alt="ACS Logo" 
                  className="h-6 w-6 object-contain" 
                />
              </div>
              <div className={cn("transition-opacity duration-200", expanded || isMobile ? "opacity-100" : "opacity-0")}>
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ACS Legacy
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Pro Plan
                </span>
              </div>
            </div>
            {isMobile && onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </>
        ) : (
          <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm mx-auto">
            <img 
              src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png" 
              alt="ACS Logo" 
              className="h-6 w-6 object-contain" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
