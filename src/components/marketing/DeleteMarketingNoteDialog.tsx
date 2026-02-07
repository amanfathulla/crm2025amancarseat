import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteMarketingNote } from "@/utils/marketingUtils";

interface DeleteMarketingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
  noteTitle: string;
  onNoteDeleted: () => void;
}

export function DeleteMarketingNoteDialog({ open, onOpenChange, noteId, noteTitle, onNoteDeleted }: DeleteMarketingNoteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!noteId) return;
    try {
      setIsDeleting(true);
      const result = await deleteMarketingNote(noteId);
      if (!result.success) throw new Error(result.error || 'Failed to delete');
      toast.success('Nota berjaya dipadam');
      onNoteDeleted();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memadam nota');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Padam Nota Marketing?</AlertDialogTitle>
          <AlertDialogDescription>
            Anda pasti mahu memadam nota "<strong>{noteTitle}</strong>"? Tindakan ini tidak boleh dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? 'Memadam...' : 'Padam'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
