import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Users, Phone, CheckCircle, Target, TrendingUp } from "lucide-react";
import { LeadCharts } from "@/components/leads/LeadCharts";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  contacted_at: string | null;
  closed_at: string | null;
}

interface LeadStats {
  new: number;
  contacted: number;
  closed: number;
  total: number;
  conversionRate: number;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    new: 0,
    contacted: 0,
    closed: 0,
    total: 0,
    conversionRate: 0,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeads();

    const subscription = supabase
      .channel("leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLeads(data || []);

      // Calculate stats
      const newCount = data?.filter((l) => l.status === "new").length || 0;
      const contactedCount = data?.filter((l) => l.status === "contacted").length || 0;
      const closedCount = data?.filter((l) => l.status === "closed").length || 0;
      const total = data?.length || 0;
      const conversionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

      setStats({
        new: newCount,
        contacted: contactedCount,
        closed: closedCount,
        total,
        conversionRate,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Gagal memuat data leads");
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      toast.error("Sila isi nama dan no telefon");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: newLead.name.trim(),
        phone: newLead.phone.trim(),
        status: "new",
      });

      if (error) throw error;

      toast.success("Lead berjaya ditambah!");
      setNewLead({ name: "", phone: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding lead:", error);
      toast.error("Gagal menambah lead");
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Lead Baru",
      value: stats.new,
      icon: Users,
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Dihubungi",
      value: stats.contacted,
      icon: Phone,
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: CheckCircle,
      bgColor: "bg-green-500",
      lightBg: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Total Leads",
      value: stats.total,
      icon: Target,
      bgColor: "bg-purple-500",
      lightBg: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      bgColor: "bg-cyan-500",
      lightBg: "bg-cyan-50",
      textColor: "text-cyan-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Management</h1>
          <p className="text-muted-foreground text-sm">Urus semua leads anda di sini</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Lead Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No Telefon</Label>
                <Input
                  id="phone"
                  placeholder="Masukkan no telefon"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddLead} disabled={isLoading}>
                {isLoading ? "Menambah..." : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.lightBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <LeadCharts leads={leads} />
    </div>
  );
}
