import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Facebook, Instagram } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateMarketingNote, MarketingContent, MarketingContentMedia } from "@/utils/marketingUtils";

interface EditMarketingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: MarketingContent | null;
  onNoteUpdated: () => void;
}

export function EditMarketingNoteDialog({ open, onOpenChange, note, onNoteUpdated }: EditMarketingNoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    content_date: '',
    media: 'none' as MarketingContentMedia,
  });

  useEffect(() => {
    if (note) {
      setEditData({
        title: note.title || '',
        description: note.description || '',
        content_date: note.content_date || '',
        media: (note.media || 'none') as MarketingContentMedia,
      });
    }
  }, [note]);

  const handleSubmit = async () => {
    if (!note) return;
    try {
      setIsSubmitting(true);
      if (!editData.title || !editData.content_date) {
        toast.error('Sila isi tajuk dan tarikh');
        return;
      }
      
      const result = await updateMarketingNote(note.id, {
        title: editData.title,
        description: editData.description || null,
        content_date: editData.content_date,
        media: editData.media,
      });
      
      if (!result.success) throw new Error(result.error || 'Failed to update');
      
      toast.success('Nota berjaya dikemaskini');
      onNoteUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal kemaskini nota');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Nota Marketing</DialogTitle>
          <DialogDescription>Kemaskini maklumat nota marketing</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <label htmlFor="edit-title" className="text-sm font-medium">Tajuk Tugasan</label>
            <Input 
              id="edit-title"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              placeholder="Tajuk nota"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="edit-desc" className="text-sm font-medium">Keterangan</label>
            <Textarea 
              id="edit-desc"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              placeholder="Keterangan tugasan..."
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="edit-date" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Tarikh</span>
            </label>
            <Input 
              id="edit-date"
              type="date"
              value={editData.content_date}
              onChange={(e) => setEditData({...editData, content_date: e.target.value})}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="edit-media" className="text-sm font-medium">Media Platform</label>
            <Select 
              value={editData.media} 
              onValueChange={(value: MarketingContentMedia) => setEditData({...editData, media: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih platform" />
              </SelectTrigger>
              <SelectContent>
                {mediaOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon ? <option.icon className="h-4 w-4" /> : 
                       option.iconText ? <span className="text-xs font-bold text-pink-400">{option.iconText}</span> : null}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>Kemaskini</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
