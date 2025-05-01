
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  getMarketingNotes, 
  getNotesToDelete,
  MarketingContent,
  MarketingContentStatus
} from '@/utils/marketingUtils';
import { AddMarketingNoteDialog } from './AddMarketingNoteDialog';
import { DeleteMarketingNotesAlert } from './DeleteMarketingNotesAlert';
import { MarketingTaskItem } from './MarketingTaskItem';

interface MarketingNotesProps {
  expanded: boolean;
  isMobile: boolean;
}

export function MarketingNotes({ expanded, isMobile }: MarketingNotesProps) {
  const [notes, setNotes] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ date: string; count: number }>({ date: '', count: 0 });

  // Fetch marketing notes from Supabase
  const fetchMarketingNotes = async () => {
    try {
      setIsLoading(true);
      
      // Get current date
      const today = new Date();
      
      // Get date 3 days ago (for deletion check)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      
      // Get date for next month (for display range)
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
      const nextMonthEndStr = nextMonthEnd.toISOString().split('T')[0];
      
      // Get content for the current month and next month (limited to 10)
      const data = await getMarketingNotes(threeDaysAgoStr, nextMonthEndStr);
      setNotes(data);
      
      // Check if there are completed notes to be auto-deleted (older than 3 days)
      const deleteInfo = await getNotesToDelete();
      
      if (deleteInfo.count > 0) {
        // Show delete warning if there are notes to be deleted
        setDeleteInfo({
          date: formatDate(deleteInfo.date),
          count: deleteInfo.count
        });
        setShowDeleteAlert(true);
      }
      
    } catch (error) {
      console.error('Error fetching marketing notes:', error);
      toast.error('Failed to load marketing notes');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMarketingNotes();
    
    // Set up real-time listener for changes to marketing_content
    const subscription = supabase
      .channel('public:marketing_content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_content' }, fetchMarketingNotes)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  // Group notes by month
  const groupedNotes = notes.reduce<Record<string, MarketingContent[]>>((acc, note) => {
    const dateObj = new Date(note.content_date);
    const monthYear = `${dateObj.toLocaleString('ms-MY', { month: 'long' })} ${dateObj.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(note);
    return acc;
  }, {});
  
  const handleTaskStatusChange = (taskId: string, newStatus: MarketingContentStatus) => {
    // Update the local state for immediate UI feedback
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === taskId 
          ? { 
              ...note, 
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            } 
          : note
      )
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <div className="h-5 w-full bg-white/10 animate-pulse rounded-md"></div>
        <div className="h-4 w-3/4 bg-white/10 animate-pulse rounded-md"></div>
        <div className="h-4 w-1/2 bg-white/10 animate-pulse rounded-md"></div>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden text-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">Nota Marketing</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddDialog(true)}
          className="h-7 px-2 bg-white/10 hover:bg-white/20 border-white/20"
        >
          + Tambah
        </Button>
      </div>
      
      {/* Delete Alert */}
      {showDeleteAlert && (
        <DeleteMarketingNotesAlert 
          deleteInfo={deleteInfo}
          onClose={() => setShowDeleteAlert(false)}
          onDeleted={fetchMarketingNotes}
        />
      )}
      
      {/* Marketing Notes List */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {Object.entries(groupedNotes).map(([month, monthNotes]) => (
          <div key={month}>
            <div className="sticky top-0 bg-black z-10 py-1">
              <h3 className="font-medium text-xs text-white/70">{month}</h3>
              <Separator className="my-1 bg-white/10" />
            </div>
            
            <div className="space-y-2">
              {monthNotes.map((note) => (
                <MarketingTaskItem 
                  key={note.id} 
                  task={note} 
                  onStatusChange={handleTaskStatusChange} 
                />
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedNotes).length === 0 && (
          <div className="py-6 text-center text-white/50 text-sm">
            <p>Tiada nota marketing.</p>
            <p className="text-xs mt-1">Klik "Tambah" untuk cipta nota baru.</p>
          </div>
        )}
      </div>
      
      {/* Add Note Dialog */}
      <AddMarketingNoteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onNoteAdded={fetchMarketingNotes} 
      />
    </div>
  );
}
