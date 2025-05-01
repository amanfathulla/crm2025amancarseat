
import { Facebook, Instagram, TikTok } from "lucide-react";
import { MarketingContent, MarketingContentStatus } from "@/utils/marketingUtils";
import { MarketingTaskCheckbox } from "./MarketingTaskCheckbox";

interface MarketingTaskItemProps {
  task: MarketingContent;
  onStatusChange: (taskId: string, newStatus: MarketingContentStatus) => void;
}

export function MarketingTaskItem({ task, onStatusChange }: MarketingTaskItemProps) {
  const isCompleted = task.status === 'completed';
  const taskDate = new Date(task.content_date);
  const dayName = taskDate.toLocaleDateString('ms-MY', { weekday: 'short' });
  const day = taskDate.getDate();

  // Determine which media icon to show
  const MediaIcon = (() => {
    switch (task.media) {
      case 'tiktok':
        return <TikTok className="h-4 w-4 text-pink-400" title="TikTok" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-400" title="Facebook" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-purple-400" title="Instagram" />;
      default:
        return null;
    }
  })();

  return (
    <div 
      className={`p-2 rounded-md ${
        isCompleted 
          ? 'bg-white/5 text-white/60' 
          : 'bg-white/10'
      } hover:bg-white/15 transition-colors`}
    >
      <div className="flex items-start gap-2">
        <MarketingTaskCheckbox task={task} onStatusChange={onStatusChange} />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className={`font-medium ${isCompleted ? 'line-through text-white/50' : ''}`}>
              {task.title}
            </div>
          </div>
          
          <div className="flex items-center mt-1 text-[10px] text-white/50 gap-1">
            <span className="font-medium">{dayName}, {day}</span>
            {MediaIcon && (
              <span className="flex items-center">
                • {MediaIcon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
