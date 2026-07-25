import { useEffect, useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Loader2 } from "lucide-react";

const AFF_TOKEN = "affiliateToken";
const AFF_ID = "affiliateId";

export default function AffiliateWithdraw() {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [account, setAccount] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
    c.from("affiliate_withdrawals")
      .select("*")
      .eq("affiliate_id", localStorage.getItem(AFF_ID)!)
      .order("requested_at", { ascending: false })
      .then(({ data }) => setHistory((data as any[]) || []));
  };

  useEffect(load, []);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Masukkan jumlah sah", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const c = getAffiliateClient(localStorage.getItem(AFF_TOKEN)!);
      const { error } = await c.from("affiliate_withdrawals").insert({
        affiliate_id: localStorage.getItem(AFF_ID)!,
        amount: amt,
        method,
        account,
      });
      if (error) throw error;
      toast({ title: "Permintaan dihantar", description: "Admin akan proses." });
      setAmount("");
      setAccount("");
      load();
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <p className="text-sm text-slate-400">Mohon bayaran komisen</p>
      </div>

      <div className="max-w-md space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Jumlah (RM)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-slate-800 border-white/10 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Kaedah</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md bg-slate-800 border border-white/10 px-3 py-2 text-white">
            <option value="bank">Bank Transfer</option>
            <option value="ewallet">E-Wallet</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">No Akaun</Label>
          <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="1234567890" className="bg-slate-800 border-white/10 text-white" />
        </div>
        <Button onClick={submit} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500">
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghantar...</> : <><Landmark className="mr-2 h-4 w-4" />Mohon Withdraw</>}
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-xs text-slate-400 border-b border-white/10">
          <span>Tarikh</span><span className="text-right">Jumlah</span><span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {history.map((h) => (
            <div key={h.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-2.5 text-sm">
              <span className="text-slate-300">{new Date(h.requested_at).toLocaleDateString("ms-MY")}</span>
              <span className="text-right text-green-300">RM{(h.amount ?? 0).toFixed(2)}</span>
              <span className={`text-right text-xs px-2 py-0.5 rounded ${h.status === "paid" ? "bg-green-500/15 text-green-400" : h.status === "rejected" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                {h.status}
              </span>
            </div>
          ))}
          {history.length === 0 && <p className="px-4 py-6 text-center text-slate-500 text-sm">Tiada rekod.</p>}
        </div>
      </div>
    </div>
  );
}
