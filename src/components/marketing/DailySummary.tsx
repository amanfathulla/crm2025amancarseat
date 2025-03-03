
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ListTodoIcon, NotebookIcon } from "lucide-react";
import { MarketingEvent } from "@/types/marketing";
import { EventList } from "./EventList";

interface DailySummaryProps {
  date: Date | undefined;
  events: MarketingEvent[];
  tasks: any[];
  notes: any[];
  onEditEvent: (event: MarketingEvent) => void;
  onDeleteEvent: (id: string) => void;
  isLoading: boolean;
}

export function DailySummary({ 
  date, 
  events, 
  tasks, 
  notes, 
  onEditEvent, 
  onDeleteEvent,
  isLoading 
}: DailySummaryProps) {
  const [activeTab, setActiveTab] = useState<string>("tasks");

  if (!date) return null;

  return (
    <div>
      <h3 className="font-medium mb-3">
        {date.toLocaleDateString(undefined, { dateStyle: "long" })}
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <EventList 
            events={events}
            onEdit={onEditEvent}
            onDelete={onDeleteEvent}
          />
            
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
              {tasks.length > 0 ? (
                tasks.map((task) => (
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
              {notes.length > 0 ? (
                notes.map((note) => (
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
        </>
      )}
    </div>
  );
}
