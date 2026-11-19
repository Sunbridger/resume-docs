import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { PipelineStage } from "./components/PipelineStage";
import { ProjectSection } from "./components/ProjectSection";
import { SiteNav } from "./components/SiteNav";
import { PROJECTS } from "./data/profile";
import { TicketDemo } from "./demo/ticket/TicketDemo";
import { RiskDemo } from "./demo/risk/RiskDemo";

export default function App() {
  return (
    <div className="site">
      <SiteNav />
      <main>
        <Hero />
        <ProjectSection
          project={PROJECTS.ticket}
          visual={
            <div className="project__visual">
              <p className="project__visual-label">
                RAG 检索链路
                <span className="mono">3D · PIPELINE</span>
              </p>
              <PipelineStage />
            </div>
          }
          demo={<TicketDemo />}
        />
        <ProjectSection project={PROJECTS.risk} demo={<RiskDemo />} />
      </main>
      <Footer />
    </div>
  );
}
