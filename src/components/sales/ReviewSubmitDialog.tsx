import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, User, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reviewsSupabase, REVIEWS_BUCKET, CAR_BRANDS } from "@/lib/reviewsClient";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 ${n <= value ? "fill-red-500 text-red-500" : "text-white/30"}`} />
        </button>
      ))}
    </div>
  );
}

async function uploadToReviews(file: File, folder: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await reviewsSupabase.storage.from(REVIEWS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = reviewsSupabase.storage.from(REVIEWS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function ReviewSubmitDialog({ open, onOpenChange, onSubmitted }: Props) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [quality, setQuality] = useState(5);
  const [price, setPrice] = useState(5);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(5); setQuality(5); setPrice(5);
    setAvatar(null); setName(""); setBrand(""); setModel("");
    setReviewText(""); setImages([]);
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    setImages(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand || !model.trim()) {
      toast({ title: "Lengkapkan maklumat", description: "Sila isi nama, brand & model kereta.", variant: "destructive" });
      return;
    }
    if (images.length < 1) {
      toast({ title: "Gambar diperlukan", description: "Minimum 1 gambar siap pasang ACS.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const [avatarUrl, imageUrls] = await Promise.all([
        avatar ? uploadToReviews(avatar, "avatars") : Promise.resolve(null),
        Promise.all(images.map((f) => uploadToReviews(f, "images"))),
      ]);

      const brandLabel = CAR_BRANDS.find((b) => b.key === brand)?.label ?? "";
      const carModelFull = `${brandLabel} ${model.trim()}`.trim();

      const { error } = await reviewsSupabase.from("reviews").insert({
        name: name.trim(),
        car_model: carModelFull,
        rating,
        quality_rating: quality,
        price_rating: price,
        review: reviewText.trim(),
        images: imageUrls,
        avatar_url: avatarUrl,
      });
      if (error) throw error;

      toast({ title: "Terima kasih! 🎉", description: "Ulasan anda telah dihantar." });
      reset();
      onOpenChange(false);
      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cuba lagi.";
      toast({ title: "Ralat hantar ulasan", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="max-w-xl bg-neutral-950 text-white border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center">Berikan Ulasan Anda</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Kongsikan pengalaman anda dengan produk AMANCARSEAT
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-white">Penilaian Keseluruhan</Label>
            <div className="mt-2"><StarRating value={rating} onChange={setRating} /></div>
          </div>
          <div>
            <Label className="text-white">Kualiti Material</Label>
            <div className="mt-2"><StarRating value={quality} onChange={setQuality} /></div>
          </div>
          <div>
            <Label className="text-white">Harga Berbaloi</Label>
            <div className="mt-2"><StarRating value={price} onChange={setPrice} /></div>
          </div>

          <div>
            <Label className="text-white">Avatar Pengguna</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10">
                {avatar ? (
                  <img src={URL.createObjectURL(avatar)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <Input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
                className="bg-neutral-900 border-white/10 text-white file:text-white file:bg-neutral-800 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload gambar profil anda (pilihan)</p>
          </div>

          <div>
            <Label className="text-white">Nama Pelanggan *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama anda"
              className="mt-2 bg-neutral-900 border-white/10 text-white placeholder:text-gray-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-white">Brand Kereta *</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="mt-2 bg-neutral-900 border-white/10 text-white">
                  <SelectValue placeholder="Pilih brand kereta" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-950 text-white border-white/10 max-h-64">
                  {CAR_BRANDS.map((b) => (
                    <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Model Kereta *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="cth: Myvi 2023"
                className="mt-2 bg-neutral-900 border-white/10 text-white placeholder:text-gray-500" />
            </div>
          </div>

          <div>
            <Label className="text-white">Ulasan Anda <span className="text-gray-500 text-xs">(tidak wajib)</span></Label>
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tulis ulasan anda tentang produk AMANCARSEAT... (pilihan)"
              className="mt-2 bg-neutral-900 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]" />
          </div>

          <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-3">
            <Label className="text-white">Gambar siap pasang ACS (Minimum 1, Maksimum 5) *</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => handleImages(e.target.files)}
              className="mt-2 bg-neutral-900 border-white/10 text-white file:text-white file:bg-neutral-800 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2" />
            <p className="text-xs text-gray-400 mt-1">{images.length}/5 gambar dipilih</p>
          </div>


          <Button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl">
            {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghantar...</>) : (<><Upload className="w-4 h-4 mr-2" /> Hantar Ulasan</>)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
