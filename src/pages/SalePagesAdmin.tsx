import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MonitorPlay, Plus, Pencil, Trash2, ExternalLink, Copy, Eye, EyeOff, Smartphone, Play,
} from "lucide-react";

interface SalePage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_url: string | null;
  poster_url: string | null;
  product_id: string | null;
  cta_label: string | null;
  badge_text: string | null;
  is_published: boolean;
  views: number;
}

interface ProductOption {
  id: string;
  name: string;
  category: string | null;
}

interface FormState {
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  video_url: string;
  poster_url: string;
  product_id: string;
  cta_label: string;
  badge_text: string;
}

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  headline: "",
  subheadline: "",
  video_url: "",
  poster_url: "",
  product_id: "",
  cta_label: "Buy Now",
  badge_text: "",
};

export default function SalePagesAdmin() {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const [pages, setPages] = useState<SalePage[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalePage | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SalePage | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  const setField = (key: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient
        .from("sale_pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setPages((data || []) as SalePage[]);
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message || "Gagal muat sale pages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authClient, toast]);

  useEffect(() => {
    fetchPages();
    authClient
      .from("products")
      .select("id, name, category")
      .order("name")
      .then(({ data }: any) => setProducts(((data || []) as ProductOption[])))
      .catch(() => {});
  }, [fetchPages]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (p: SalePage) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      headline: p.headline || "",
      subheadline: p.subheadline || "",
      video_url: p.video_url || "",
      poster_url: p.poster_url || "",
      product_id: p.product_id || "",
      cta_label: p.cta_label || "Buy Now",
      badge_text: p.badge_text || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.title.trim()) {
      toast({ title: "Slug & Tajuk diperlukan", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        title: form.title.trim(),
        headline: form.headline.trim() || null,
        subheadline: form.subheadline.trim() || null,
        video_url: form.video_url.trim() || null,
        poster_url: form.poster_url.trim() || null,
        product_id: form.product_id || null,
        cta_label: form.cta_label.trim() || "Buy Now",
        badge_text: form.badge_text.trim() || null,
      };
      if (editing) {
        const { error } = await authClient.from("sale_pages").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Page dikemaskini" });
      } else {
        const { error } = await authClient.from("sale_pages").insert(payload);
        if (error) throw error;
        toast({ title: "Page dicipta" });
      }
      setDialogOpen(false);
      fetchPages();
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const { error } = await authClient.from("sale_pages").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "Page dipadam" });
      setDeleting(null);
      fetchPages();
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message, variant: "destructive" });
    }
  };

  const togglePublish = async (p: SalePage) => {
    try {
      const { error } = await authClient
        .from("sale_pages")
        .update({ is_published: !p.is_published })
        .eq("id", p.id);
      if (error) throw error;
      fetchPages();
    } catch (e: any) {
      toast({ title: "Ralat", description: e.message, variant: "destructive" });
    }
  };

  const copyLink = (p: SalePage) => {
    const url = `${window.location.origin}/page/${p.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link disalin", description: url });
    });
  };

  const publicUrl = (p: SalePage) => `${window.location.origin}/page/${p.slug}`;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="animate-slide-up flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Page</h1>
          <p className="text-muted-foreground text-sm">Salespage video — /page/[slug]</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Page Baru
        </Button>
      </section>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Memuatkan...</div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3">
            <MonitorPlay className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Belum ada salespage. Cipta yang pertama.</p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Cipta Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.map(p => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">/page/{p.slug}</p>
                  </div>
                  <Badge variant={p.is_published ? "default" : "secondary"} className="shrink-0">
                    {p.is_published ? "Live" : "Draf"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views} view</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                    {p.is_published ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    {p.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyLink(p)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Link
                  </Button>
                  <a href={publicUrl(p)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog with phone preview */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "Page Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="sp-slug">Slug URL *</Label>
                <Input id="sp-slug" value={form.slug} onChange={e => setField("slug", e.target.value)} placeholder="contoh: promo-fullsilk" />
                <p className="text-[11px] text-muted-foreground mt-1">URL: /page/{form.slug || "..."}</p>
              </div>
              <div>
                <Label htmlFor="sp-title">Tajuk *</Label>
                <Input id="sp-title" value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Promo Fullsilk" />
              </div>
              <div>
                <Label htmlFor="sp-headline">Headline</Label>
                <Input id="sp-headline" value={form.headline} onChange={e => setField("headline", e.target.value)} placeholder="Sarung kusi kereta #1 di Malaysia" />
              </div>
              <div>
                <Label htmlFor="sp-subheadline">Sub-headline</Label>
                <Input id="sp-subheadline" value={form.subheadline} onChange={e => setField("subheadline", e.target.value)} placeholder="Diskaun 20% hari ini" />
              </div>
              <div>
                <Label htmlFor="sp-video">Video URL (R2 Cloudflare)</Label>
                <Input id="sp-video" value={form.video_url} onChange={e => setField("video_url", e.target.value)} placeholder="https://pub-xxxx.r2.dev/video.mp4" />
              </div>
              <div>
                <Label htmlFor="sp-poster">Poster URL (thumbnail video)</Label>
                <Input id="sp-poster" value={form.poster_url} onChange={e => setField("poster_url", e.target.value)} placeholder="https://...jpg" />
              </div>
              <div>
                <Label>Produk</Label>
                <Select value={form.product_id || "none"} onValueChange={v => setField("product_id", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tiada produk —</SelectItem>
                    {products.map(pr => (
                      <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sp-cta">Label Butang CTA</Label>
                  <Input id="sp-cta" value={form.cta_label} onChange={e => setField("cta_label", e.target.value)} placeholder="Buy Now" />
                </div>
                <div>
                  <Label htmlFor="sp-badge">Badge</Label>
                  <Input id="sp-badge" value={form.badge_text} onChange={e => setField("badge_text", e.target.value)} placeholder="PROMO" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </div>

            {/* Right: phone preview 375x812 */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Preview Live (375 × 812)
              </p>
              <div
                className="mx-auto rounded-[2rem] border-4 border-zinc-800 bg-black overflow-hidden shadow-xl"
                style={{ width: 375, height: 812, maxWidth: "100%" }}
              >
                <PreviewPhone page={form} products={products} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleting} onOpenChange={o => { if (!o) setDeleting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Padam page ini?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{deleting?.title}" akan dipadam kekal. Link /page/{deleting?.slug} tidak akan berfungsi lagi.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Padam</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Live phone preview — mirrors SalePageView layout
function PreviewPhone({ page, products }: { page: FormState; products: ProductOption[] }) {
  const prod = products.find(p => p.id === page.product_id);
  return (
    <div className="w-full h-full bg-black overflow-y-auto flex flex-col">
      {/* Video area */}
      <div className="relative w-full aspect-[9/16] bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center shrink-0">
        {page.poster_url ? (
          <img src={page.poster_url} alt="poster" className="w-full h-full object-cover" />
        ) : (
          <MonitorPlay className="h-12 w-12 text-white/20" />
        )}
        {page.video_url && (
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
        )}
        {page.badge_text && (
          <div className="absolute top-3 left-3 bg-amber-400 text-black text-[11px] font-bold px-2.5 py-1 rounded-full">
            {page.badge_text}
          </div>
        )}
        {page.headline && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-bold text-sm leading-tight">{page.headline}</p>
            {page.subheadline && <p className="text-white/60 text-[11px] mt-1">{page.subheadline}</p>}
          </div>
        )}
      </div>
      {/* Product + CTA */}
      <div className="flex-1 bg-zinc-950 p-4 flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <MonitorPlay className="h-5 w-5 text-white/20" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{prod?.name || "Pilih produk…"}</p>
            <p className="text-white/40 text-[11px]">{prod?.category || "—"}</p>
          </div>
        </div>
        <div className="mt-auto">
          <div className="w-full h-11 rounded-xl bg-amber-400 text-black font-bold flex items-center justify-center text-sm">
            {page.cta_label || "Buy Now"}
          </div>
        </div>
      </div>
    </div>
  );
}
