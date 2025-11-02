
import React from "react";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <button
        onClick={() => setShowMarketingNotes(!showMarketingNotes)}
        className={cn(
          "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
          showMarketingNotes 
            ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
        )}
      >
        <div className="grid h-full w-12 place-content-center">
          <ListTodo size={16} />
        </div>
        {(expanded || isMobile) && (
          <span className={cn(
            "text-sm font-medium transition-opacity duration-200 flex-1",
            (expanded || isMobile) ? "opacity-100" : "opacity-0"
          )}>
            Nota Marketing
          </span>
        )}
        {(expanded || isMobile) && (
          <span className="flex h-5 w-auto px-2 items-center justify-center rounded-full bg-purple-500 dark:bg-purple-600 text-xs text-white font-medium mr-3">
            Auto
          </span>
        )}
      </button>
      
      {showMarketingNotes && (expanded || isMobile) && (
        <div className="mt-2 ml-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <MarketingNotes expanded={expanded} isMobile={isMobile} />
        </div>
      )}
    </div>
  );
}
