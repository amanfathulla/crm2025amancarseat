
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YearlySalesFormData } from "@/types/sales";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface YearlySalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  salesRecord?: YearlySalesFormData;
  onSuccess: () => void;
}

export function YearlySalesForm({ isOpen, onClose, salesRecord, onSuccess }: YearlySalesFormProps) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<YearlySalesFormData>(
    salesRecord || {
      year: currentYear,
      total_revenue: 0,
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
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: numValue };
      
      // If updating individual quarters, recalculate total
      if (name.startsWith("quarter_")) {
        newData.total_revenue = newData.quarter_1 + newData.quarter_2 + newData.quarter_3 + newData.quarter_4;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (salesRecord) {
        // Update existing sales record
        const { error } = await supabase
          .from("yearly_sales")
          .update({
            year: formData.year,
            total_revenue: formData.total_revenue,
            quarter_1: formData.quarter_1,
            quarter_2: formData.quarter_2,
            quarter_3: formData.quarter_3,
            quarter_4: formData.quarter_4,
          })
          .eq("year", salesRecord.year);

        if (error) throw error;
        toast({
          title: "Sales record updated",
          description: `Sales record for year ${formData.year} has been updated.`,
        });
      } else {
        // Check if record for this year already exists
        const { data: existingRecord, error: checkError } = await supabase
          .from("yearly_sales")
          .select("*")
          .eq("year", formData.year)
          .single();

        if (checkError && !checkError.message.includes('No rows found')) {
          throw checkError;
        }

        if (existingRecord) {
          toast({
            title: "Year already exists",
            description: `A sales record for ${formData.year} already exists.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Add new sales record
        const { error: insertError } = await supabase
          .from("yearly_sales")
          .insert([
            {
              year: formData.year,
              total_revenue: formData.total_revenue,
              quarter_1: formData.quarter_1,
              quarter_2: formData.quarter_2,
              quarter_3: formData.quarter_3,
              quarter_4: formData.quarter_4,
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
              <Label htmlFor="total_revenue">Total Revenue</Label>
              <Input
                id="total_revenue"
                name="total_revenue"
                type="number"
                min={0}
                step="0.01"
                value={formData.total_revenue}
                onChange={handleChange}
                required
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_1">Q1 Revenue</Label>
              <Input
                id="quarter_1"
                name="quarter_1"
                type="number"
                min={0}
                step="0.01"
                value={formData.quarter_1}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_2">Q2 Revenue</Label>
              <Input
                id="quarter_2"
                name="quarter_2"
                type="number"
                min={0}
                step="0.01"
                value={formData.quarter_2}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_3">Q3 Revenue</Label>
              <Input
                id="quarter_3"
                name="quarter_3"
                type="number"
                min={0}
                step="0.01"
                value={formData.quarter_3}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter_4">Q4 Revenue</Label>
              <Input
                id="quarter_4"
                name="quarter_4"
                type="number"
                min={0}
                step="0.01"
                value={formData.quarter_4}
                onChange={handleChange}
                required
              />
            </div>
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
