
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
      className="fixed top-4 left-4 z-40 h-10 w-10 shadow-md bg-black text-white border-white/20 hover:bg-black/80 rounded-full lg:hidden"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </Button>
  );
}
