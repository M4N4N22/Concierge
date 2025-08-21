import { HeroSection } from "./sections/HeroSection";
import { ProblemSection } from "./sections/ProblemSection";
import { MarketSection } from "./sections/MarketSection";
import { SolutionSection } from "./sections/SolutionSection";
import { TechnicalSection } from "./sections/TechnicalSection";
import { CompetitiveSection } from "./sections/CompetitiveSection";
import { FAQSection } from "./sections/FAQSection";
import { CTASection } from "./sections/CTASection";

const Landing = () => {
  return (
    <div className="min-h-screen ">
      <HeroSection />
      <ProblemSection />
      <MarketSection />
      <SolutionSection />
      <TechnicalSection />
      <CompetitiveSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default Landing;
