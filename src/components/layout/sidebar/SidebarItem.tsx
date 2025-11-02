
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SidebarBadges } from "./SidebarBadges";

interface SidebarItemProps {
  item: {
    title: string;
    path: string;
    icon: React.ElementType;
    badges?: Array<{
      label: string;
      variant: string;
      tooltip: string;
      onClick: () => void;
      className?: string;
    }>;
    rightIcon?: React.ElementType;
  };
  expanded: boolean;
  isMobile: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, expanded, isMobile, onClick }: SidebarItemProps) {
  const Icon = item.icon;
  const RightIcon = item.rightIcon;
  
  return (
    <div className="relative">
      <NavLink
        to={item.path}
        className={({ isActive }) => {
          return cn(
            "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
            isActive 
              ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500" 
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
          );
        }}
        onClick={() => {
          if (onClick) onClick();
        }}
      >
        {({ isActive }) => (
          <>
            <div className="grid h-full w-12 place-content-center">
              <Icon size={16} className="flex-shrink-0" />
            </div>
            
            {(expanded || isMobile) && (
              <>
                <span className={cn(
                  "text-sm font-medium transition-opacity duration-200 truncate flex-1",
                  (expanded || isMobile) ? "opacity-100" : "opacity-0"
                )}>
                  {item.title}
                </span>
                
                {item.badges && (
                  <SidebarBadges 
                    badges={item.badges}
                    expanded={expanded}
                    isMobile={isMobile}
                  />
                )}
                
                {RightIcon && (
                  <RightIcon size={16} className="flex-shrink-0 mr-3" />
                )}
              </>
            )}
          </>
        )}
      </NavLink>
      
      {!expanded && !isMobile && item.badges && (
        <SidebarBadges 
          badges={item.badges}
          expanded={expanded}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
