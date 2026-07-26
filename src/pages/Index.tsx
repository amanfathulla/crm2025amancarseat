import { HeroSection } from "@/components/sales/HeroSection";
import PromoBanner from "@/components/sales/PromoBanner";
import { BeforeAfterSection } from "@/components/sales/BeforeAfterSection";
import { ColorGallery } from "@/components/sales/ColorGallery";
import { WhyFabricSilk } from "@/components/sales/WhyFabricSilk";
import { WallOfFame } from "@/components/sales/WallOfFame";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import LiveFooter from "@/components/LiveFooter";
import { useReviews } from "@/hooks/useReviews";

const Index = () => {
  const { reviews } = useReviews();

  const handleCTAClick = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark min-h-screen bg-black text-white w-full">
      <HeroSection onCTAClick={handleCTAClick} totalReviews={Math.max(reviews.length, 369)} />
      <PromoBanner />
      <BeforeAfterSection />
      <WhyFabricSilk />
      <ColorGallery />
      <WallOfFame reviews={reviews as any} />
      <QuickOrderForm />
      <LiveFooter />
    </div>
  );
};

export default Index;
