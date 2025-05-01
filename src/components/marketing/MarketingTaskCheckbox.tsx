
import { Check, Square } from "lucide-react";
import { useState } from "react";
import { MarketingContent, MarketingContentStatus, updateMarketingNoteStatus } from "@/utils/marketingUtils";
import { toast } from "sonner";

interface MarketingTaskCheckboxProps {
  task: MarketingContent;
  onStatusChange: (taskId: string, newStatus: MarketingContentStatus) => void;
}

export function MarketingTaskCheckbox({ task, onStatusChange }: MarketingTaskCheckboxProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = task.status === 'completed';

  const toggleStatus = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newStatus: MarketingContentStatus = isCompleted ? 'pending' : 'completed';
    
    try {
      const result = await updateMarketingNoteStatus(task.id, newStatus);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }
      
      onStatusChange(task.id, newStatus);
      
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button 
      onClick={toggleStatus}
      disabled={isUpdating}
      className={`flex items-center justify-center h-5 w-5 rounded border transition-colors ${
        isCompleted 
          ? 'bg-green-500 border-green-600 text-white' 
          : 'border-white/30 bg-transparent hover:bg-white/10'
      }`}
      title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
    >
      {isCompleted ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Square className="h-3.5 w-3.5 opacity-0" />
      )}
    </button>
  );
}
