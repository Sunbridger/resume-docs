import { useRef, type PointerEvent } from "react";
import { PROFILE, SKILL_GROUPS, type SkillGroup } from "../data/profile";

const TILT_DEG = 9;

function SkillCard({ group, index }: { group: SkillGroup; index: number }) {
  const ref = useRef<HTMLElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--tilt-x");
    el.style.removeProperty("--tilt-y");
    el.style.removeProperty("--glare-x");
    el.style.removeProperty("--glare-y");
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
    <article
      className="skill-tape"
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <span className="skill-tape__meta">
        <span className="skill-tape__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="skill-tape__tag">{group.tag}</span>
      </span>
      <h3 className="skill-tape__title">{group.title}</h3>
      <ul className="skill-tape__points">
        {group.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </article>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--accent">
            <span className="eyebrow__dot" aria-hidden="true" />
            AI 应用工程师 · 交互式作品集
          </p>
          <h1 className="hero__title">
            全链路<span className="hero__title-accent"> AI 落地</span>。
          </h1>
          <p className="hero__positioning">{PROFILE.positioning}</p>

          <ul className="hero__strengths">
            {PROFILE.strengths.map((item) => (
              <li className="strength" key={item.index}>
                <span className="strength__index" aria-hidden="true">
                  {item.index}
                </span>
                <span className="strength__body">
                  <span className="strength__title">{item.title}</span>
                  <span className="strength__detail">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="hero__skills" id="skills">
            <p className="hero__skills-label">
              <span className="hero__skills-title">专业技能</span>
              <span className="mono">SKILLS</span>
              <span className="hero__skills-count">
                {String(SKILL_GROUPS.length).padStart(2, "0")} GROUPS
              </span>
              <span className="hero__skills-hint">移动鼠标 · 3D 卡片</span>
            </p>

            <ul className="skill-tapes">
              {SKILL_GROUPS.map((group, index) => (
                <li key={group.tag}>
                  <SkillCard group={group} index={index} />
                </li>
              ))}
            </ul>
          </div>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#ticket-agent">
              进入工单智能体 Demo
            </a>
            <a className="btn btn--ghost" href="#risk-platform">
              查看风险巡检 Demo
            </a>
          </div>

          <p className="hero__note">
            两个 Demo 均为纯前端实现：检索与调度真实运行，LLM 判断由规则模拟。
          </p>
        </div>
      </div>
    </section>
  );
}
