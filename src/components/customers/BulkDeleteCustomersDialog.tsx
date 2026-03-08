
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BulkDeleteCustomersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: string[];
  onSuccess: () => void;
}

export function BulkDeleteCustomersDialog({
  isOpen,
  onClose,
  selectedCustomers,
  onSuccess,
}: BulkDeleteCustomersDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", selectedCustomers);

      if (error) throw error;

      toast({
        title: "Customers deleted",
        description: `${selectedCustomers.length} customers have been removed.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting customers:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customers.",
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
          <AlertDialogTitle>Anda pasti ingin hapus {selectedCustomers.length} pelanggan?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat diundur. Ini akan menghapuskan secara kekal rekod pelanggan yang dipilih.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
