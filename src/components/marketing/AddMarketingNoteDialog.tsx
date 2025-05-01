
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Facebook, Instagram } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMarketingNote, MarketingContent, MarketingContentMedia } from "@/utils/marketingUtils";

interface AddMarketingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteAdded: () => void;
}

export function AddMarketingNoteDialog({ open, onOpenChange, onNoteAdded }: AddMarketingNoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState<Partial<MarketingContent>>({
    title: '',
    type: 'task',
    content_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    media: 'none',
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!newNote.title || !newNote.content_date) {
        toast.error('Sila isi tajuk dan tarikh');
        return;
      }
      
      const result = await createMarketingNote({
        title: newNote.title,
        type: 'task',
        content_date: newNote.content_date,
        status: 'pending',
        media: newNote.media as MarketingContentMedia || 'none',
        description: null,
        content_time: null
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add note');
      }
      
      toast.success('Nota marketing baru telah ditambah');
      onNoteAdded();
      
      setNewNote({
        title: '',
        type: 'task',
        content_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        media: 'none',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error?.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mediaOptions = [
    { value: 'none', label: 'Tiada', icon: null },
    { value: 'tiktok', label: 'TikTok', iconText: 'TT' },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Nota Marketing</DialogTitle>
          <DialogDescription>
            Isi maklumat untuk tambah tugasan marketing baru
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Tugasan Harian
            </label>
            <Input 
              id="title"
              value={newNote.title || ''}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              placeholder="Contoh: Buat posting TikTok"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Tarikh</span>
            </label>
            <Input 
              id="date"
              type="date"
              value={newNote.content_date || ''}
              onChange={(e) => setNewNote({...newNote, content_date: e.target.value})}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="media" className="text-sm font-medium">
              Media Platform
            </label>
            <Select 
              value={newNote.media as string || 'none'} 
              onValueChange={(value: MarketingContentMedia) => setNewNote({...newNote, media: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih platform media" />
              </SelectTrigger>
              <SelectContent>
                {mediaOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon ? <option.icon className="h-4 w-4" /> : 
                       option.iconText ? <span className="h-4 w-4 text-pink-400 flex items-center justify-center text-xs">{option.iconText}</span> : null}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
