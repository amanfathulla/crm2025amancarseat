import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, User, Calendar, Edit2, Check } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  contacted_at: string | null;
  closed_at: string | null;
}

interface LeadListTableProps {
  leads: Lead[];
  onLeadUpdated: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Baru", variant: "secondary" },
  contacted: { label: "Dihubungi", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
};

export function LeadListTable({ leads, onLeadUpdated }: LeadListTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updateData: { status: string; contacted_at?: string | null; closed_at?: string | null } = {
        status: newStatus,
      };

      if (newStatus === "contacted") {
        updateData.contacted_at = new Date().toISOString();
      } else if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Status lead dikemaskini!");
      setEditingId(null);
      onLeadUpdated();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Gagal kemaskini status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Tiada lead untuk dipaparkan</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Nama</TableHead>
            <TableHead className="font-semibold">No Telefon</TableHead>
            <TableHead className="font-semibold">Tarikh Ditambah</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Tindakan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{lead.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(lead.created_at)}
                </div>
              </TableCell>
              <TableCell>
                {editingId === lead.id ? (
                  <Select
                    defaultValue={lead.status}
                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Baru</SelectItem>
                      <SelectItem value="contacted">Dihubungi</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={statusConfig[lead.status]?.variant || "secondary"}>
                    {statusConfig[lead.status]?.label || lead.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingId === lead.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                    disabled={isUpdating}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(lead.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
