
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteOldMarketingNotes } from "@/utils/marketingUtils";
import { toast } from "sonner";

interface DeleteMarketingNotesAlertProps {
  deleteInfo: {
    date: string;
    count: number;
  };
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteMarketingNotesAlert({ deleteInfo, onClose, onDeleted }: DeleteMarketingNotesAlertProps) {
  const handleDeleteOldNotes = async () => {
    try {
      const result = await deleteOldMarketingNotes();
      
      if (result.success) {
        toast.success(`${result.deletedCount} nota selesai sebelum ${deleteInfo.date} telah dibuang.`);
        onDeleted();
      } else {
        throw new Error('Failed to delete notes');
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting old notes:', error);
      toast.error('Failed to delete old notes');
    }
  };

  return (
    <Card className="mb-3 p-2 bg-amber-950/30 border-amber-500/50">
      <div className="flex gap-2 items-start">
        <AlertTriangle className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-medium text-amber-200">Nota Telah Selesai</p>
          <p className="text-amber-200/80">
            {deleteInfo.count} nota selesai sebelum {deleteInfo.date} akan dibuang secara automatik.
          </p>
          <div className="flex gap-2 mt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 bg-white/10 border-white/20 hover:bg-white/20 text-white"
              onClick={onClose}
            >
              Simpan
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-7 px-2"
              onClick={handleDeleteOldNotes}
            >
              Buang Sekarang
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
