
import { Facebook, Instagram, LucideIcon } from "lucide-react";
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
  const renderMediaIcon = () => {
    switch (task.media) {
      case 'tiktok':
        return <span className="h-4 w-4 text-pink-400 flex items-center justify-center text-xs" aria-label="TikTok">TT</span>;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-400" aria-label="Facebook" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-purple-400" aria-label="Instagram" />;
      default:
        return null;
    }
  };

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
            {task.media && task.media !== 'none' && (
              <span className="flex items-center">
                • {renderMediaIcon()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
