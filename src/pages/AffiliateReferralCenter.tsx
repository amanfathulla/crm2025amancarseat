import { useState } from "react";
import { getAffiliateClient } from "@/integrations/supabase/client";
import { Copy, Check, Link2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AFF_TOKEN = "affiliateToken";
const AFF_REF = "affiliateReferral";
const SITE = "https://amanfathulla.github.io/Salessss-testing/";

export default function AffiliateReferralCenter() {
  const [copied, setCopied] = useState<string | null>(null);
  const ref = localStorage.getItem(AFF_REF) || "";
  const baseLink = `${SITE}?ref=${ref}`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const track = async (source: string, link: string) => {
    const token = localStorage.getItem(AFF_TOKEN);
    if (!token) return;
    const c = getAffiliateClient(token);
    await c.from("affiliate_clicks").insert({ affiliate_id: localStorage.getItem("affiliateId")!, source });
    copy(link, source);
  };

  const links = [
    { key: "base", label: "Pautan Rujukan Umum", url: baseLink },
    { key: "wa", label: "WhatsApp", url: `https://wa.me/?text=${encodeURIComponent("Tengok produk ACS Legacy ni: " + baseLink)}` },
    { key: "fb", label: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseLink)}` },
    { key: "ig", label: "Instagram (copy caption)", url: `Produk premium ACS Legacy 🔥 ${baseLink}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Center</h1>
        <p className="text-sm text-slate-400">Kongsi pautan anda &amp; jejak setiap klik</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
        <p className="text-sm text-slate-300 font-medium">Pautan Utama</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-xs text-blue-300">
            {baseLink}
          </code>
          <Button size="sm" variant="outline" onClick={() => copy(baseLink, "base")}>
            {copied === "base" ? <><Check className="h-4 w-4 text-green-400" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
          </Button>
        </div>
        <p className="text-xs text-slate-500">Klik pada pautan di bawah akan rekod &amp; salin ke clipboard.</p>
      </div>

      <div className="grid gap-3">
        {links.map((l) => (
          <div key={l.key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <div className="grid size-9 place-content-center rounded-lg bg-blue-600/20 text-blue-300">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{l.label}</p>
              <p className="text-xs text-slate-500 truncate">{l.url}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => track(l.key, l.url)}>
              {copied === l.key ? <><Check className="h-4 w-4 text-green-400" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <QrCode className="h-5 w-5 text-blue-300" />
          <p className="font-medium">Kod QR</p>
        </div>
        <div className="flex justify-center py-4">
          <div className="grid place-content-center h-40 w-40 rounded-xl bg-white">
            <span className="text-slate-400 text-xs">QR dijana di fasa seterusnya</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center">Imbas untuk buka pautan rujukan terus.</p>
      </div>
    </div>
  );
}
