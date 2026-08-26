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
  FolderOpen, ShoppingCart, TrendingUp, Users, Layers, X, GripVertical,
} from "lucide-react";

interface SalePage {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  subheadline: string | null;
  video_url: string | null;
  video_urls: string[] | null;
  poster_url: string | null;
  product_id: string | null;
  cta_label: string | null;
  badge_text: string | null;
  theme: string | null;
  is_published: boolean;
  views: number;
  created_at?: string;
  updated_at?: string;
}

interface ProductOption {
  id: string;
  name: string;
  category: string | null;
  price: number;
}

// Summary jualan per page (dari RPC sale_pages_sales_summary)
interface SalesSummary {
  sale_page_id: string;
  slug: string;
  title: string;
  orders_count: number;
  total_sales: number;
}

interface FormState {
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  video_url: string;
  video_urls: string[];
  poster_url: string;
  product_id: string;         // produk utama (backward compat)
  extra_product_ids: string[]; // produk add-on tambahan
  cta_label: string;
  badge_text: string;
  theme: string;
}

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  headline: "",
  subheadline: "",
  video_url: "",
  video_urls: [],
  poster_url: "",
  product_id: "",
  extra_product_ids: [],
  cta_label: "Buy Now",
  badge_text: "",
  theme: "amber",
};

const THEME_OPTIONS = [
  { id: "amber",  label: "Amber",  dot: "bg-amber-400" },
  { id: "red",    label: "Red",    dot: "bg-red-500" },
  { id: "blue",   label: "Blue",   dot: "bg-blue-500" },
  { id: "green",  label: "Green",  dot: "bg-emerald-500" },
  { id: "pink",   label: "Pink",   dot: "bg-pink-500" },
  { id: "purple", label: "Purple", dot: "bg-purple-500" },
];

const THEME_PREVIEW_DOTS: Record<string, string> = {
  amber: "bg-amber-400",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
};

const rm = (amount: number) => `RM${Number(amount || 0).toFixed(0)}`;

export default function SalePagesAdmin() {
  const { toast } = useToast();
  const { authClient } = useAuth();
  const [pages, setPages] = useState<SalePage[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [summaries, setSummaries] = useState<Record<string, SalesSummary>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPage, setDetailPage] = useState<SalePage | null>(null);
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

      // Summary jualan per page
      try {
        const { data: sum } = await authClient.rpc("sale_pages_sales_summary" as any);
        const map: Record<string, SalesSummary> = {};
        ((sum || []) as any[]).forEach((s: any) => {
          map[s.sale_page_id] = s as SalesSummary;
        });
        setSummaries(map);
      } catch {
        // RPC belum wujud (SQL belum run) — abaikan, tunjuk 0
      }
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
      .select("id, name, category, price")
      .order("name")
      .then(({ data }: any) => setProducts(((data || []) as ProductOption[])))
      .catch(() => {});
  }, [fetchPages]);

  // Semua produk untuk satu page: produk utama (product_id) + add-ons (RPC table)
  const pageProducts = useCallback(async (pageId: string, mainProductId: string | null): Promise<ProductOption[]> => {
    const out: ProductOption[] = [];
    const main = products.find(p => p.id === mainProductId);
    if (main) out.push(main);
    try {
      const { data } = await authClient
        .from("sale_page_products")
        .select("product_id, sort_order")
        .eq("sale_page_id", pageId)
        .order("sort_order");
      for (const row of (data || []) as any[]) {
        if (row.product_id === mainProductId) continue;
        const prod = products.find(p => p.id === row.product_id);
        if (prod) out.push(prod);
      }
    } catch { /* table belum wujud */ }
    return out;
  }, [authClient, products]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = async (p: SalePage) => {
    setEditing(p);
    // Muat add-on produk page ini
    let extras: string[] = [];
    try {
      const { data } = await authClient
        .from("sale_page_products")
        .select("product_id")
        .eq("sale_page_id", p.id)
        .order("sort_order");
      extras = ((data || []) as any[]).map(r => r.product_id).filter(id => id !== p.product_id);
    } catch { /* table belum wujud */ }
    setForm({
      slug: p.slug,
      title: p.title,
      headline: p.headline || "",
      subheadline: p.subheadline || "",
      video_url: p.video_url || "",
      video_urls: (p as any).video_urls || [],
      poster_url: p.poster_url || "",
      product_id: p.product_id || "",
      extra_product_ids: extras,
      cta_label: p.cta_label || "Buy Now",
      badge_text: p.badge_text || "",
      theme: (p as any).theme || "amber",
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
        video_url: form.video_url.trim() || (form.video_urls.filter(Boolean)[0] || null),
        video_urls: form.video_urls.filter(Boolean),
        poster_url: form.poster_url.trim() || null,
        product_id: form.product_id || null,
        cta_label: form.cta_label.trim() || "Buy Now",
        badge_text: form.badge_text.trim() || null,
        theme: form.theme || "amber",
      };
      let pageId = editing?.id;
      if (editing) {
        const { error } = await authClient.from("sale_pages").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Page dikemaskini" });
      } else {
        const { data: inserted, error } = await authClient
          .from("sale_pages")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        pageId = (inserted as any)?.id;
        toast({ title: "Page dicipta" });
      }

      // Sync produk add-on (delete semua, insert semula)
      if (pageId) {
        try {
          await authClient.from("sale_page_products").delete().eq("sale_page_id", pageId);
          const rows = form.extra_product_ids
            .filter(id => id && id !== form.product_id)
            .map((pid, i) => ({ sale_page_id: pageId, product_id: pid, sort_order: i + 1 }));
          if (rows.length > 0) {
            await authClient.from("sale_page_products").insert(rows);
          }
        } catch (e: any) {
          console.warn("add-on products sync skipped:", e?.message);
        }
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

  // ── Stats ringkas untuk dashboard ──
  const totalPages = pages.length;
  const publishedPages = pages.filter(p => p.is_published).length;
  const totalViews = pages.reduce((s, p) => s + (p.views || 0), 0);
  const totalSales = Object.values(summaries).reduce((s, x) => s + Number(x.total_sales || 0), 0);
  const totalOrders = Object.values(summaries).reduce((s, x) => s + Number(x.orders_count || 0), 0);

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

      {/* ── Stat cards berwarna ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Total Page</p>
              <p className="text-2xl font-bold mt-1">{totalPages}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Published</p>
              <p className="text-2xl font-bold mt-1">{publishedPages}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MonitorPlay className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Total Views</p>
              <p className="text-2xl font-bold mt-1">{totalViews}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Jualan (SEMUA)</p>
              <p className="text-2xl font-bold mt-1">{rm(totalSales)}</p>
              <p className="text-[10px] text-white/70 mt-0.5">{totalOrders} order</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Senarai pages ── */}
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
          {pages.map(p => {
            const sum = summaries[p.id];
            const sales = Number(sum?.total_sales || 0);
            const orders = Number(sum?.orders_count || 0);
            const videoCount = (p.video_urls?.filter(Boolean).length) || (p.video_url ? 1 : 0);
            return (
              <Card key={p.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Header: title + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <button
                        className="font-semibold text-sm truncate block text-left hover:underline"
                        onClick={() => setDetailPage(p)}
                        title="Buka maklumat page"
                      >
                        {p.title}
                      </button>
                      <p className="text-xs text-muted-foreground font-mono truncate">/page/{p.slug}</p>
                    </div>
                    <Badge variant={p.is_published ? "default" : "secondary"} className="shrink-0">
                      {p.is_published ? "Live" : "Draf"}
                    </Badge>
                  </div>

                  {/* Info chips: video count, views, sales */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full px-2 py-0.5">
                      <Play className="h-3 w-3" /> {videoCount} video
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full px-2 py-0.5">
                      <Eye className="h-3 w-3" /> {p.views || 0} view
                    </span>
                    {sales > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-green-500/10 text-green-600 rounded-full px-2 py-0.5 font-medium">
                        <ShoppingCart className="h-3 w-3" /> {rm(sales)} • {orders} order
                      </span>
                    )}
                    {p.theme && (
                      <span className={`inline-block h-3 w-3 rounded-full ${THEME_PREVIEW_DOTS[p.theme] || "bg-amber-400"}`} title={`Theme: ${p.theme}`} />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t">
                    <Button size="sm" variant="outline" onClick={() => setDetailPage(p)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                      {p.is_published ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                      {p.is_published ? "Unpub" : "Pub"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(p)} title="Salin link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <a href={publicUrl(p)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" title="Buka page">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create/Edit dialog ── */}
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

              {/* ── Folder media video (banyak URL, boleh tambah/edit/buang) ── */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" /> Folder Media Video
                </Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Main ikut turutan, lepas habis semua → loop semula. Setiap link direct ke fail <code className="text-foreground">.mp4</code>.
                </p>
                <div className="space-y-2">
                  {(form.video_urls.length === 0 ? [""] : form.video_urls).map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                      <Input
                        value={url}
                        onChange={e => {
                          const next = [...form.video_urls];
                          next[i] = e.target.value;
                          setForm(f => ({ ...f, video_urls: next }));
                        }}
                        placeholder="https://pub-xxxx.r2.dev/video1.mp4"
                        className="text-xs"
                      />
                      {form.video_urls.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            const next = form.video_urls.filter((_, idx) => idx !== i);
                            setForm(f => ({ ...f, video_urls: next }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm(f => ({ ...f, video_urls: [...f.video_urls, ""] }))}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Video
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="sp-poster">Poster URL (thumbnail video)</Label>
                <Input id="sp-poster" value={form.poster_url} onChange={e => setField("poster_url", e.target.value)} placeholder="https://...jpg" />
              </div>

              {/* ── Produk utama ── */}
              <div>
                <Label>Produk Utama</Label>
                <Select value={form.product_id || "none"} onValueChange={v => setField("product_id", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tiada produk —</SelectItem>
                    {products.map(pr => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.name} {pr.price != null ? `(${rm(pr.price)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Produk add-on (list boleh tambah banyak) ── */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Produk Add-On
                </Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Produk tambahan yang turut dipaparkan pada page. Boleh tambah banyak.
                </p>
                <div className="space-y-2">
                  {/* Senarai add-on yang dah ditambah */}
                  {form.extra_product_ids.map((pid, i) => {
                    const prod = products.find(p => p.id === pid);
                    return (
                      <div key={pid} className="flex items-center gap-2 bg-muted/50 border rounded-lg px-2.5 py-1.5">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs flex-1 truncate">{prod?.name || pid}</span>
                        {prod?.price != null && (
                          <span className="text-[11px] text-muted-foreground">{rm(prod.price)}</span>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setForm(f => ({
                            ...f,
                            extra_product_ids: f.extra_product_ids.filter((_, idx) => idx !== i),
                          }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                  {/* Dropdown tambah produk */}
                  <Select
                    value=""
                    onValueChange={v => {
                      if (v && v !== "none" && !form.extra_product_ids.includes(v) && v !== form.product_id) {
                        setForm(f => ({ ...f, extra_product_ids: [...f.extra_product_ids, v] }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="+ Tambah produk add-on" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>— Pilih produk —</SelectItem>
                      {products
                        .filter(pr => pr.id !== form.product_id && !form.extra_product_ids.includes(pr.id))
                        .map(pr => (
                          <SelectItem key={pr.id} value={pr.id}>
                            {pr.name} {pr.price != null ? `(${rm(pr.price)})` : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
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
              <div>
                <Label>Theme Warna</Label>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setField("theme", t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.theme === t.id
                          ? "border-foreground bg-foreground/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${t.dot}`} />
                      {t.label}
                    </button>
                  ))}
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

      {/* ── Detail popup ── */}
      <DetailDialog
        page={detailPage}
        products={products}
        summary={detailPage ? summaries[detailPage.id] : undefined}
        onClose={() => setDetailPage(null)}
        authClient={authClient}
      />

      {/* Delete confirm */}
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

// ── Detail popup: info penuh page + jumlah jualan ──
function DetailDialog({ page, products, summary, onClose, authClient }: {
  page: SalePage | null;
  products: ProductOption[];
  summary?: SalesSummary;
  onClose: () => void;
  authClient: any;
}) {
  const [addons, setAddons] = useState<ProductOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!page) { setAddons([]); return; }
    (async () => {
      try {
        const { data } = await authClient
          .from("sale_page_products")
          .select("product_id")
          .eq("sale_page_id", page.id)
          .order("sort_order");
        const ids = ((data || []) as any[]).map(r => r.product_id);
        setAddons(products.filter(p => ids.includes(p.id)));
      } catch { setAddons([]); }
    })();
  }, [page, products, authClient]);

  if (!page) return null;
  const sales = Number(summary?.total_sales || 0);
  const orders = Number(summary?.orders_count || 0);
  const main = products.find(p => p.id === page.product_id);
  const videos = (page.video_urls?.filter(Boolean).length) || (page.video_url ? 1 : 0);

  return (
    <Dialog open={!!page} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {page.title}
            <Badge variant={page.is_published ? "default" : "secondary"}>
              {page.is_published ? "Live" : "Draf"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Jualan — highlight */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white p-3">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Jumlah Jualan</p>
              <p className="text-lg font-bold mt-0.5">{rm(sales)}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Order</p>
              <p className="text-lg font-bold mt-0.5">{orders}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3">
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Views</p>
              <p className="text-lg font-bold mt-0.5">{page.views || 0}</p>
            </div>
          </div>

          {/* Info asas */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Link</span>
              <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer" className="font-mono text-xs underline truncate">
                /page/{page.slug}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Video dalam playlist</span>
              <span className="font-medium">{videos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Theme</span>
              <span className="font-medium capitalize">{page.theme || "amber"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Butang CTA</span>
              <span className="font-medium">{page.cta_label || "Buy Now"}</span>
            </div>
            {page.headline && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Headline</span>
                <span className="text-right truncate">{page.headline}</span>
              </div>
            )}
            {page.subheadline && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Sub-headline</span>
                <span className="text-right truncate">{page.subheadline}</span>
              </div>
            )}
            {page.badge_text && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Badge</span>
                <span className="font-medium">{page.badge_text}</span>
              </div>
            )}
            {page.created_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="font-medium">{new Date(page.created_at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            )}
            {page.updated_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dikemaskini</span>
                <span className="font-medium">{new Date(page.updated_at).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            )}
          </div>

          {/* Produk */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Produk</p>
            {main ? (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="default" className="shrink-0 text-[10px]">Utama</Badge>
                  <span className="text-sm truncate">{main.name}</span>
                </div>
                <span className="text-sm font-semibold shrink-0">{rm(main.price)}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Tiada produk utama</p>
            )}
            {addons.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="shrink-0 text-[10px]">Add-On</Badge>
                  <span className="text-sm truncate">{a.name}</span>
                </div>
                <span className="text-sm font-semibold shrink-0">{rm(a.price)}</span>
              </div>
            ))}
          </div>

          {/* URL video */}
          {videos > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Playlist Video</p>
              <div className="space-y-1">
                {(page.video_urls?.filter(Boolean).length ? page.video_urls.filter(Boolean) : page.video_url ? [page.video_url] : []).map((u, i) => (
                  <div key={i} className="text-[11px] font-mono text-muted-foreground bg-muted/40 rounded px-2 py-1.5 truncate">
                    {i + 1}. {u}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poster thumbnail */}
          {page.poster_url && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Poster</p>
              <img src={page.poster_url} alt="poster" className="w-full max-h-32 object-cover rounded-lg border" />
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 pt-2 border-t">
            <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka Page
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/page/${page.slug}`);
                toast({ title: "Link disalin" });
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Salin Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Live phone preview — mirrors SalePageView layout
function PreviewPhone({ page, products }: { page: FormState; products: ProductOption[] }) {
  const prod = products.find(p => p.id === page.product_id);
  const addons = products.filter(p => page.extra_product_ids.includes(p.id));
  return (
    <div className="w-full h-full bg-black overflow-y-auto flex flex-col">
      {/* Video area */}
      <div className="relative w-full flex-1 min-h-[420px] bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center shrink-0">
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
          <div className={`absolute top-3 left-3 ${THEME_PREVIEW_DOTS[page.theme] || "bg-amber-400"} text-black text-[11px] font-bold px-2.5 py-1 rounded-full`}>
            {page.badge_text}
          </div>
        )}
        {page.headline && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white font-bold text-sm leading-tight">{page.headline}</p>
            {page.subheadline && <p className="text-white/60 text-[11px] mt-1">{page.subheadline}</p>}
          </div>
        )}
        {/* Video count chip */}
        {(page.video_urls.filter(Boolean).length > 0 || page.video_url) && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white/80 text-[10px] px-2 py-1 rounded-full">
            {Math.max(page.video_urls.filter(Boolean).length, page.video_url ? 1 : 0)} video
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
        {/* Add-on preview */}
        {addons.length > 0 && (
          <div className="text-[10px] text-white/50">
            +{addons.length} produk add-on: {addons.slice(0, 2).map(a => a.name).join(", ")}{addons.length > 2 ? "…" : ""}
          </div>
        )}
        <div className="mt-auto">
          <div className={`w-full h-11 rounded-xl ${THEME_PREVIEW_DOTS[page.theme] || "bg-amber-400"} text-black font-bold flex items-center justify-center text-sm`}>
            {page.cta_label || "Buy Now"}
          </div>
        </div>
      </div>
    </div>
  );
}
