import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { ProjectInfo } from "../data/profile";
import { TechChips } from "./TechChips";

const TILT_DEG = 5;

function ProjectHead({ project }: { project: ProjectInfo }) {
  const ref = useRef<HTMLElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--glare-x", "50%");
    el.style.setProperty("--glare-y", "50%");
  };

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    el.style.setProperty("--tilt-x", `${(-py * TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(px * TILT_DEG * 2).toFixed(2)}deg`);
    el.style.setProperty("--glare-x", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${((py + 0.5) * 100).toFixed(1)}%`);
  };

  return (
    <header
      className="project__head"
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <div className="project__index" aria-hidden="true">
        {project.index}
      </div>
      <div className="project__intro">
        <p className="eyebrow">
          {project.role} · {project.period}
        </p>
        <h2 className="project__title">{project.title}</h2>
        <p className="project__summary">{project.summary}</p>
        <TechChips items={project.stack} />
      </div>
    </header>
  );
}

export function ProjectSection({
  project,
  visual,
  demo,
}: {
  project: ProjectInfo;
  visual?: ReactNode;
  demo: ReactNode;
}) {
  const [techOpen, setTechOpen] = useState(true);

  return (
    <section className="project" id={project.id}>
      <ProjectHead project={project} />

      <div className="project__demo">{demo}</div>

      <div className={`project__tech${techOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="project__tech-head"
          aria-expanded={techOpen}
          onClick={() => setTechOpen((open) => !open)}
        >
          <span className="project__tech-label">
            技术方案
            <span className="mono">TECH DETAILS</span>
          </span>
          <span className="project__tech-count">{project.highlights.length} 项</span>
          <span className="project__tech-action">{techOpen ? "收起" : "展开"}</span>
          <span className="project__tech-chevron" aria-hidden="true" />
        </button>

        <div className="project__highlights" hidden={!techOpen}>
          {project.highlights.map((item, i) => (
            <article className="highlight" key={item.title}>
              <span className="highlight__index">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="highlight__title">{item.title}</h3>
              <ul className="highlight__points">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      {visual}
    </section>
  );
}
