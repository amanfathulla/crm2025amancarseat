import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reviewsSupabase, type Review } from "@/lib/reviewsClient";
import { ReviewSubmitDialog } from "@/components/sales/ReviewSubmitDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const PAGE_SIZE = 20;

export default function Reviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await reviewsSupabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      setReviews((data || []) as Review[]);
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return reviews;
    return reviews.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(t) ||
        (r.car_model || "").toLowerCase().includes(t) ||
        (r.review || "").toLowerCase().includes(t)
    );
  }, [reviews, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { error } = await reviewsSupabase
        .from("reviews")
        .update({
          name: editing.name,
          car_model: editing.car_model,
          rating: editing.rating,
          quality_rating: editing.quality_rating,
          price_rating: editing.price_rating,
          review: editing.review,
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast({ title: "✅ Review dikemas kini" });
      setEditing(null);
      load();
    } catch (e: any) {
      toast({ title: "Ralat kemas kini", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { error } = await reviewsSupabase.from("reviews").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "🗑️ Review dipadam" });
      setDeleting(null);
      load();
    } catch (e: any) {
      toast({ title: "Ralat padam", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground text-sm">
            Senarai semua testimoni pelanggan. Edit, padam atau tambah review baru.
          </p>
        </div>
        <Button onClick={() => setSubmitOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Review
        </Button>
      </div>

      <div className="bg-card rounded-xl border p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, model atau ulasan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Memuat reviews...
          </div>
        ) : pageItems.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">Tiada review dijumpai.</div>
        ) : (
          <div className="divide-y">
            {pageItems.map((r) => {
              const imgs = (r.images ?? []).filter(Boolean);
              return (
                <div key={r.id} className="py-3 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                        {(r.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{r.name || "—"}</span>
                      <span className="text-xs text-muted-foreground truncate">· {r.car_model || "—"}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (r.rating || 0) ? "fill-red-500 text-red-500" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    {r.review && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 italic">"{r.review}"</p>}
                    {imgs.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {imgs.slice(0, 4).map((src, i) => (
                          <img key={i} src={src} alt="" className="w-12 h-12 rounded object-cover border" loading="lazy" />
                        ))}
                        {imgs.length > 4 && (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                            +{imgs.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditing({ ...r })} className="gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleting(r)} className="gap-1 text-destructive">
                      <Trash2 className="h-3 w-3" /> Padam
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{filtered.length} reviews · halaman {current}/{totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>‹</Button>
              <Button variant="outline" size="sm" disabled={current === totalPages} onClick={() => setPage(current + 1)}>›</Button>
            </div>
          </div>
        )}
      </div>

      <ReviewSubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} onSubmitted={load} />

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>Kemas kini maklumat review pelanggan.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nama</label>
                <Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Model Kereta</label>
                <Input value={editing.car_model || ""} onChange={(e) => setEditing({ ...editing, car_model: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <Input type="number" min={1} max={5} value={editing.rating || 5}
                    onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Kualiti</label>
                  <Input type="number" min={1} max={5} value={editing.quality_rating ?? 5}
                    onChange={(e) => setEditing({ ...editing, quality_rating: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Harga</label>
                  <Input type="number" min={1} max={5} value={editing.price_rating ?? 5}
                    onChange={(e) => setEditing({ ...editing, price_rating: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Ulasan</label>
                <Textarea rows={4} value={editing.review || ""} onChange={(e) => setEditing({ ...editing, review: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam review?</AlertDialogTitle>
            <AlertDialogDescription>
              Review daripada <strong>{deleting?.name}</strong> akan dipadam kekal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
