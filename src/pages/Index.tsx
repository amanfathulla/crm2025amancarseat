import { HeroSection } from "@/components/sales/HeroSection";
import { BeforeAfterSection } from "@/components/sales/BeforeAfterSection";
import { ColorGallery } from "@/components/sales/ColorGallery";
import { WhyFabricSilk } from "@/components/sales/WhyFabricSilk";
import { WallOfFame } from "@/components/sales/WallOfFame";
import { QuickOrderForm } from "@/components/sales/QuickOrderForm";
import { Footer } from "@/components/sales/Footer";
import fabricBlue from "@/assets/fabric-silk-blue.jpg";
import fabricBlack from "@/assets/fabric-silk-black.jpg";
import fabricRedStitch from "@/assets/fabric-silk-red-stitch.jpg";
import fabricRed from "@/assets/fabric-silk-red.jpg";
import fabricPurple from "@/assets/fabric-silk-purple.jpg";
import fabricBrown from "@/assets/fabric-silk-brown.jpg";
import fabricCream from "@/assets/fabric-silk-cream.jpg";
import afterSeat from "@/assets/after-seat.jpg";
import heroSeat from "@/assets/hero-seat-cover.jpg";

const sampleImages = [fabricBlue, fabricBlack, fabricRedStitch, fabricRed, fabricPurple, fabricBrown, fabricCream, afterSeat, heroSeat];
const sampleNames = ["Ahmad", "Siti", "Rizal", "Farah", "Hafiz", "Ain", "Azman", "Lina", "Faizal", "Nora"];
const sampleCars = ["Proton X50 pickup", "Myvi selfie", "Honda City box acs", "Vios pickup", "Saga selfie", "Axia box acs", "Almera pickup", "Mazda 3 selfie", "Bezza box acs", "Civic pickup"];

const sampleReviews = sampleImages.map((img, i) => ({
  id: `s-${i}`,
  name: sampleNames[i % sampleNames.length],
  car_model: sampleCars[i % sampleCars.length],
  rating: 5,
  review: "Puas hati dengan kualiti seat cover ACS!",
  images: [img],
}));

const Index = () => {
  const handleCTAClick = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark min-h-screen bg-black text-white w-full">
      <HeroSection onCTAClick={handleCTAClick} totalReviews={312} />
      <BeforeAfterSection />
      <WhyFabricSilk />
      <ColorGallery />
      <WallOfFame reviews={sampleReviews} />
      <QuickOrderForm />
      <Footer />
    </div>
  );
};

export default Index;
