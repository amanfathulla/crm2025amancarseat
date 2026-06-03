import { HeroSection } from "@/components/sales/HeroSection";
import { BeforeAfterSection } from "@/components/sales/BeforeAfterSection";
import { ColorGallery } from "@/components/sales/ColorGallery";
import { WhyFabricSilk } from "@/components/sales/WhyFabricSilk";
import { WallOfFame } from "@/components/sales/WallOfFame";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import { Footer } from "@/components/sales/Footer";

const Index = () => {
  const handleCTAClick = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <HeroSection onCTAClick={handleCTAClick} totalReviews={1000} />
      <BeforeAfterSection />
      <WhyFabricSilk />
      <ColorGallery />
      <WallOfFame reviews={[]} />
      <QuickOrderForm />
      <Footer />
    </div>
  );
};

export default Index;
