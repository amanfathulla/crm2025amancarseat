
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteYearlySalesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  salesRecordId: string;
  salesYear: number;
  onSuccess: () => void;
}

export function DeleteYearlySalesDialog({
  isOpen,
  onClose,
  salesRecordId,
  salesYear,
  onSuccess,
}: DeleteYearlySalesDialogProps) {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient
        .from("yearly_sales")
        .delete()
        .eq("id", salesRecordId);

      if (error) throw error;

      toast({
        title: "Sales record deleted",
        description: `Sales record for year ${salesYear} has been deleted.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting sales record:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sales record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the sales record for year {salesYear}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
