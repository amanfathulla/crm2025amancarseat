
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Sample data for calendar events
const sampleEvents = [
  { date: new Date(2023, 6, 12), title: "Post Facebook Ad", type: "facebook" },
  { date: new Date(2023, 6, 14), title: "Instagram Story", type: "instagram" },
  { date: new Date(2023, 6, 18), title: "TikTok Video", type: "tiktok" },
  { date: new Date(2023, 6, 20), title: "Email Campaign", type: "email" },
];

export function MarketingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Get events for the selected date
  const selectedDateEvents = sampleEvents.filter(
    (event) => date && event.date.toDateString() === date.toDateString()
  );

  // Function to render day contents with event indicators
  const renderDayContents = (day: Date) => {
    const eventsOnDay = sampleEvents.filter(
      (event) => event.date.toDateString() === day.toDateString()
    );

    if (eventsOnDay.length === 0) return null;

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
        <CardTitle>Marketing Calendar</CardTitle>
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
            <div className="space-y-2">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event, index) => (
                  <div key={index} className="flex items-center p-2 border rounded-md">
                    <Badge
                      variant="outline"
                      className={`mr-2 ${
                        event.type === "facebook"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : event.type === "instagram"
                          ? "bg-pink-100 text-pink-800 border-pink-200"
                          : event.type === "tiktok"
                          ? "bg-black text-white border-gray-700"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {event.type}
                    </Badge>
                    <span>{event.title}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No events scheduled for this date</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
