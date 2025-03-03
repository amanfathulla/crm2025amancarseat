
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, getDay } from "date-fns";
import { 
  CalendarIcon, 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Pencil,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MarketingContent } from "@/types/marketing";
import { MarketingContentDialog } from "@/components/marketing/MarketingContentDialog";
import { DeleteMarketingContentDialog } from "@/components/marketing/DeleteMarketingContentDialog";

export default function Marketing() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [marketingContents, setMarketingContents] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<MarketingContent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Format dates for display
  const formattedToday = format(today, "EEEE, MMMM d, yyyy");
  const formattedTomorrow = format(tomorrow, "EEEE, MMMM d, yyyy");
  const currentMonth = format(date, "MMMM yyyy");

  // Filter content for today and tomorrow
  const todayContent = marketingContents.filter(content => 
    isSameDay(parseISO(content.content_date), today)
  );
  
  const tomorrowContent = marketingContents.filter(content => 
    isSameDay(parseISO(content.content_date), tomorrow)
  );
  
  // Stats for the cards
  const stats = {
    totalTasks: marketingContents.length,
    completedTasks: marketingContents.filter(content => content.status === 'completed').length,
    pendingTasks: marketingContents.filter(content => content.status === 'pending').length
  };

  // Fetch marketing content from Supabase
  const fetchMarketingContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketing_content")
        .select("*")
        .order("content_date", { ascending: true });
      
      if (error) throw error;
      
      setMarketingContents(data as MarketingContent[]);
    } catch (error: any) {
      console.error("Error fetching marketing content:", error);
      toast({
        title: "Error",
        description: "Failed to load marketing content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingContent();
  }, []);

  // Navigation functions for month view
  const previousMonth = () => {
    const prevMonth = new Date(date);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setDate(prevMonth);
  };

  const nextMonth = () => {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setDate(nextMonth);
  };

  // Handlers for dialog open/close
  const handleAddContent = (date?: Date) => {
    setSelectedDate(date || null);
    setIsAddDialogOpen(true);
  };

  const handleEditContent = (content: MarketingContent) => {
    setSelectedContent(content);
    setIsEditDialogOpen(true);
  };

  const handleDeleteContent = (content: MarketingContent) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDay = getDay(monthStart);
    const daysInMonth = parseInt(format(monthEnd, "d"));
    
    const days = [];
    let day = 1;
    
    for (let i = 0; i < 42; i++) {
      if (i >= startDay && day <= daysInMonth) {
        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
        const dayContents = marketingContents.filter(content => 
          isSameDay(parseISO(content.content_date), currentDate)
        );
        
        days.push({
          day,
          date: currentDate,
          isCurrentMonth: true,
          contents: dayContents
        });
        
        day++;
      } else {
        days.push({ 
          day: null, 
          date: null, 
          isCurrentMonth: false,
          contents: []
        });
      }
    }
    
    return days;
  };

  return (
    <MainLayout>
      <section className="mb-6 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Marketing Calendar</h1>
        <p className="text-muted-foreground">Plan and manage your content schedule</p>
      </section>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Tasks" 
          value={stats.totalTasks} 
          icon={<ListTodo className="h-6 w-6 text-blue-500" />}
          iconBackground="bg-blue-50"
        />
        <StatCard 
          title="Completed" 
          value={stats.completedTasks} 
          icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
          iconBackground="bg-green-50"
        />
        <StatCard 
          title="Pending" 
          value={stats.pendingTasks} 
          icon={<Clock className="h-6 w-6 text-orange-500" />}
          iconBackground="bg-orange-50"
        />
      </div>
      
      {/* Today's Content */}
      <ContentSection 
        title="Today's Content" 
        date={formattedToday}
        content={todayContent}
        taskCount={`${todayContent.length} Tasks`}
        isLoading={isLoading}
        onAdd={() => handleAddContent(today)}
        onEdit={handleEditContent}
        onDelete={handleDeleteContent}
      />
      
      {/* Tomorrow's Content */}
      <ContentSection 
        title="Tomorrow's Content" 
        date={formattedTomorrow}
        content={tomorrowContent}
        taskCount={`${tomorrowContent.length} Tasks`}
        isLoading={isLoading}
        onAdd={() => handleAddContent(tomorrow)}
        onEdit={handleEditContent}
        onDelete={handleDeleteContent}
      />
      
      {/* Calendar View */}
      <Card className="mb-6 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={previousMonth}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-xl font-medium">{currentMonth}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
                className="ml-2"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={() => handleAddContent()}
            >
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
            {/* Calendar header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium bg-card">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {generateCalendarDays().map((dayObj, i) => (
              <div 
                key={i} 
                className={`min-h-24 p-2 bg-card border-t 
                  ${!dayObj.isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''} 
                  ${i % 7 === 0 ? 'border-l' : ''} 
                  hover:bg-accent/10 transition-colors
                  ${dayObj.isCurrentMonth ? 'cursor-pointer' : ''}`}
                onClick={() => dayObj.isCurrentMonth && handleAddContent(dayObj.date)}
              >
                {dayObj.isCurrentMonth && (
                  <>
                    <div className="text-right font-medium">{dayObj.day}</div>
                    <div className="mt-1 space-y-1">
                      {dayObj.contents.length > 0 ? (
                        dayObj.contents.slice(0, 2).map(content => (
                          <div 
                            key={content.id} 
                            className={`text-xs p-1 rounded truncate ${
                              content.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                            title={content.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditContent(content);
                            }}
                          >
                            {content.title}
                          </div>
                        ))
                      ) : null}
                      {dayObj.contents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayObj.contents.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {isAddDialogOpen && (
        <MarketingContentDialog 
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={fetchMarketingContent}
          selectedDate={selectedDate || undefined}
        />
      )}

      {isEditDialogOpen && selectedContent && (
        <MarketingContentDialog 
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedContent(null);
          }}
          onSuccess={fetchMarketingContent}
          initialData={selectedContent}
        />
      )}

      {isDeleteDialogOpen && selectedContent && (
        <DeleteMarketingContentDialog 
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedContent(null);
          }}
          contentId={selectedContent.id}
          contentTitle={selectedContent.title}
          onSuccess={fetchMarketingContent}
        />
      )}
    </MainLayout>
  );
}

// Component for stats cards
function StatCard({ 
  title, 
  value, 
  icon, 
  iconBackground 
}: { 
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBackground: string;
}) {
  return (
    <Card className="animate-slide-up shadow-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span className="text-3xl font-bold mt-1">{value}</span>
        </div>
        <div className={`h-12 w-12 rounded-full ${iconBackground} flex items-center justify-center`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for content sections (Today/Tomorrow)
function ContentSection({ 
  title, 
  date, 
  content, 
  taskCount,
  isLoading,
  onAdd,
  onEdit,
  onDelete
}: { 
  title: string;
  date: string;
  content: MarketingContent[];
  taskCount: string;
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (content: MarketingContent) => void;
  onDelete: (content: MarketingContent) => void;
}) {
  return (
    <Card className="mb-6 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{date}</CardDescription>
        </div>
        <div className="text-sm text-muted-foreground">
          {taskCount}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading content...
          </div>
        ) : content.length > 0 ? (
          <div className="space-y-3">
            {content.map(item => (
              <div key={item.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{item.title}</h4>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  {item.content_time && (
                    <span className="flex items-center mr-3">
                      <Clock className="h-3 w-3 mr-1" /> {item.content_time}
                    </span>
                  )}
                  <span className="mr-3">{item.type}</span>
                  <span className={item.status === 'completed' ? 'text-green-500' : 'text-amber-500'}>
                    {item.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No content scheduled for this day
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <Button variant="outline" className="w-full" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Content
        </Button>
      </CardFooter>
    </Card>
  );
}
