import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Tag, Plus, Pencil, Trash2, Star, Check } from "lucide-react";

// Must match the material labels used in the storefront (src/pages/Order.tsx)
const ALL_MATERIALS = ["Kain Mesh", "Kain Nylon", "Kain Fullsilk", "Semi Leather Kalis Air"];

type Coupon = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: "fixed" | "percentage";
  usage_limit: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applicable_materials: string[] | null;
  is_featured_landing: boolean;
};

type FormState = {
  code: string;
  discount_amount: string;
  discount_type: "fixed" | "percentage";
  is_active: boolean;
  is_lifetime: boolean;
  valid_until: string; // yyyy-mm-dd, only used when not lifetime
  materials: string[]; // empty = all materials
  is_featured_landing: boolean;
};

const LIFETIME_DATE = "2099-12-31T23:59:59+08:00";

const emptyForm = (): FormState => ({
  code: "",
  discount_amount: "",
  discount_type: "fixed",
  is_active: true,
  is_lifetime: true,
  valid_until: "",
  materials: [],
  is_featured_landing: false,
});

export default function Coupons() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await authClient
      .from("coupons" as any)
      .select("*")
      .order("is_featured_landing", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Gagal load kupon", description: error.message, variant: "destructive" });
    } else {
      setRows((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authClient]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: Coupon) => {
    setEditingId(row.id);
    const isLifetime = new Date(row.valid_until).getFullYear() >= 2099;
    setForm({
      code: row.code,
      discount_amount: String(row.discount_amount),
      discount_type: row.discount_type,
      is_active: row.is_active,
      is_lifetime: isLifetime,
      valid_until: isLifetime ? "" : row.valid_until.slice(0, 10),
      materials: row.applicable_materials || [],
      is_featured_landing: row.is_featured_landing,
    });
    setDialogOpen(true);
  };

  const toggleMaterial = (label: string) => {
    setForm((prev) => {
      const has = prev.materials.includes(label);
      return { ...prev, materials: has ? prev.materials.filter((m) => m !== label) : [...prev.materials, label] };
    });
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast({ title: "Sila masukkan kod kupon", variant: "destructive" });
      return;
    }
    if (!form.discount_amount || Number(form.discount_amount) <= 0) {
      toast({ title: "Sila masukkan jumlah diskaun", variant: "destructive" });
      return;
    }
    if (!form.is_lifetime && !form.valid_until) {
      toast({ title: "Sila pilih tarikh tamat tempoh", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_amount: Number(form.discount_amount),
      discount_type: form.discount_type,
      usage_limit: 999999,
      valid_until: form.is_lifetime ? LIFETIME_DATE : `${form.valid_until}T23:59:59+08:00`,
      is_active: form.is_active,
      applicable_materials: form.materials.length > 0 ? form.materials : null,
      is_featured_landing: form.is_featured_landing,
    };

    // Only one coupon can be featured on the landing page at a time.
    // If this one is being set as featured, unset any other featured coupon first.
    if (form.is_featured_landing) {
      await (authClient as any)
        .from("coupons")
        .update({ is_featured_landing: false })
        .neq("id", editingId || "00000000-0000-0000-0000-000000000000");
    }

    const { error } = editingId
      ? await (authClient as any).from("coupons").update(payload).eq("id", editingId)
      : await (authClient as any).from("coupons").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Gagal simpan kupon", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Kupon dikemaskini" : "Kupon dicipta" });
    setDialogOpen(false);
    fetchRows();
  };

  const handleDelete = async (row: Coupon) => {
    if (!confirm(`Padam kupon ${row.code}?`)) return;
    const { error } = await (authClient as any).from("coupons").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Gagal padam", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kupon dipadam" });
      fetchRows();
    }
  };

  const toggleActive = async (row: Coupon, active: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: active } : r)));
    const { error } = await (authClient as any).from("coupons").update({ is_active: active }).eq("id", row.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !active } : r)));
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  const featured = rows.find((r) => r.is_featured_landing);
  const others = rows.filter((r) => !r.is_featured_landing);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Tag className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Kupon</h1>
            <p className="text-sm text-muted-foreground">
              Kupon utama dipaparkan di laman web. Edit kod atau diskaun dan ia kemas kini secara automatik.
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Kupon Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Kupon" : "Kupon Baru"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Kod Kupon</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="cth: SPECIALACS"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Jenis Diskaun</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(v: "fixed" | "percentage") => setForm((p) => ({ ...p, discount_type: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">RM Tetap</SelectItem>
                      <SelectItem value="percentage">Peratus (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    value={form.discount_amount}
                    onChange={(e) => setForm((p) => ({ ...p, discount_amount: e.target.value }))}
                    placeholder={form.discount_type === "fixed" ? "cth: 25" : "cth: 10"}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Kupon Lifetime</Label>
                  <p className="text-xs text-muted-foreground">Tidak akan tamat tempoh</p>
                </div>
                <Switch
                  checked={form.is_lifetime}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_lifetime: v }))}
                />
              </div>

              {!form.is_lifetime && (
                <div className="space-y-1">
                  <Label>Tamat Tempoh</Label>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Material Layak</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Tak tick mana-mana = kupon sah untuk SEMUA material.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_MATERIALS.map((mat) => {
                    const selected = form.materials.includes(mat);
                    return (
                      <button
                        type="button"
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected ? "border-primary-foreground bg-primary-foreground text-primary" : "border-muted-foreground"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </span>
                        {mat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> Kupon Utama (Landing Page)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Kod ini dipaparkan pada button "Order Sekarang" di laman utama. Hanya satu kupon boleh jadi utama.
                  </p>
                </div>
                <Switch
                  checked={form.is_featured_landing}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured_landing: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Aktif</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Featured / main coupon — top of page */}
      {featured && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/5 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{featured.code}</h2>
                  <Badge className="bg-amber-500">Kupon Utama</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Diskaun {featured.discount_type === "fixed" ? `RM${featured.discount_amount}` : `${featured.discount_amount}%`}
                  {" · "}
                  {featured.applicable_materials && featured.applicable_materials.length > 0
                    ? featured.applicable_materials.join(", ")
                    : "Semua material"}
                  {" · "}
                  <span className="text-amber-600 font-medium">Lifetime</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={featured.is_active} onCheckedChange={(v) => toggleActive(featured, v)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ini kupon yang dipaparkan sebagai banner promo di laman web utama. Edit kod atau diskaun di bawah.
          </p>
          <Button variant="default" className="w-full mt-3" onClick={() => openEdit(featured)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit Kupon Utama
          </Button>
        </div>
      )}

      {/* Other coupons */}
      {others.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">Kupon Lain</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Diskaun</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Tempoh</TableHead>
                <TableHead>Digunakan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {others.map((row) => {
                const isLifetime = new Date(row.valid_until).getFullYear() >= 2099;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold">{row.code}</TableCell>
                    <TableCell>
                      {row.discount_type === "fixed" ? `RM${row.discount_amount}` : `${row.discount_amount}%`}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {row.applicable_materials && row.applicable_materials.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.applicable_materials.map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Semua material</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isLifetime ? <Badge variant="outline">Lifetime</Badge> : new Date(row.valid_until).toLocaleDateString("ms-MY")}
                    </TableCell>
                    <TableCell className="text-xs">{row.usage_count} / {row.usage_limit}</TableCell>
                    <TableCell>
                      <Switch checked={row.is_active} onCheckedChange={(v) => toggleActive(row, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(row)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Belum ada kupon. Klik "Kupon Baru" untuk tambah.
        </p>
      )}
    </div>
  );
}
