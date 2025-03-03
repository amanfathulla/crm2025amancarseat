
import { MainLayout } from "@/components/layout/MainLayout";
import { MarketingPlanner } from "@/components/marketing/MarketingPlanner";

export default function Marketing() {
  return (
    <MainLayout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Marketing</h1>
        <p className="text-muted-foreground">Manage campaigns and promotions</p>
      </section>
      
      <MarketingPlanner />
    </MainLayout>
  );
}
