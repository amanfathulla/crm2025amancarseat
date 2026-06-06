import { HeroSection } from "@/components/sales/HeroSection";
import { BeforeAfterSection } from "@/components/sales/BeforeAfterSection";
import { ColorGallery } from "@/components/sales/ColorGallery";
import { WhyFabricSilk } from "@/components/sales/WhyFabricSilk";
import { WallOfFame } from "@/components/sales/WallOfFame";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import { Footer } from "@/components/sales/Footer";
import { useReviews } from "@/hooks/useReviews";

const Index = () => {
  const { reviews } = useReviews();

  const handleCTAClick = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark min-h-screen bg-black text-white w-full">
      <HeroSection onCTAClick={handleCTAClick} totalReviews={Math.max(reviews.length, 369)} />
      <BeforeAfterSection />
      <WhyFabricSilk />
      <ColorGallery />
      <WallOfFame reviews={reviews as any} />
      <QuickOrderForm />
      <Footer />
    </div>
  );
};

export default Index;
