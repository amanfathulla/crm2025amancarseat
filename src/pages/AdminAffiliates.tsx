import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Aff = {
  affiliate_id: string;
  referral_code: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  status: string;
  created_at: string;
  total_sales?: number;
  total_commission?: number;
};

const STATUS_TAB = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "active", label: "Aktif" },
  { key: "rejected", label: "Ditolak" },
] as const;

export default function AdminAffiliates() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Aff[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof STATUS_TAB)[number]["key"]>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let q = authClient.from("affiliates").select("*").order("created_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      setList((data as Aff[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [authClient]);

  const setStatus = async (id: string, status: "active" | "rejected") => {
    setBusy(id + status);
    try {
      const { error } = await authClient.rpc("set_affiliate_status", {
        p_affiliate_id: id,
        p_status: status,
      });
      if (error) throw error;
      toast({
        title: status === "active" ? "Affiliate diluluskan" : "Affiliate ditolak",
        variant: status === "active" ? "default" : "destructive",
      });
      load();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const filtered = tab === "all" ? list : list.filter((a) => a.status === tab);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-blue-600/20 shadow-md">
            <Network className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Affiliate Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">Kelulusan &amp; pantauan affiliate</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TAB.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-blue-600 text-white shadow"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
            {t.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                {list.filter((a) => a.status === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Tiada affiliate dalam kategori ini.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <div
              key={a.affiliate_id}
              className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.whatsapp || a.phone || a.email || "-"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                    a.status === "active"
                      ? "bg-green-500/15 text-green-400"
                      : a.status === "pending"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {a.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>ID: <b className="text-foreground">{a.affiliate_id}</b></span>
                <span>Referral: <b className="text-foreground">{a.referral_code}</b></span>
                <span>Daftar: {new Date(a.created_at).toLocaleDateString("ms-MY")}</span>
              </div>

              {a.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={busy === a.affiliate_id + "active"}
                    className="bg-green-600 hover:bg-green-500"
                    onClick={() => setStatus(a.affiliate_id, "active")}
                  >
                    {busy === a.affiliate_id + "active" ? (
                      <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />...</span>
                    ) : (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Approve</span>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy === a.affiliate_id + "rejected"}
                    onClick={() => setStatus(a.affiliate_id, "rejected")}
                  >
                    {busy === a.affiliate_id + "rejected" ? (
                      <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />...</span>
                    ) : (
                      <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Reject</span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
