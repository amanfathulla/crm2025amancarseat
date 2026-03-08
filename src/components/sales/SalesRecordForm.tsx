
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesRecordFormData } from "@/types/sales";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SalesRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  salesRecord?: SalesRecordFormData & { id?: string };
  onSuccess: () => void;
}

export function SalesRecordForm({ isOpen, onClose, salesRecord, onSuccess }: SalesRecordFormProps) {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const today = new Date();
  
  const [formData, setFormData] = useState<SalesRecordFormData>(
    salesRecord || {
      date: format(today, 'yyyy-MM-dd'),
      amount: 0,
      description: '',
      category: '',
    }
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    salesRecord?.date ? new Date(salesRecord.date) : today
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "amount") {
      // Parse float but prevent NaN by defaulting to 0
      const numValue = parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (salesRecord?.id) {
        // Update existing sales record
        const { error } = await supabase
          .from("sales_records")
          .update({
            date: formData.date,
            amount: formData.amount,
            description: formData.description || null,
            category: formData.category || null,
          })
          .eq("id", salesRecord.id);

        if (error) throw error;
        toast({
          title: "Sales record updated",
          description: `Sales record has been updated.`,
        });
      } else {
        // Add new sales record
        const { error } = await supabase
          .from("sales_records")
          .insert([{
            date: formData.date,
            amount: formData.amount,
            description: formData.description || null,
            category: formData.category || null,
          }]);

        if (error) throw error;
        toast({
          title: "Sales record added",
          description: `New sales record has been added.`,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving sales record:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save sales record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{salesRecord?.id ? "Edit Sales Record" : "Add Sales Record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (RM)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0}
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              placeholder="e.g. Services, Products"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Brief description of the sale"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : salesRecord?.id ? "Update" : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
