import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Clock, Megaphone, Bell, ListTodo, Pencil, Trash2, FileText } from 'lucide-react';
import { format, isSameMonth, isSameDay, parseISO } from 'date-fns';
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
import { EditMarketingNoteDialog } from '@/components/marketing/EditMarketingNoteDialog';
import { DeleteMarketingNoteDialog } from '@/components/marketing/DeleteMarketingNoteDialog';
import { cn } from '@/lib/utils';

const Marketing = () => {
  const { authClient } = useAuth();
  const [notes, setNotes] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editNote, setEditNote] = useState<MarketingContent | null>(null);
  const [deleteNote, setDeleteNote] = useState<{ id: string; title: string } | null>(null);

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
    const subscription = supabase
      .channel('marketing_content_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_content' }, fetchMarketingNotes)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const getNotesForDate = (date: Date) => {
    return notes.filter(note => isSameDay(parseISO(note.content_date), date));
  };

  const datesWithNotes = useMemo(() => {
    return notes.map(note => parseISO(note.content_date));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => isSameMonth(parseISO(note.content_date), currentMonth));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        (note.description && note.description.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [notes, currentMonth, searchQuery]);

  // Stats
  const totalNotes = notes.length;
  const completedNotes = notes.filter(n => n.status === 'completed').length;
  const pendingNotes = notes.filter(n => n.status === 'pending').length;
  const thisMonthNotes = notes.filter(n => isSameMonth(parseISO(n.content_date), new Date())).length;

  const handleStatusToggle = async (noteId: string, currentStatus: MarketingContentStatus) => {
    const newStatus: MarketingContentStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
        : note
    ));
    const result = await updateMarketingNoteStatus(noteId, newStatus);
    if (!result.success) {
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, status: currentStatus } : note
      ));
      toast.error('Gagal kemaskini status');
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getMediaBadgeClass = (media?: MarketingContentMedia | null) => {
    switch (media) {
      case 'tiktok': return 'bg-black text-white';
      case 'facebook': return 'bg-blue-600 text-white';
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statCards = [
    { label: 'Jumlah Nota', value: totalNotes, gradient: 'from-blue-500 to-blue-600', icon: FileText },
    { label: 'Bulan Ini', value: thisMonthNotes, gradient: 'from-purple-500 to-purple-600', icon: CalendarIcon },
    { label: 'Selesai', value: completedNotes, gradient: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 },
    { label: 'Belum Selesai', value: pendingNotes, gradient: 'from-amber-500 to-amber-600', icon: Clock },
  ];

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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-lg`}>
            <div className="absolute top-0 right-0 -mt-3 -mr-3 w-16 h-16 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
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

      {/* Calendar - Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl">
              {format(currentMonth, 'MMMM yyyy', { locale: ms })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
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
            className="rounded-md w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-sm text-center",
              row: "flex w-full mt-2",
              cell: "flex-1 text-center text-sm relative p-0 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-bold",
            }}
            modifiers={{ hasNotes: datesWithNotes }}
            modifiersStyles={{
              hasNotes: {
                backgroundColor: 'hsl(262 80% 50% / 0.15)',
                fontWeight: 'bold',
                borderBottom: '3px solid hsl(262 80% 50%)',
              }
            }}
          />
          
          {/* Selected date preview */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">
              📅 {format(selectedDate, 'd MMMM yyyy', { locale: ms })}
            </h4>
            <div className="space-y-2">
              {getNotesForDate(selectedDate).length > 0 ? (
                getNotesForDate(selectedDate).map(note => (
                  <div 
                    key={note.id} 
                    className={cn(
                      "text-sm p-2 rounded-md flex items-center gap-2",
                      note.status === 'completed' ? 'bg-emerald-500/10 line-through text-muted-foreground' : 'bg-primary/10'
                    )}
                  >
                    {note.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-primary shrink-0" />}
                    <span className="flex-1">{note.title}</span>
                    {note.media && note.media !== 'none' && (
                      <Badge className={cn("text-xs", getMediaBadgeClass(note.media))}>{note.media}</Badge>
                    )}
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
      <Card>
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
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                        {note.status === 'completed' && (
                          <span className="text-emerald-600 font-medium">✓ Selesai</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditNote(note)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteNote({ id: note.id, title: note.title })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddMarketingNoteDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onNoteAdded={fetchMarketingNotes}
        defaultDate={selectedDate.toISOString().split('T')[0]}
      />
      
      <EditMarketingNoteDialog
        open={!!editNote}
        onOpenChange={(open) => !open && setEditNote(null)}
        note={editNote}
        onNoteUpdated={fetchMarketingNotes}
      />

      <DeleteMarketingNoteDialog
        open={!!deleteNote}
        onOpenChange={(open) => !open && setDeleteNote(null)}
        noteId={deleteNote?.id || null}
        noteTitle={deleteNote?.title || ''}
        onNoteDeleted={fetchMarketingNotes}
      />
    </div>
  );
};

export default Marketing;
