
import { MarketingEvent } from "@/types/marketing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2Icon, TrashIcon } from "lucide-react";

interface EventListProps {
  events: MarketingEvent[];
  onEdit: (event: MarketingEvent) => void;
  onDelete: (id: string) => void;
}

export function EventList({ events, onEdit, onDelete }: EventListProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium mb-2">Events</h4>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="p-3 border rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium">{event.title}</h5>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
                <Badge variant="outline" className="mt-2">
                  {event.type}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                  <Edit2Icon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(event.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
