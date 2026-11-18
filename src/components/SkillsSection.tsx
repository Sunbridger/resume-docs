import { SKILL_GROUPS } from "../data/profile";

export function SkillsSection() {
  return (
    <section className="skills" id="skills">
      <header className="skills__head">
        <p className="eyebrow">
          <span className="eyebrow__dot" aria-hidden="true" />
          EXPERTISE
        </p>
        <h2 className="skills__title">专业技能</h2>
        <p className="skills__sub">
          从前端交互到 Agent 执行引擎，再到检索与评测，覆盖 AI 应用从原型到上线的完整链路。
        </p>
      </header>

      <div className="skills__grid">
        {SKILL_GROUPS.map((group, index) => (
          <article className="skill-card" key={group.title}>
            <div className="skill-card__head">
              <span className="skill-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="skill-card__tag mono">{group.tag}</span>
            </div>
            <h3 className="skill-card__title">{group.title}</h3>
            <ul className="skill-card__points">
              {group.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
