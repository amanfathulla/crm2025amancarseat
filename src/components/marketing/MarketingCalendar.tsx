
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, ListTodoIcon, NotebookIcon } from "lucide-react";
import { isSameDay } from "@/utils/dateUtils";

// Import sample data from other components
import { MarketingTasks } from "./MarketingTasks";
import { MarketingNotes } from "./MarketingNotes";

// Get sample tasks from MarketingTasks component
const getSampleTasks = () => {
  return [
    {
      id: 1,
      title: "Create Facebook ad for new product launch",
      dueDate: "2023-07-15",
      completed: false,
      type: "facebook",
    },
    {
      id: 2,
      title: "Post weekly Instagram update",
      dueDate: "2023-07-12",
      completed: true,
      type: "instagram",
    },
    {
      id: 3,
      title: "Record TikTok product demo",
      dueDate: "2023-07-14",
      completed: false,
      type: "tiktok",
    },
    {
      id: 4,
      title: "Review marketing analytics",
      dueDate: "2023-07-13",
      completed: false,
      type: "general",
    },
  ];
};

// Get sample notes from MarketingNotes component
const getSampleNotes = () => {
  return [
    {
      id: 1,
      title: "Q3 Marketing Strategy",
      content: "Focus on product awareness and user acquisition through social media.",
      date: "July 10, 2023",
    },
    {
      id: 2,
      title: "Content Ideas",
      content: "Tutorial videos, customer success stories, product updates.",
      date: "July 8, 2023",
    },
  ];
};

// Sample data for calendar events
const sampleEvents = [
  { date: new Date(2023, 6, 12), title: "Post Facebook Ad", type: "facebook" },
  { date: new Date(2023, 6, 14), title: "Instagram Story", type: "instagram" },
  { date: new Date(2023, 6, 18), title: "TikTok Video", type: "tiktok" },
  { date: new Date(2023, 6, 20), title: "Email Campaign", type: "email" },
];

export function MarketingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState<string>("tasks");
  
  const tasks = getSampleTasks();
  const notes = getSampleNotes();
  
  // Get events for the selected date
  const selectedDateEvents = sampleEvents.filter(
    (event) => date && isSameDay(event.date, date)
  );

  // Get tasks for the selected date
  const selectedDateTasks = tasks.filter(
    (task) => date && new Date(task.dueDate).toDateString() === date.toDateString()
  );

  // Get notes for the selected date - mocking this with a conversion
  const selectedDateNotes = notes.filter(
    (note) => date && new Date(note.date).toDateString() === date.toDateString()
  );

  // Function to render day contents with event indicators
  const renderDayContents = (day: Date) => {
    const eventsOnDay = sampleEvents.filter(
      (event) => isSameDay(event.date, day)
    );

    const tasksOnDay = tasks.filter(
      (task) => isSameDay(new Date(task.dueDate), day)
    );

    const notesOnDay = notes.filter(
      (note) => isSameDay(new Date(note.date), day)
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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Marketing Calendar
        </CardTitle>
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
                  <div className="relative h-full w-full p-0">
                    <div className="relative h-full w-full flex items-center justify-center">
                      {props.date.getDate()}
                    </div>
                    {renderDayContents(props.date)}
                  </div>
                ),
              }}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-medium mb-3">
              {date ? date.toLocaleDateString(undefined, { dateStyle: "long" }) : "Select a date"}
            </h3>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="tasks" className="flex items-center gap-1">
                  <ListTodoIcon className="h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <NotebookIcon className="h-4 w-4" />
                  Notes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="space-y-2">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map((task) => (
                    <div key={task.id} className="flex items-center p-2 border rounded-md">
                      <Badge
                        variant="outline"
                        className={`mr-2 ${
                          task.type === "facebook"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : task.type === "instagram"
                            ? "bg-pink-100 text-pink-800 border-pink-200"
                            : task.type === "tiktok"
                            ? "bg-black text-white border-gray-700"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {task.type}
                      </Badge>
                      <span className={task.completed ? "line-through" : ""}>
                        {task.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No tasks scheduled for this date</p>
                )}
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-2">
                {selectedDateNotes.length > 0 ? (
                  selectedDateNotes.map((note) => (
                    <div key={note.id} className="p-3 border rounded-md">
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No notes for this date</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
