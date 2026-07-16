import { useEffect, useState } from "react";
import { X, Phone, Package, DollarSign, Calendar, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";
import { formatCurrency } from "@/lib/utils";

const STATUS_OPTIONS = ["processing", "completed", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  processing: "In Process",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_BADGE: Record<string, string> = {
  processing: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  completed: "bg-green-500/15 text-green-600 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
};

interface Props {
  phone: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerOrdersDialog({ phone, open, onOpenChange }: Props) {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");

  useEffect(() => {
    if (!open || !phone) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await authClient
          .from("customers")
          .select("*")
          .eq("phone", phone)
          .order("order_date", { ascending: false });
        if (error) throw error;
        if (!cancelled) setOrders((data || []) as unknown as Customer[]);
      } catch (e: any) {
        if (!cancelled)
          toast({ title: "Ralat", description: e?.message || "Gagal muat order", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, phone, authClient, toast]);

  const totalSpent = orders.reduce((s, o) => s + Number((o as any).sales_amount || 0), 0);
  const customerName = orders[0] ? (orders[0] as any).name : "—";

  const startEdit = (order: Customer) => {
    setEditingId((order as any).id);
    setStatusDraft((order as any).order_status || "processing");
  };

  const saveStatus = async (orderId: string) => {
    try {
      const { error } = await authClient
        .from("customers")
        .update({ order_status: statusDraft })
        .eq("id", orderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => ((o as any).id === orderId ? { ...o, order_status: statusDraft } : o))
      );
      setEditingId(null);
      toast({ title: "Status dikemaskini", description: STATUS_LABEL[statusDraft] });
    } catch (e: any) {
      toast({ title: "Ralat", description: e?.message || "Gagal kemaskini", variant: "destructive" });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Semua order untuk</p>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {customerName}
              <span className="inline-flex items-center gap-1 text-sm font-normal text-primary">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </span>
            </h3>
          </div>
          <button onClick={() => onOpenChange(false)} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Jumlah dibelanjakan:</span>
            <span className="text-lg font-bold text-foreground">{formatCurrency(totalSpent)}</span>
            <span className="ml-auto text-xs text-muted-foreground">{orders.length} order</span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Memuat...</p>
          ) : orders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Tiada order untuk nombor ini.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => {
                const c = o as any;
                const isEditing = editingId === c.id;
                return (
                  <div key={c.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-medium text-foreground truncate">
                          <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {c.product || "—"}
                          {c.product_variation ? ` (${c.product_variation})` : ""}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" /> {formatCurrency(Number(c.sales_amount || 0))}
                          {c.payment_source ? (
                            <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5">
                              {c.payment_source}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {c.order_date ? new Date(c.order_date).toLocaleDateString("ms-MY") : "—"}
                          {c.order_number ? ` • #${c.order_number}` : ""}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1">
                            <select
                              value={statusDraft}
                              onChange={(e) => setStatusDraft(e.target.value)}
                              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-1">
                              <button
                                onClick={() => saveStatus(c.id)}
                                className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded border border-border px-2 py-1 text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${STATUS_BADGE[c.order_status] || ""}`}>
                              {STATUS_LABEL[c.order_status] || c.order_status}
                            </span>
                            <button
                              onClick={() => startEdit(o)}
                              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Pencil className="h-3 w-3" /> Edit Status
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
