
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
            "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
            isActive 
              ? "bg-white text-black font-medium" 
              : "hover:bg-white/10 text-white/80",
            !expanded && !isMobile ? "justify-center px-2" : ""
          );
        }}
        onClick={() => {
          if (isMobile && onClick) onClick();
        }}
      >
        {({ isActive }) => (
          <>
            <Icon 
              size={20} 
              className={isActive ? "text-black" : ""} 
            />
            
            {(expanded || isMobile) && (
              <>
                <span className="animate-fade-in">{item.title}</span>
                
                {RightIcon && (
                  <RightIcon size={16} className="ml-auto mr-1" />
                )}
                
                {item.badges && (
                  <SidebarBadges 
                    badges={item.badges}
                    expanded={expanded}
                    isMobile={isMobile}
                  />
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
