import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Clock, Megaphone, Bell, ListTodo } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ms } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  MarketingContent, 
  MarketingContentStatus,
  MarketingContentType,
  MarketingContentMedia,
  updateMarketingNoteStatus 
} from '@/utils/marketingUtils';
import { AddMarketingNoteDialog } from '@/components/marketing/AddMarketingNoteDialog';
import { cn } from '@/lib/utils';

const Marketing = () => {
  const [notes, setNotes] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch all marketing notes
  const fetchMarketingNotes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .order('content_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching marketing notes:', error);
        toast.error('Gagal memuat nota marketing');
        return;
      }
      
      // Validate and normalize the data
      const validatedData = (data || []).map(item => ({
        ...item,
        status: (item.status === 'completed' ? 'completed' : 'pending') as MarketingContentStatus,
        type: (['event', 'task', 'reminder'].includes(item.type) ? item.type : 'task') as MarketingContentType,
        media: (['tiktok', 'facebook', 'instagram', 'none'].includes(item.media || 'none') ? item.media : 'none') as MarketingContentMedia
      }));
      
      setNotes(validatedData);
    } catch (error) {
      console.error('Error fetching marketing notes:', error);
      toast.error('Gagal memuat nota marketing');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingNotes();
    
    // Real-time subscription
    const subscription = supabase
      .channel('marketing_content_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_content' }, fetchMarketingNotes)
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Get notes for a specific date
  const getNotesForDate = (date: Date) => {
    return notes.filter(note => {
      const noteDate = parseISO(note.content_date);
      return isSameDay(noteDate, date);
    });
  };

  // Get dates with notes for calendar highlighting
  const datesWithNotes = useMemo(() => {
    return notes.map(note => parseISO(note.content_date));
  }, [notes]);

  // Filter notes based on search and selected month
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    // Filter by current month view
    filtered = filtered.filter(note => {
      const noteDate = parseISO(note.content_date);
      return isSameMonth(noteDate, currentMonth);
    });
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        (note.description && note.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [notes, currentMonth, searchQuery]);

  // Handle status toggle
  const handleStatusToggle = async (noteId: string, currentStatus: MarketingContentStatus) => {
    const newStatus: MarketingContentStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic update
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
        : note
    ));
    
    const result = await updateMarketingNoteStatus(noteId, newStatus);
    
    if (!result.success) {
      // Revert on error
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, status: currentStatus, completed_at: currentStatus === 'completed' ? note.completed_at : null }
          : note
      ));
      toast.error('Gagal kemaskini status');
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get icon for note type
  const getTypeIcon = (type: MarketingContentType) => {
    switch (type) {
      case 'event': return <Megaphone className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      default: return <ListTodo className="h-4 w-4" />;
    }
  };

  // Get media badge color
  const getMediaBadgeClass = (media?: MarketingContentMedia | null) => {
    switch (media) {
      case 'tiktok': return 'bg-black text-white';
      case 'facebook': return 'bg-blue-600 text-white';
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nota Marketing</h1>
          <p className="text-muted-foreground">Urus dan jadual kandungan marketing anda</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Nota
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nota marketing..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'MMMM yyyy', { locale: ms })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                hasNotes: datesWithNotes
              }}
              modifiersStyles={{
                hasNotes: {
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  fontWeight: 'bold'
                }
              }}
            />
            
            {/* Selected date notes preview */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                {format(selectedDate, 'd MMMM yyyy', { locale: ms })}
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getNotesForDate(selectedDate).length > 0 ? (
                  getNotesForDate(selectedDate).map(note => (
                    <div 
                      key={note.id} 
                      className={cn(
                        "text-sm p-2 rounded-md",
                        note.status === 'completed' ? 'bg-muted/50 line-through text-muted-foreground' : 'bg-primary/10'
                      )}
                    >
                      {note.title}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Tiada nota untuk tarikh ini</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Senarai Nota - {format(currentMonth, 'MMMM yyyy', { locale: ms })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Tiada nota marketing untuk bulan ini</p>
                <Button variant="outline" onClick={() => setShowAddDialog(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Nota Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredNotes.map(note => (
                  <div 
                    key={note.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      note.status === 'completed' ? 'bg-muted/30 border-muted' : 'bg-card border-border'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Toggle */}
                      <button 
                        onClick={() => handleStatusToggle(note.id, note.status)}
                        className="mt-1 flex-shrink-0"
                      >
                        {note.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn(
                            "font-medium",
                            note.status === 'completed' && 'line-through text-muted-foreground'
                          )}>
                            {note.title}
                          </span>
                          {getTypeIcon(note.type)}
                          {note.media && note.media !== 'none' && (
                            <Badge className={cn("text-xs", getMediaBadgeClass(note.media))}>
                              {note.media}
                            </Badge>
                          )}
                        </div>
                        
                        {note.description && (
                          <p className={cn(
                            "text-sm mb-2",
                            note.status === 'completed' ? 'text-muted-foreground' : 'text-foreground/80'
                          )}>
                            {note.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(parseISO(note.content_date), 'd MMM yyyy', { locale: ms })}
                          </span>
                          {note.content_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {note.content_time}
                            </span>
                          )}
                          {note.status === 'completed' && note.completed_at && (
                            <span className="text-green-600">
                              ✓ Selesai
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Note Dialog */}
      <AddMarketingNoteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onNoteAdded={fetchMarketingNotes} 
      />
    </div>
  );
};

export default Marketing;
