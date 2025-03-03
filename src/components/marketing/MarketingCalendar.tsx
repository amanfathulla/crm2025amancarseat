
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSameDay } from "@/utils/dateUtils";
import { useMarketingEvents } from "@/hooks/useMarketingEvents";
import { MarketingEvent, MarketingTask, MarketingNote } from "@/types/marketing";
import { DayContent } from "./CalendarDayContent";
import { DailySummary } from "./DailySummary";
import { EventDialog } from "./EventDialog";
import { getSampleTasks, getSampleNotes } from "@/utils/sampleData";

export function MarketingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<MarketingEvent | null>(null);
  
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useMarketingEvents();
  
  // Get sample data with proper typing
  const tasks: MarketingTask[] = getSampleTasks();
  const notes: MarketingNote[] = getSampleNotes() as MarketingNote[];
  
  // Get events for the selected date
  const selectedDateEvents = events.filter(
    (event) => date && isSameDay(event.date instanceof Date ? event.date : new Date(event.date), date)
  );

  // Get tasks for the selected date
  const selectedDateTasks = tasks.filter(
    (task) => date && new Date(task.dueDate).toDateString() === date.toDateString()
  );

  // Get notes for the selected date
  const selectedDateNotes = notes.filter(
    (note) => date && new Date(note.date).toDateString() === date.toDateString()
  );

  // Handle adding or updating an event
  const handleSaveEvent = async (title: string, eventType: string, description: string) => {
    if (!date || !title.trim()) return;

    if (currentEvent) {
      // Update existing event
      await updateEvent(currentEvent.id, {
        title: title,
        type: eventType as any,
        description: description,
      });
    } else {
      // Add new event
      await addEvent({
        title: title,
        date: date,
        type: eventType as any,
        description: description.trim() || undefined,
      });
    }

    // Reset and close dialog
    setCurrentEvent(null);
    setIsEventDialogOpen(false);
  };

  // Handle editing an event
  const handleEditEvent = (event: MarketingEvent) => {
    setCurrentEvent(event);
    setIsEventDialogOpen(true);
  };

  // Open dialog for adding a new event
  const openNewEventDialog = () => {
    setCurrentEvent(null);
    setIsEventDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Marketing Calendar
          </CardTitle>
          <Button size="sm" onClick={openNewEventDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
        <CardDescription>
          Click on a date to view tasks and notes for that day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="col-span-1 md:col-span-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              components={{
                DayContent: (props) => (
                  <DayContent 
                    date={props.date} 
                    events={events} 
                    tasks={tasks} 
                    notes={notes} 
                  />
                ),
              }}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <DailySummary
              date={date}
              events={selectedDateEvents}
              tasks={selectedDateTasks}
              notes={selectedDateNotes}
              onEditEvent={handleEditEvent}
              onDeleteEvent={deleteEvent}
              isLoading={isLoading}
            />
          </div>
        </div>
      </CardContent>

      {/* Dialog for adding/editing events */}
      <EventDialog 
        isOpen={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        currentEvent={currentEvent}
        onSave={handleSaveEvent}
      />
    </Card>
  );
}
