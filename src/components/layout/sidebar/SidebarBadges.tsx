
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  if (!badges) return null;
  
  if (expanded || isMobile) {
    return (
      <div className="flex items-center gap-1.5 ml-auto">
        {badges.map((badge, index) => (
          <Badge 
            key={index} 
            variant={badge.variant as any}
            className={cn(
              "h-6 min-w-6 cursor-pointer flex justify-center items-center gap-1 px-2",
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
          </Badge>
        ))}
      </div>
    );
  }
  
  // For collapsed sidebar
  return (
    <div className="absolute -right-1 top-0.5 flex flex-col gap-1">
      {badges.slice(0, 3).map((badge, index) => (
        <Badge 
          key={index} 
          variant={badge.variant as any}
          className={cn(
            "h-5 min-w-5 cursor-pointer flex justify-center items-center px-1",
            badge.className || ""
          )}
          title={badge.tooltip}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            badge.onClick();
          }}
        >
          {index < 2 ? badge.label.substring(0, 3) : badge.label}
        </Badge>
      ))}
    </div>
  );
}
