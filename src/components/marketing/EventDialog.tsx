
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketingEvent } from "@/types/marketing";

interface EventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentEvent: MarketingEvent | null;
  onSave: (title: string, type: string, description: string) => void;
}

export function EventDialog({ isOpen, onOpenChange, currentEvent, onSave }: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("general");
  const [description, setDescription] = useState("");

  // Reset form state when dialog opens with a new event or closes
  useEffect(() => {
    if (isOpen && currentEvent) {
      setTitle(currentEvent.title);
      setType(currentEvent.type);
      setDescription(currentEvent.description || "");
    } else if (!isOpen) {
      // Reset when closing
      setTitle("");
      setType("general");
      setDescription("");
    }
  }, [isOpen, currentEvent]);

  const handleSave = () => {
    onSave(title, type, description);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="event-title" className="text-sm font-medium">Title</label>
            <Input
              id="event-title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="event-type" className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="event-description" className="text-sm font-medium">Description (optional)</label>
            <Textarea
              id="event-description"
              placeholder="Event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            {currentEvent ? "Update" : "Add"} Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
