import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Save, ExternalLink } from "lucide-react";

type GatewayRow = {
  id: string;
  provider: string;
  display_name: string;
  display_order: number;
  is_enabled: boolean;
  sandbox_mode: boolean;
  credentials: Record<string, string>;
};

const FIELD_SPEC: Record<string, { label: string; placeholder?: string; type?: string }[]> = {
  billplz: [
    { label: "api_key", placeholder: "Billplz API Key" },
    { label: "collection_id", placeholder: "Collection ID" },
    { label: "x_signature_key", placeholder: "X-Signature Key" },
  ],
  toyyibpay: [
    { label: "secret_key", placeholder: "toyyibPay Secret Key" },
    { label: "category_code", placeholder: "Category Code" },
  ],
  chip: [
    { label: "api_key", placeholder: "CHIP API Key (Bearer)" },
    { label: "brand_id", placeholder: "Brand ID" },
  ],
  bayarcash: [
    { label: "api_key", placeholder: "Bayarcash Personal Access Token" },
    { label: "portal_key", placeholder: "Portal Key" },
    { label: "checksum_key", placeholder: "Checksum Key" },
  ],
  bcl: [
    { label: "api_key", placeholder: "BCL Pay API Key" },
    { label: "merchant_id", placeholder: "Merchant ID" },
  ],
};

const PROVIDER_INFO: Record<string, { docs: string; note?: string }> = {
  billplz: { docs: "https://www.billplz.com/api" },
  toyyibpay: { docs: "https://toyyibpay.com/apireference/" },
  chip: { docs: "https://docs.chip-in.asia/" },
  bayarcash: { docs: "https://bayarcash.gitbook.io/api/" },
  bcl: { docs: "https://bclpay.com.my/" },
};

export default function PaymentGateways() {
  const { authClient } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<GatewayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await authClient
        .from("payment_gateways" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) {
        toast({ title: "Gagal load gateways", description: error.message, variant: "destructive" });
      } else {
        setRows(((data as any[]) || []).map((r) => ({ ...r, credentials: r.credentials || {} })));
      }
      setLoading(false);
    })();
  }, [authClient, toast]);

  const updateLocal = (id: string, patch: Partial<GatewayRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const updateCred = (id: string, field: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, credentials: { ...r.credentials, [field]: value } } : r))
    );
  };

  const saveRow = async (row: GatewayRow) => {
    setSaving(row.id);
    const { error } = await (authClient as any)
      .from("payment_gateways")
      .update({
        is_enabled: row.is_enabled,
        sandbox_mode: row.sandbox_mode,
        credentials: row.credentials,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) {
      toast({ title: "Gagal simpan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${row.display_name} disimpan` });
    }
  };

  const toggleEnable = async (row: GatewayRow, enabled: boolean) => {
    updateLocal(row.id, { is_enabled: enabled });
    const { error } = await (authClient as any)
      .from("payment_gateways")
      .update({ is_enabled: enabled })
      .eq("id", row.id);
    if (error) {
      updateLocal(row.id, { is_enabled: !enabled });
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Payment Gateways</h1>
          <p className="text-sm text-muted-foreground">
            Aktifkan & konfigur gateway pembayaran untuk order page.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const fields = FIELD_SPEC[row.provider] || [];
          const info = PROVIDER_INFO[row.provider];
          return (
            <Card key={row.id} className={row.is_enabled ? "border-primary/40" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {row.display_name}
                      {row.is_enabled ? (
                        <Badge className="bg-emerald-600">Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Tidak aktif</Badge>
                      )}
                      {row.sandbox_mode && <Badge variant="secondary">Sandbox</Badge>}
                    </CardTitle>
                    {info && (
                      <CardDescription>
                        <a
                          href={info.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          Lihat docs <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardDescription>
                    )}
                  </div>
                  <Switch
                    checked={row.is_enabled}
                    onCheckedChange={(v) => toggleEnable(row, v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Mode Sandbox</Label>
                  <Switch
                    checked={row.sandbox_mode}
                    onCheckedChange={(v) => updateLocal(row.id, { sandbox_mode: v })}
                  />
                </div>
                {fields.map((f) => (
                  <div key={f.label} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      type={f.type || "text"}
                      value={row.credentials[f.label] || ""}
                      onChange={(e) => updateCred(row.id, f.label, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => saveRow(row)}
                  disabled={saving === row.id}
                  className="w-full"
                  size="sm"
                >
                  {saving === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Simpan {row.display_name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
