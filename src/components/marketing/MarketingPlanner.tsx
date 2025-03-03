
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingCalendar } from "./MarketingCalendar";
import { MarketingNotes } from "./MarketingNotes";
import { MarketingTasks } from "./MarketingTasks";

export function MarketingPlanner() {
  return (
    <Tabs defaultValue="calendar" className="animate-fade-in">
      <TabsList className="mb-6">
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      
      <TabsContent value="calendar" className="space-y-6">
        <MarketingCalendar />
      </TabsContent>
      
      <TabsContent value="tasks" className="space-y-6">
        <MarketingTasks />
      </TabsContent>
      
      <TabsContent value="notes" className="space-y-6">
        <MarketingNotes />
      </TabsContent>
    </Tabs>
  );
}
