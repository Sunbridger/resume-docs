import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { ProjectSection } from "./components/ProjectSection";
import { SiteNav } from "./components/SiteNav";
import { SkillsSection } from "./components/SkillsSection";
import { PROJECTS } from "./data/profile";
import { TicketDemo } from "./demo/ticket/TicketDemo";
import { RiskDemo } from "./demo/risk/RiskDemo";

export default function App() {
  return (
    <div className="site">
      <SiteNav />
      <main>
        <Hero />
        <SkillsSection />
        <ProjectSection project={PROJECTS.ticket} demo={<TicketDemo />} />
        <ProjectSection project={PROJECTS.risk} demo={<RiskDemo />} />
      </main>
      <Footer />
    </div>
  );
}
