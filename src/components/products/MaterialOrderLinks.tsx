import { useState } from "react";
import { Copy, Check, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MaterialLinkConfig {
  id: string;       // query param value
  label: string;    // display name
  emoji: string;
  gradient: string; // tailwind gradient classes
}

const MATERIAL_LINKS: MaterialLinkConfig[] = [
  { id: "mesh",        label: "Kain Mesh",              emoji: "🔵", gradient: "from-blue-500 to-blue-600" },
  { id: "nylon",       label: "Kain Nylon",             emoji: "🟢", gradient: "from-emerald-500 to-emerald-600" },
  { id: "fullsilk",    label: "Kain Fullsilk",          emoji: "🟣", gradient: "from-purple-500 to-purple-600" },
  { id: "semi-leather",label: "Semi Leather Kalis Air", emoji: "🟡", gradient: "from-amber-500 to-amber-600" },
];

export default function MaterialOrderLinks() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const buildUrl = (materialId: string) =>
    materialId === "fullsilk"
      ? `${origin}/order-fullsilk`
      : `${origin}/order/material${materialId}`;

  const handleCopy = async (materialId: string, label: string) => {
    const url = buildUrl(materialId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(materialId);
      toast({ title: "✅ Link disalin", description: `Link tempahan ${label} sudah berada dalam clipboard` });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Ralat", description: "Gagal salin link", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <LinkIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-base">Link Tempahan Mengikut Material</h3>
          <p className="text-sm text-muted-foreground">
            Salin & kongsi link berasingan untuk setiap material. Pelanggan terus ke produk pilihan tanpa perlu pilih material.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MATERIAL_LINKS.map((m) => {
          const url = buildUrl(m.id);
          const isCopied = copiedId === m.id;
          return (
            <div
              key={m.id}
              className="rounded-xl border bg-background overflow-hidden flex flex-col"
            >
              <div className={`bg-gradient-to-r ${m.gradient} px-3 py-2 flex items-center gap-2 text-white`}>
                <span className="text-lg">{m.emoji}</span>
                <span className="font-semibold text-sm flex-1 truncate">{m.label}</span>
                {m.id === "fullsilk" && (
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-semibold">
                    Hero Page
                  </span>
                )}
              </div>
              <div className="p-3 flex items-center gap-2">
                <code className="text-xs text-muted-foreground bg-muted/60 rounded px-2 py-1.5 flex-1 truncate" title={url}>
                  {url}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleCopy(m.id, m.label)}
                  title="Salin link"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={() => window.open(url, "_blank")}
                  title="Buka link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
