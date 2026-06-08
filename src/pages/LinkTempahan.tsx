import { Link2 } from "lucide-react";
import MaterialOrderLinks from "@/components/products/MaterialOrderLinks";
import ShippingCostSettings from "@/components/products/ShippingCostSettings";

export default function LinkTempahan() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Link Tempahan</h1>
        <p className="text-muted-foreground text-sm">
          Urus link tempahan setiap material dan tetapan kos penghantaran di satu tempat.
        </p>
      </div>

      {/* Link tempahan utama */}
      <div className="bg-gradient-to-br from-violet-500/15 to-violet-600/10 border rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            <Link2 className="h-5 w-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">Link Tempahan Utama</h3>
            <p className="text-sm text-muted-foreground">
              Link umum untuk semua material — pelanggan akan lihat semua kategori aktif.
            </p>
          </div>
        </div>
        <code className="block text-sm bg-card rounded px-3 py-2 border break-all">
          {baseUrl}/order
        </code>
      </div>

      {/* Link mengikut material */}
      <MaterialOrderLinks />

      {/* Setting kos penghantaran */}
      <ShippingCostSettings />
    </div>
  );
}
