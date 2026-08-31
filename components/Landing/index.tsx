import { HeroSection } from "./sections/HeroSection";
import { StackSection } from "./sections/StackSection";
import { JourneySection } from "./sections/JourneySection";
import { ProductSection } from "./sections/ProductSection";
import { FAQSection } from "./sections/FAQSection";
import { CTASection } from "./sections/CTASection";
import { LandingFooter } from "./sections/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StackSection />
      <JourneySection />
      <ProductSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
