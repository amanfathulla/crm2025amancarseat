import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Package, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AFF_REF = "affiliateReferral";
const SITE = "https://amanfathulla.github.io/Salessss-testing/";

type Prod = { id: string; name: string; price: number; category: string | null; image_url: string | null };

export default function AffiliateProducts() {
  const [list, setList] = useState<Prod[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = localStorage.getItem(AFF_REF) || "";

  useEffect(() => {
    supabase
      .from("products")
      .select("id,name,price,category,image_url")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setList((data as Prod[]) || []));
  }, []);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Focus Link</h1>
        <p className="text-sm text-slate-400">Pilih produk &amp; jana pautan rujukan spesifik</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const link = `${SITE}?ref=${ref}&material=${encodeURIComponent(p.category || "")}&product=${p.id}`;
          return (
            <div key={p.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
              <div className="flex gap-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-content-center rounded-lg bg-blue-600/20 text-blue-300">
                    <Package className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">RM{p.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => copy(link, p.id)}>
                {copied === p.id ? <><Check className="h-4 w-4 text-green-400" />Copied</> : <><Link2 className="h-4 w-4" />Copy Focus Link</>}
              </Button>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-slate-500 text-sm">Tiada produk aktif.</p>}
      </div>
    </div>
  );
}
