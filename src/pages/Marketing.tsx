
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { 
  CalendarIcon, 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  ChevronLeft, 
  ChevronRight, 
  Plus 
} from "lucide-react";
import { useState } from "react";

export default function Marketing() {
  const [date, setDate] = useState<Date>(new Date());
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Format dates for display
  const formattedToday = format(today, "EEEE, MMMM d, yyyy");
  const formattedTomorrow = format(tomorrow, "EEEE, MMMM d, yyyy");
  const currentMonth = format(date, "MMMM yyyy");

  // Placeholder content for demonstration
  const todayContent: MarketingContent[] = [];
  const tomorrowContent: MarketingContent[] = [];
  
  // Stats for the cards
  const stats = {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  };

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
        taskCount={`${todayContent.length}/0 Tasks`}
      />
      
      {/* Tomorrow's Content */}
      <ContentSection 
        title="Tomorrow's Content" 
        date={formattedTomorrow}
        content={tomorrowContent}
        taskCount={`${tomorrowContent.length}/0 Tasks`}
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
            <Button variant="default" className="flex items-center gap-2">
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
            
            {/* Calendar days - simplified example */}
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = i - new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
              
              return (
                <div 
                  key={i} 
                  className={`min-h-24 p-2 bg-card border-t ${!isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''} 
                              ${i % 7 === 0 ? 'border-l' : ''} hover:bg-accent/10 transition-colors`}
                >
                  {isCurrentMonth && (
                    <div className="text-right font-medium">{dayNum}</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

// Types
interface MarketingContent {
  id: string;
  title: string;
  time?: string;
  type: string;
  status: 'completed' | 'pending';
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
  taskCount 
}: { 
  title: string;
  date: string;
  content: MarketingContent[];
  taskCount: string;
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
        {content.length > 0 ? (
          <div className="space-y-3">
            {content.map(item => (
              <div key={item.id} className="p-3 border rounded-md">
                <h4 className="font-medium">{item.title}</h4>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  {item.time && (
                    <span className="flex items-center mr-3">
                      <Clock className="h-3 w-3 mr-1" /> {item.time}
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
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Add Content
        </Button>
      </CardFooter>
    </Card>
  );
}
