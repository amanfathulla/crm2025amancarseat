
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MegaphoneIcon, MailIcon, TagIcon } from "lucide-react";
import { MarketingPlanner } from "@/components/marketing/MarketingPlanner";

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
      
      <MarketingPlanner />
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
