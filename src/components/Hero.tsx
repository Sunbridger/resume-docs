import { PROFILE } from "../data/profile";
import { TechChips } from "./TechChips";

const TRACE_ROWS = [
  { label: "意图识别", value: "知识检索 · 0.93", status: "done" },
  { label: "Query 改写", value: "扩展同义词 + 时间线索", status: "done" },
  { label: "多路召回", value: "BM25 8 条 · 向量 8 条", status: "done" },
  { label: "Rerank", value: "融合重排 top 5", status: "done" },
  { label: "质量判定", value: "0.82 · 通过", status: "live" },
  { label: "答案生成", value: "引用 3 条历史工单", status: "pending" },
];

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
            让 Agent 的每一步
            <br />
            都可以被<span className="hero__title-accent">看见</span>。
          </h1>
          <p className="hero__lead">{PROFILE.intro}</p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#ticket-agent">
              进入工单智能体 Demo
            </a>
            <a className="btn btn--ghost" href="#risk-platform">
              查看风险巡检 Demo
            </a>
          </div>
          <TechChips items={PROFILE.skills} tone="accent" />
          <p className="hero__note">
            两个 Demo 均为纯前端实现：检索、路由、调度与流式渲染真实运行，LLM 语义判断由规则模拟并显式标注。
          </p>
        </div>

        <div className="hero__panel" aria-label="编排轨迹示意">
          <div className="trace-card">
            <div className="trace-card__head">
              <span className="trace-card__title">Agent 编排</span>
              <span className="live-dot" aria-hidden="true" />
              <span className="trace-card__meta">Workflow 主 · LLM 辅</span>
            </div>
            <ol className="trace-card__list">
              {TRACE_ROWS.map((row, i) => (
                <li key={row.label} className={`trace-row trace-row--${row.status}`} style={{ animationDelay: `${i * 90}ms` }}>
                  <span className={`trace-row__dot trace-row__dot--${row.status}`} aria-hidden="true" />
                  <span className="trace-row__label">{row.label}</span>
                  <span className="trace-row__value">{row.value}</span>
                </li>
              ))}
            </ol>
            <div className="trace-card__foot">
              <span>search_history_tickets</span>
              <span className="mono">RAG · retry ≤ 2</span>
            </div>
          </div>
          <div className="hero__panel-badge">双角色 · 技术支持 / 研发</div>
        </div>
      </div>
    </section>
  );
}
