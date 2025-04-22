
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface MassDeleteCustomersDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedCustomers: string[]
  onSuccess: () => void
}

export function MassDeleteCustomersDialog({
  isOpen,
  onClose,
  selectedCustomers,
  onSuccess,
}: MassDeleteCustomersDialogProps) {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", selectedCustomers)

      if (error) throw error

      toast({
        title: "Berjaya!",
        description: `${selectedCustomers.length} pelanggan telah dihapuskan.`,
      })
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting customers:", error)
      toast({
        title: "Error",
        description: "Gagal menghapuskan pelanggan. Sila cuba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anda pasti?</AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan menghapuskan {selectedCustomers.length} pelanggan. Tindakan ini tidak boleh dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
