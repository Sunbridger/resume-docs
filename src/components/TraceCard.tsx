const TRACE_ROWS = [
  { label: "意图识别", value: "知识检索 · 0.93", status: "done" },
  { label: "Query 改写", value: "扩展同义词 + 时间线索", status: "done" },
  { label: "多路召回", value: "BM25 8 条 · 向量 8 条", status: "done" },
  { label: "Rerank", value: "融合重排 top 5", status: "done" },
  { label: "质量判定", value: "0.82 · 通过", status: "live" },
  { label: "答案生成", value: "引用 3 条历史工单", status: "pending" },
] as const;

export function TraceCard() {
  return (
    <div className="trace-card" aria-label="Agent 编排轨迹示意">
      <div className="trace-card__head">
        <span className="trace-card__title">Agent 编排</span>
        <span className="live-dot" aria-hidden="true" />
        <span className="trace-card__meta">Workflow 主 · LLM 辅</span>
      </div>
      <ol className="trace-card__list">
        {TRACE_ROWS.map((row, i) => (
          <li
            key={row.label}
            className={`trace-row trace-row--${row.status}`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
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
  );
}
