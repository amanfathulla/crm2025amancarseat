
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Calendar, ListTodo, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getMarketingNotes, getNotesToDelete, deleteOldMarketingNotes } from '@/utils/marketingUtils';

// Define types for marketing content
type MarketingContentType = 'event' | 'task' | 'reminder';

interface MarketingContent {
  id: string;
  title: string;
  description?: string;
  type: MarketingContentType;
  content_date: string;
  content_time?: string;
  status?: 'pending' | 'completed';
  created_at?: string;
  updated_at?: string;
}

interface MarketingNotesProps {
  expanded: boolean;
  isMobile: boolean;
}

export function MarketingNotes({ expanded, isMobile }: MarketingNotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNote, setNewNote] = useState<Partial<MarketingContent>>({
    title: '',
    description: '',
    type: 'task',
    content_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ date: string; count: number }>({ date: '', count: 0 });

  // Fetch marketing notes from Supabase
  useEffect(() => {
    const fetchMarketingNotes = async () => {
      try {
        setIsLoading(true);
        
        // Get current date
        const today = new Date();
        
        // Get date 2 months ago (for deletion check)
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(today.getMonth() - 2);
        const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];
        
        // Get date for next month (for display range)
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        const nextMonthEndStr = nextMonthEnd.toISOString().split('T')[0];
        
        // Get content for the last 2 months and next month
        const data = await getMarketingNotes(twoMonthsAgoStr, nextMonthEndStr);
        
        // Ensure the type field is correctly cast as MarketingContentType
        const typedData = data.map(item => ({
          ...item,
          type: item.type as MarketingContentType
        }));
        
        setNotes(typedData);
        
        // Check if there are notes to be auto-deleted (older than 2 months)
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
        toast({
          title: 'Error',
          description: 'Failed to load marketing notes.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketingNotes();
    
    // Set up real-time listener for changes to marketing_content
    const subscription = supabase
      .channel('public:marketing_content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_content' }, 
        fetchMarketingNotes)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [toast]);
  
  // Function to handle note deletion
  const handleDeleteOldNotes = async () => {
    try {
      const result = await deleteOldMarketingNotes();
      
      if (result.success) {
        toast({
          title: 'Nota Lama Dibuang',
          description: `${result.deletedCount} nota sebelum ${deleteInfo.date} telah dibuang.`,
        });
      } else {
        throw new Error('Failed to delete notes');
      }
      
      setShowDeleteAlert(false);
    } catch (error) {
      console.error('Error deleting old notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete old notes.',
        variant: 'destructive',
      });
    }
  };
  
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
  
  const getTypeIcon = (type: MarketingContentType) => {
    switch (type) {
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'task': return <ListTodo className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      default: return <ListTodo className="h-4 w-4" />;
    }
  };
  
  const getTypeBadgeColor = (type: MarketingContentType) => {
    switch (type) {
      case 'event': return 'bg-blue-500 hover:bg-blue-600';
      case 'task': return 'bg-purple-500 hover:bg-purple-600';
      case 'reminder': return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  // Submit new note
  const handleSubmit = async () => {
    try {
      if (!newNote.title || !newNote.content_date || !newNote.type) {
        toast({
          title: 'Maklumat Tidak Lengkap',
          description: 'Sila isi tajuk, jenis dan tarikh.',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('marketing_content')
        .insert({
          title: newNote.title,
          description: newNote.description,
          type: newNote.type,
          content_date: newNote.content_date,
          content_time: newNote.content_time,
          status: newNote.status || 'pending'
        });
      
      if (error) throw error;
      
      toast({
        title: 'Nota Ditambah',
        description: 'Nota marketing baru telah ditambah.',
      });
      
      setShowAddDialog(false);
      setNewNote({
        title: '',
        description: '',
        type: 'task',
        content_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle task completion status
  const toggleTaskStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      
      const { error } = await supabase
        .from('marketing_content')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    }
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
        <Card className="mb-3 p-2 bg-amber-950/30 border-amber-500/50">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-amber-200">Nota Lama Akan Dibuang</p>
              <p className="text-amber-200/80">
                {deleteInfo.count} nota sebelum {deleteInfo.date} akan dibuang secara automatik.
              </p>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 px-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
                  onClick={() => setShowDeleteAlert(false)}
                >
                  Simpan
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="h-7 px-2"
                  onClick={handleDeleteOldNotes}
                >
                  Buang Sekarang
                </Button>
              </div>
            </div>
          </div>
        </Card>
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
              {monthNotes.map((note) => {
                const noteDate = new Date(note.content_date);
                const dayName = noteDate.toLocaleDateString('ms-MY', { weekday: 'short' });
                const day = noteDate.getDate();
                
                return (
                  <div 
                    key={note.id} 
                    className={`p-2 rounded-md ${note.type === 'task' && note.status === 'completed' ? 'bg-white/5' : 'bg-white/10'} hover:bg-white/15`}
                  >
                    <div className="flex items-start gap-2">
                      {note.type === 'task' && (
                        <Checkbox 
                          checked={note.status === 'completed'}
                          onCheckedChange={() => toggleTaskStatus(note.id, note.status || 'pending')}
                          className="mt-1"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className={`font-medium ${note.type === 'task' && note.status === 'completed' ? 'line-through text-white/50' : ''}`}>
                            {note.title}
                          </div>
                          <Badge className={`ml-2 ${getTypeBadgeColor(note.type)} text-white text-[10px]`}>
                            {getTypeIcon(note.type)}
                            <span className="ml-1">{note.type}</span>
                          </Badge>
                        </div>
                        
                        {note.description && (
                          <p className={`text-xs mt-0.5 text-white/70 ${note.type === 'task' && note.status === 'completed' ? 'line-through text-white/40' : ''}`}>
                            {note.description}
                          </p>
                        )}
                        
                        <div className="flex items-center mt-1 text-[10px] text-white/50">
                          <span className="font-medium">{dayName}, {day}</span>
                          {note.content_time && (
                            <span className="ml-1">• {note.content_time}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Nota Marketing</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Tajuk
              </label>
              <Input 
                id="title"
                value={newNote.title || ''}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                placeholder="Tajuk nota"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Jenis
                </label>
                <Select 
                  value={newNote.type} 
                  onValueChange={(value) => setNewNote({...newNote, type: value as MarketingContentType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Tugasan</SelectItem>
                    <SelectItem value="event">Acara</SelectItem>
                    <SelectItem value="reminder">Peringatan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Tarikh
                </label>
                <Input 
                  id="date"
                  type="date"
                  value={newNote.content_date || ''}
                  onChange={(e) => setNewNote({...newNote, content_date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="time" className="text-sm font-medium">
                Masa (Pilihan)
              </label>
              <Input 
                id="time"
                type="time"
                value={newNote.content_time || ''}
                onChange={(e) => setNewNote({...newNote, content_time: e.target.value})}
                placeholder="00:00"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Penerangan (Pilihan)
              </label>
              <Textarea 
                id="description"
                value={newNote.description || ''}
                onChange={(e) => setNewNote({...newNote, description: e.target.value})}
                placeholder="Tambah penerangan..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
