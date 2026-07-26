import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquareText, Save } from "lucide-react";

type Step = {
  id: string;
  step_order: number;
  day_offset: number;
  message_template: string;
  media_type: string | null;
  media_url: string | null;
};

type Sequence = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function MessageTemplatesCard() {
  const { authClient } = useAuth();
  const { toast } = useToast();

  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [activeSeq, setActiveSeq] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: seqs } = await authClient
      .from("followup_sequences")
      .select("id, name, description, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    const list = (seqs ?? []) as Sequence[];
    setSequences(list);
    const target = list[0]?.id ?? null;
    setActiveSeq(target);
    if (target) await loadSteps(target);
    setLoading(false);
  };

  const loadSteps = async (seqId: string) => {
    const { data } = await authClient
      .from("followup_steps")
      .select("id, step_order, day_offset, message_template, media_type, media_url")
      .eq("sequence_id", seqId)
      .order("step_order", { ascending: true });
    setSteps((data ?? []) as Step[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSeqChange = async (seqId: string) => {
    setActiveSeq(seqId);
    await loadSteps(seqId);
  };

  const updateLocal = (id: string, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const saveStep = async (step: Step) => {
    setSavingId(step.id);
    const { error } = await authClient
      .from("followup_steps")
      .update({
        day_offset: step.day_offset,
        message_template: step.message_template,
      })
      .eq("id", step.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Gagal simpan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template disimpan" });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="w-5 h-5 text-primary" />
          Borang Mesej Harian
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ayat yang dihantar automatik ikut hari (D0, D3, D7...). Pembolehubah: {"{{nama}}"}, {"{{produk}}"}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sequences.length > 1 && (
          <div className="space-y-2">
            <Label>Sequence</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={activeSeq ?? ""}
              onChange={(e) => onSeqChange(e.target.value)}
            >
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat template...
          </div>
        ) : steps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Tiada step follow-up lagi. Tambah step di bawah atau semak sequence.
          </p>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {steps.map((step) => (
              <div key={step.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    Hari ke-{step.day_offset} (Step {step.step_order})
                  </span>
                </div>
                <Textarea
                  value={step.message_template}
                  onChange={(e) => updateLocal(step.id, { message_template: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-[11px]">Hari ke-</Label>
                    <Input
                      type="number"
                      value={step.day_offset}
                      onChange={(e) =>
                        updateLocal(step.id, { day_offset: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="mt-5"
                    disabled={savingId === step.id}
                    onClick={() => saveStep(step)}
                  >
                    {savingId === step.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Simpan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
