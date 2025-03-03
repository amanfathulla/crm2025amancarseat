
import { MarketingEvent, MarketingTask } from "@/types/marketing";
import { isSameDay } from "@/utils/dateUtils";

interface DayContentProps {
  date: Date;
  events: MarketingEvent[];
  tasks: MarketingTask[];
  notes: any[];
}

export function renderDayContents({ date, events, tasks, notes }: DayContentProps) {
  const eventsOnDay = events.filter(
    (event) => isSameDay(event.date instanceof Date ? event.date : new Date(event.date), date)
  );

  const tasksOnDay = tasks.filter(
    (task) => isSameDay(new Date(task.dueDate), date)
  );

  const notesOnDay = notes.filter(
    (note) => isSameDay(new Date(note.date), date)
  );

  const totalItems = eventsOnDay.length + tasksOnDay.length + notesOnDay.length;

  if (totalItems === 0) return null;

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="h-1 w-1 rounded-full bg-primary"></div>
      </div>
    </div>
  );
}

export function DayContent(props: { date: Date; events: MarketingEvent[]; tasks: MarketingTask[]; notes: any[] }) {
  return (
    <div className="relative h-full w-full p-0">
      <div className="relative h-full w-full flex items-center justify-center">
        {props.date.getDate()}
      </div>
      {renderDayContents({
        date: props.date,
        events: props.events,
        tasks: props.tasks,
        notes: props.notes
      })}
    </div>
  );
}
