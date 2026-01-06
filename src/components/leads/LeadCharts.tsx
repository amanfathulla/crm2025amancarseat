import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  created_at: string;
  contacted_at: string | null;
  closed_at: string | null;
}

interface LeadChartsProps {
  leads: Lead[];
}

const MONTHS = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];

export function LeadCharts({ leads }: LeadChartsProps) {
  // Calculate monthly lead data
  const getMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const monthlyData = MONTHS.map((month, index) => {
      const monthLeads = leads.filter((lead) => {
        const date = new Date(lead.created_at);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });

      const closed = monthLeads.filter((l) => l.status === "closed").length;
      const notClosed = monthLeads.filter((l) => l.status !== "closed").length;
      const contacted = monthLeads.filter((l) => l.status === "contacted" || l.status === "closed").length;

      return {
        month,
        total: monthLeads.length,
        closed,
        notClosed,
        contacted,
      };
    });

    return monthlyData;
  };

  // Calculate status distribution for pie chart
  const getStatusData = () => {
    const closed = leads.filter((l) => l.status === "closed").length;
    const notClosed = leads.filter((l) => l.status !== "closed").length;

    return [
      { name: "Closed", value: closed, color: "hsl(142, 76%, 36%)" },
      { name: "Belum Closed", value: notClosed, color: "hsl(45, 93%, 47%)" },
    ];
  };

  const monthlyData = getMonthlyData();
  const statusData = getStatusData();

  const chartConfig = {
    total: { label: "Total Lead", color: "hsl(217, 91%, 60%)" },
    closed: { label: "Closed", color: "hsl(142, 76%, 36%)" },
    notClosed: { label: "Belum Closed", color: "hsl(45, 93%, 47%)" },
    contacted: { label: "Dihubungi", color: "hsl(25, 95%, 53%)" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Leads Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">📈 Lead Mengikut Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Total Lead" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Lead Pie Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">📊 Status Lead (Closed vs Belum)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Stacked Bar Chart - Closed vs Not Closed per Month */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">📊 Closed vs Belum Closed (Bulanan)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="closed" stackId="a" fill="hsl(142, 76%, 36%)" name="Closed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="notClosed" stackId="a" fill="hsl(45, 93%, 47%)" name="Belum Closed" radius={[4, 4, 0, 0]} />
              <Legend />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Follow-up Performance Line Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">📉 Prestasi Follow-up (Dihubungi → Closed)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="contacted"
                stroke="hsl(25, 95%, 53%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Dihubungi"
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Closed"
              />
              <Legend />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
