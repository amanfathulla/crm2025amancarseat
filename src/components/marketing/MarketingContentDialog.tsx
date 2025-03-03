
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { MarketingContent, MarketingContentFormValues } from "@/types/marketing";

interface MarketingContentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: MarketingContent;
  selectedDate?: Date;
}

export function MarketingContentDialog({
  open,
  onClose,
  onSuccess,
  initialData,
  selectedDate,
}: MarketingContentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<MarketingContentFormValues>({
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || "",
      content_date: initialData.content_date,
      content_time: initialData.content_time || "",
      type: initialData.type,
      status: initialData.status,
    } : {
      title: "",
      description: "",
      content_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      content_time: "",
      type: "Social Media",
      status: "pending",
    }
  });

  const handleSubmit = async (values: MarketingContentFormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && initialData) {
        // Update existing record
        const { error } = await supabase
          .from("marketing_content")
          .update(values)
          .eq("id", initialData.id);

        if (error) throw error;

        toast({
          title: "Content updated",
          description: "Marketing content has been updated successfully.",
        });
      } else {
        // Create new record
        const { error } = await supabase
          .from("marketing_content")
          .insert(values);

        if (error) throw error;

        toast({
          title: "Content created",
          description: "New marketing content has been added to the calendar.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving marketing content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save marketing content.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Marketing Content" : "Add Marketing Content"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the details of your marketing content." 
              : "Add a new marketing item to your calendar."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter content title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time (optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Blog Post">Blog Post</SelectItem>
                        <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                        <SelectItem value="Press Release">Press Release</SelectItem>
                        <SelectItem value="Advertisement">Advertisement</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
