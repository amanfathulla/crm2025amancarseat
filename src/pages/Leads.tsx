import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Users, Phone, CheckCircle, Target, TrendingUp, BarChart3, List } from "lucide-react";
import { LeadCharts } from "@/components/leads/LeadCharts";
import { LeadListTable } from "@/components/leads/LeadListTable";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  displayStatus?: string;
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
  const [activeTab, setActiveTab] = useState("charts");

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

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Filter leads: "new" status only if created within 24 hours
      // After 24 hours, treat as "contacted" (followup)
      const processedLeads = (data || []).map(lead => {
        const createdAt = new Date(lead.created_at);
        const isWithin24Hours = createdAt > twentyFourHoursAgo;
        
        // If status is "new" but created more than 24 hours ago, show as "contacted" (followup)
        if (lead.status === "new" && !isWithin24Hours) {
          return { ...lead, displayStatus: "contacted" };
        }
        return { ...lead, displayStatus: lead.status };
      });

      setLeads(processedLeads);

      // Calculate stats based on display status
      const newCount = processedLeads.filter((l) => l.displayStatus === "new").length;
      const contactedCount = processedLeads.filter((l) => l.displayStatus === "contacted").length;
      const closedCount = processedLeads.filter((l) => l.displayStatus === "closed").length;
      const total = processedLeads.length;
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

      // CRITICAL: Immediately refetch to update UI without waiting for realtime
      await fetchLeads();
      
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
      title: "Lead Baru (24jam)",
      value: stats.new,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Followup",
      value: stats.contacted,
      icon: Phone,
      gradient: "from-amber-500 to-amber-600",
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Total Leads",
      value: stats.total,
      icon: Target,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      gradient: "from-cyan-500 to-cyan-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Lead Management</h1>
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

      {/* Stats Cards - Full color like Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 md:p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 rounded-full bg-white/10" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/90">{stat.title}</p>
                <stat.icon className="h-4 w-4 text-white/80" />
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs for Charts and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Graf
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Senarai Lead
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="mt-6">
          <LeadCharts leads={leads} />
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <LeadListTable leads={leads} onLeadUpdated={fetchLeads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
