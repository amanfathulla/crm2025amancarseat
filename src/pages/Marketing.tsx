
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MegaphoneIcon, MailIcon, TagIcon } from "lucide-react";
import { MarketingPlanner } from "@/components/marketing/MarketingPlanner";

// Sample data for charts
const campaignData = [
  { name: "Email", conversion: 3.2, reach: 12400 },
  { name: "Social", conversion: 4.5, reach: 18600 },
  { name: "Display", conversion: 1.8, reach: 24200 },
  { name: "Referral", conversion: 5.7, reach: 8900 },
  { name: "Direct", conversion: 2.9, reach: 14300 },
];

const monthlyData = [
  { name: "Jan", visitors: 4000, conversion: 2.4 },
  { name: "Feb", visitors: 4500, conversion: 2.7 },
  { name: "Mar", visitors: 5200, conversion: 3.2 },
  { name: "Apr", visitors: 4800, conversion: 3.0 },
  { name: "May", visitors: 6000, conversion: 3.6 },
  { name: "Jun", visitors: 7500, conversion: 4.2 },
  { name: "Jul", visitors: 8200, conversion: 4.5 },
];

export default function Marketing() {
  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Marketing</h1>
        <p className="text-muted-foreground">Manage campaigns and promotions</p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MarketingCard 
          title="Email Campaigns" 
          value="12" 
          description="Active campaigns" 
          icon={MailIcon}
          buttonText="Create Campaign"
          delay="100"
        />
        <MarketingCard 
          title="Promotions" 
          value="8" 
          description="Running promotions" 
          icon={TagIcon}
          buttonText="Create Promotion"
          delay="200"
        />
        <MarketingCard 
          title="Ad Campaigns" 
          value="5" 
          description="Active ad campaigns" 
          icon={MegaphoneIcon}
          buttonText="Create Ad"
          delay="300"
        />
      </div>
      
      <Tabs defaultValue="planner" className="animate-fade-in delay-400">
        <TabsList className="mb-6">
          <TabsTrigger value="planner">Content Planner</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planner" className="space-y-6">
          <MarketingPlanner />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Performance</CardTitle>
              <CardDescription>Monthly visitor count and conversion rate</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    yAxisId="left"
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 6]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="visitors"
                    strokeWidth={3}
                    dot={{ strokeWidth: 0, r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    stroke="hsl(var(--primary))"
                    name="Visitors"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    strokeWidth={3}
                    dot={{ strokeWidth: 0, r: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    stroke="hsl(var(--secondary-foreground))"
                    name="Conversion Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Effectiveness</CardTitle>
              <CardDescription>Conversion rates and reach by channel</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    yAxisId="left"
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 7]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 30000]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                    formatter={(value, name) => {
                      if (name === "conversion") return [`${value}%`, "Conversion Rate"];
                      if (name === "reach") return [value, "Reach"];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="conversion" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                    name="conversion"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="reach" 
                    fill="hsl(var(--muted))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                    name="reach"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">
                Campaign management interface would be here, showing active and scheduled campaigns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audience">
          <Card>
            <CardContent className="p-4 text-center py-10">
              <p className="text-muted-foreground">
                Audience segmentation and analysis tools would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function MarketingCard({ title, value, description, icon: Icon, buttonText, delay = "0" }: { 
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  delay?: string;
}) {
  return (
    <Card className={`animate-slide-up delay-${delay}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="bg-primary/10 p-2.5 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
