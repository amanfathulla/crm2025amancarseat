
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YearlySalesFormData } from "@/types/sales";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface YearlySalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  salesRecord?: YearlySalesFormData;
  onSuccess: () => void;
}

export function YearlySalesForm({ isOpen, onClose, salesRecord, onSuccess }: YearlySalesFormProps) {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<YearlySalesFormData>(
    salesRecord || {
      year: currentYear,
      total_revenue: 0,
      total_profit: 0, // Initialize total profit
      quarter_1: 0,
      quarter_2: 0,
      quarter_3: 0,
      quarter_4: 0,
    }
  );
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numValue = name === "year" ? parseInt(value) : parseFloat(value);
    
    if (isNaN(numValue)) numValue = 0;
    
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (salesRecord) {
        // Update existing sales record
        const { error } = await authClient
          .from("yearly_sales")
          .update({
            year: formData.year,
            total_revenue: formData.total_revenue,
            total_profit: formData.total_profit, // Update total profit
            quarter_1: 0,  // Set all quarters to 0 since we're not using them
            quarter_2: 0,
            quarter_3: 0,
            quarter_4: 0,
          })
          .eq("year", salesRecord.year);

        if (error) throw error;
        toast({
          title: "Sales record updated",
          description: `Sales record for year ${formData.year} has been updated.`,
        });
      } else {
        // Check if record for this year already exists
        const { data: existingRecords, error: checkError } = await authClient
          .from("yearly_sales")
          .select("*")
          .eq("year", formData.year);

        if (checkError) {
          throw checkError;
        }

        // Now we check if there are any records in the array
        if (existingRecords && existingRecords.length > 0) {
          toast({
            title: "Year already exists",
            description: `A sales record for ${formData.year} already exists.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Add new sales record
        const { error: insertError } = await authClient
          .from("yearly_sales")
          .insert([
            {
              year: formData.year,
              total_revenue: formData.total_revenue,
              total_profit: formData.total_profit, // Add total profit
              quarter_1: 0,  // Set all quarters to 0 since we're not using them
              quarter_2: 0,
              quarter_3: 0,
              quarter_4: 0,
            },
          ]);

        if (insertError) throw insertError;
        toast({
          title: "Sales record added",
          description: `New sales record for year ${formData.year} has been added.`,
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
          <DialogTitle>{salesRecord ? "Edit Sales Record" : "Add Yearly Sales Record"}</DialogTitle>
          <DialogDescription>
            {salesRecord ? "Update the yearly sales record." : "Add a new yearly sales record."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={2000}
                max={2100}
                value={formData.year}
                onChange={handleChange}
                required
                readOnly={!!salesRecord}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_revenue">Total Revenue (RM)</Label>
              <Input
                id="total_revenue"
                name="total_revenue"
                type="number"
                min={0}
                step="0.01"
                value={formData.total_revenue}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total_profit">Total Profit (RM)</Label>
            <Input
              id="total_profit"
              name="total_profit"
              type="number"
              min={0}
              step="0.01"
              value={formData.total_profit}
              onChange={handleChange}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : salesRecord ? "Update" : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
