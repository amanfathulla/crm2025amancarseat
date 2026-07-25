import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Megaphone, Copy, Check } from "lucide-react";

const SITE = "https://amanfathulla.github.io/Salessss-testing/";

export default function AdminAffiliateMarketing() {
  const [copied, setCopied] = useState(false);
  const sampleLink = `${SITE}?ref=REFERRAL_CODE`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sampleLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <section>
        <div className="flex items-center gap-3 mb-1">
          <div className="grid size-10 place-content-center rounded-lg bg-blue-600/20 shadow-md">
            <Megaphone className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bahan Marketing</h1>
            <p className="text-muted-foreground text-sm">Template pautan & nota untuk affiliate</p>
          </div>
        </div>
      </section>

      <div className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5">
        <div className="space-y-2">
          <p className="text-sm text-slate-300 font-medium">Pautan Rujukan (template)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-slate-800 border border-white/10 px-3 py-2 text-xs text-blue-300">
              {sampleLink}
            </code>
            <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
              {copied ? <><Check className="h-4 w-4 text-green-400" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ganti <b>REFERRAL_CODE</b> dengan kod rujukan affiliate masing-masing.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-300 font-medium">Cara guna</p>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
            <li>Affiliate kongsi pautan rujukan di WhatsApp / Instagram / TikTok.</li>
            <li>Pelanggan klik → sistem rekod klik &amp; jualan ke akaun affiliate.</li>
            <li>Komisen dikira automatik dari harga produk.</li>
          </ul>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
          Upload banner/gambar akan ditambah di fasa seterusnya (perlu Supabase Storage).
        </div>
      </div>
    </div>
  );
}
