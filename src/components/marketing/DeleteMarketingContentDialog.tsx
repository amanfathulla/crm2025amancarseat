
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface DeleteMarketingContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentTitle: string;
  onSuccess: () => void;
}

export function DeleteMarketingContentDialog({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  onSuccess,
}: DeleteMarketingContentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("marketing_content")
        .delete()
        .eq("id", contentId);

      if (error) throw error;

      toast({
        title: "Content deleted",
        description: `The marketing content "${contentTitle}" has been deleted.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting marketing content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete marketing content.",
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
            This will permanently delete the marketing content "{contentTitle}". This action cannot be undone.
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
