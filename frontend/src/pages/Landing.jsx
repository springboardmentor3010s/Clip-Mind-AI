import Hero from "../components/common/hero";
import AboutSection from "../components/common/AboutSection";
import FeaturesSection from "../components/common/FeaturesSection";
import WorkflowSection from "../components/common/WorkflowSection";
import TechnologySection from "../components/common/TechnologySection";

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <Hero />
      <AboutSection />
      <FeaturesSection />
      <WorkflowSection />
      <TechnologySection />
    </div>
  );
}
