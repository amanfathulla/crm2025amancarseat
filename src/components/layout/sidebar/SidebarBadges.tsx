
import React from "react";
import { cn } from "@/lib/utils";

interface SidebarBadge {
  label: string;
  variant: string;
  tooltip: string;
  onClick: () => void;
  className?: string;
}

export function SidebarBadges({ badges, expanded, isMobile }: { 
  badges: SidebarBadge[], 
  expanded: boolean,
  isMobile: boolean
}) {
  if (!badges || badges.length === 0) return null;
  
  if (expanded || isMobile) {
    return (
      <div className="flex items-center gap-1 mr-3 flex-shrink-0">
        {badges.map((badge, index) => (
          <span
            key={index}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-xs text-white font-medium cursor-pointer",
              badge.className || ""
            )}
            title={badge.tooltip}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              badge.onClick();
            }}
          >
            {badge.label}
          </span>
        ))}
      </div>
    );
  }
  
  // For collapsed sidebar
  return (
    <div className="absolute -right-1 -top-1 flex flex-col gap-1">
      {badges.slice(0, 3).map((badge, index) => (
        <span
          key={index}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-[10px] text-white font-medium cursor-pointer",
            badge.className || ""
          )}
          title={badge.tooltip}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            badge.onClick();
          }}
        >
          {badge.label.length > 2 ? badge.label.substring(0, 2) : badge.label}
        </span>
      ))}
    </div>
  );
}
