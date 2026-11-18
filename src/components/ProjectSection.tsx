import type { ReactNode } from "react";
import type { ProjectInfo } from "../data/profile";
import { TechChips } from "./TechChips";

export function ProjectSection({ project, demo }: { project: ProjectInfo; demo: ReactNode }) {
  return (
    <section className="project" id={project.id}>
      <header className="project__head">
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

      <div className="project__demo">{demo}</div>

      <div className="project__highlights">
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
    </section>
  );
}
