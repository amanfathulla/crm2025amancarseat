import { HeroSection } from "@/components/sales/HeroSection";
import { BeforeAfterSection } from "@/components/sales/BeforeAfterSection";
import { ColorGallery } from "@/components/sales/ColorGallery";
import { WhyFabricSilk } from "@/components/sales/WhyFabricSilk";
import { WallOfFame } from "@/components/sales/WallOfFame";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import { Footer } from "@/components/sales/Footer";
import { useReviews } from "@/hooks/useReviews";

/** Stitch divider — signature element: dashed red line like jahitan diamond stitch */
const StitchDivider = () => (
  <svg className="stitch-divider" viewBox="0 0 2000 28" preserveAspectRatio="none">
    <path d="M0,14 H2000" />
  </svg>
);

const Index = () => {
  const { reviews } = useReviews();

  const handleCTAClick = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-root dark min-h-screen bg-acs-ink text-acs-paper w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <HeroSection onCTAClick={handleCTAClick} totalReviews={Math.max(reviews.length, 369)} />
      <StitchDivider />
      <BeforeAfterSection />
      <StitchDivider />
      <WhyFabricSilk />
      <StitchDivider />
      <ColorGallery />
      <StitchDivider />
      <WallOfFame reviews={reviews} />
      <StitchDivider />
      <QuickOrderForm />
      <Footer />
    </div>
  );
};

export default Index;
