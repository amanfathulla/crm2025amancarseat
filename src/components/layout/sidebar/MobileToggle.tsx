
import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileToggleProps {
  toggleSidebar: () => void;
}

export function MobileToggle({ toggleSidebar }: MobileToggleProps) {
  return (
    <Button
      onClick={toggleSidebar}
      variant="outline"
      size="icon"
      className="fixed top-4 left-4 z-40 h-10 w-10 shadow-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg lg:hidden"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </Button>
  );
}
