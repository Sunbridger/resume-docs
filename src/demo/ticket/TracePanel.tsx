import { useEffect, useRef, useState } from "react";
import type { DetailSection, TraceStep } from "./types";

const STATUS_LABEL: Record<TraceStep["status"], string> = {
  running: "执行中",
  done: "完成",
  retry: "重试",
  error: "失败",
  skipped: "跳过",
};

function DetailBlock({ section }: { section: DetailSection }) {
  if (section.kind === "json") {
    return (
      <div className="trace-detail">
        <p className="trace-detail__label">{section.label}</p>
        <pre className="trace-json">{JSON.stringify(section.data, null, 2)}</pre>
      </div>
    );
  }
  if (section.kind === "kv") {
    return (
      <div className="trace-detail">
        <p className="trace-detail__label">{section.label}</p>
        <dl className="trace-kv">
          {section.data.map(([key, value]) => (
            <div key={key} className="trace-kv__row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  if (section.kind === "checks") {
    return (
      <div className="trace-detail">
        <p className="trace-detail__label">{section.label}</p>
        <ul className="trace-checks">
          {section.data.map((check) => (
            <li key={check.field} className={check.ok ? "trace-check--ok" : "trace-check--fail"}>
              <span className="trace-check__icon" aria-hidden="true">
                {check.ok ? "✓" : "✗"}
              </span>
              <span className="trace-check__field mono">{check.field}</span>
              <span className="trace-check__message">{check.message}</span>
              {check.input !== undefined && (
                <span className="trace-check__input mono">{String(check.input)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (section.kind === "scores") {
    return (
      <div className="trace-detail">
        <p className="trace-detail__label">{section.label}</p>
        <ul className="trace-scores">
          {section.data.map((row) => {
            const max = row.max ?? 1;
            const width = Math.max(2, Math.min(100, (row.value / max) * 100));
            return (
              <li key={row.label} className="trace-score">
                <span className="trace-score__label" title={row.label}>
                  {row.label}
                </span>
                <span className="trace-score__bar">
                  <span className="trace-score__fill" style={{ width: `${width}%` }} />
                </span>
                <span className="trace-score__value mono">{row.value.toFixed(2)}</span>
                {row.note && <span className="trace-score__note">{row.note}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <div className="trace-detail">
      <p className="trace-detail__label">{section.label}</p>
      <p className="trace-text">{section.data}</p>
    </div>
  );
}

export function TracePanel({ steps, busy }: { steps: TraceStep[]; busy: boolean }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [steps]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded = steps.length > 0 && steps.every((step) => expanded.has(step.id));
  const toggleAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(steps.map((step) => step.id)));
  };

  return (
    <aside className="trace-panel" aria-label="执行轨迹">
      <div className="trace-panel__head">
        <div>
          <p className="trace-panel__title">执行轨迹</p>
          <p className="trace-panel__sub">意图 · 参数 · RAG · 工具调用</p>
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={toggleAll}
          disabled={steps.length === 0}
        >
          {allExpanded ? "全部收起" : "全部展开"}
        </button>
      </div>

      <div className="trace-panel__list" ref={listRef}>
        {steps.length === 0 && (
          <div className="trace-empty">
            <p className="trace-empty__title">等待输入</p>
            <p className="trace-empty__text">
              发送消息后，这里会实时展示意图识别、参数校验、RAG 检索节点与工具调用的执行过程。
            </p>
            <div className="trace-empty__legend">
              <span><i className="dot dot--done" />完成</span>
              <span><i className="dot dot--running" />执行中</span>
              <span><i className="dot dot--retry" />重试</span>
              <span><i className="dot dot--error" />失败</span>
            </div>
          </div>
        )}

        {steps.map((step) => {
          const open = expanded.has(step.id);
          return (
            <div
              key={step.id}
              className={`trace-step trace-step--${step.status}${step.depth ? " trace-step--child" : ""}`}
            >
              <button
                type="button"
                className="trace-step__head"
                onClick={() => toggle(step.id)}
                aria-expanded={open}
              >
                <span className={`trace-step__dot trace-step__dot--${step.status}`} aria-hidden="true" />
                <span className="trace-step__body">
                  <span className="trace-step__title-row">
                    <span className="trace-step__title">{step.title}</span>
                    {step.meta && <span className="trace-step__meta">{step.meta}</span>}
                  </span>
                  {step.subtitle && <span className="trace-step__sub">{step.subtitle}</span>}
                </span>
                <span className="trace-step__side">
                  {step.durationMs !== undefined && (
                    <span className="trace-step__duration mono">
                      {(step.durationMs / 1000).toFixed(2)}s
                    </span>
                  )}
                  {step.detail && step.detail.length > 0 && (
                    <span className={`chevron${open ? " chevron--open" : ""}`} aria-hidden="true" />
                  )}
                </span>
              </button>
              <span className="sr-only">{STATUS_LABEL[step.status]}</span>
              {open && step.detail && (
                <div className="trace-step__detail">
                  {step.detail.map((section) => (
                    <DetailBlock key={section.label} section={section} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {busy && steps.length > 0 && (
          <div className="trace-running">
            <span className="pulse-dot" /> 工作流执行中…
          </div>
        )}
      </div>
    </aside>
  );
}
