
import React from "react";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNotes } from "@/components/marketing/MarketingNotes";

interface MarketingNotesSectionProps {
  expanded: boolean;
  isMobile: boolean;
  showMarketingNotes: boolean;
  setShowMarketingNotes: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MarketingNotesSection({ 
  expanded, 
  isMobile, 
  showMarketingNotes, 
  setShowMarketingNotes 
}: MarketingNotesSectionProps) {
  return (
    <div className="mt-6">
      <Button
        variant="ghost"
        onClick={() => setShowMarketingNotes(!showMarketingNotes)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
          showMarketingNotes ? "bg-white/10" : "",
          "hover:bg-white/10 text-white/80",
          !expanded && !isMobile && "justify-center px-2"
        )}
      >
        <ListTodo size={20} />
        {(expanded || isMobile) && (
          <span className="animate-fade-in mr-auto">Nota Marketing</span>
        )}
        {(expanded || isMobile) && (
          <Badge variant="secondary" className="bg-purple-500 text-white">
            Auto
          </Badge>
        )}
      </Button>
      
      {showMarketingNotes && (expanded || isMobile) && (
        <div className="mt-2 px-2 py-1 bg-white/5 rounded-md">
          <MarketingNotes expanded={expanded} isMobile={isMobile} />
        </div>
      )}
    </div>
  );
}
