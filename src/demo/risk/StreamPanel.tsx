import { useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "../../components/Markdown";
import {
  RISK_LEVEL_LABEL,
  buildInspectionReport,
  riskStats,
  type RiskLevel,
} from "../../data/risks";
import { parseReport, repairMarkdown, type RiskTag } from "./report";

const STREAM_SPEED = 420; // 字符/秒，模拟 SSE 回调

/** 高频流式回调在 rAF 中合并，每帧只提交一次 React 状态更新。 */
function useStream(full: string, speed: number, runKey: number) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setText("");
    setDone(false);
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const target = Math.min(full.length, Math.round(((now - started) / 1000) * speed));
      setText(full.slice(0, target));
      if (target < full.length) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [full, speed, runKey]);

  return { text, done };
}

function RiskCard({
  tag,
  body,
  complete,
  active,
  onSelect,
}: {
  tag: RiskTag;
  body: string;
  complete: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const level: RiskLevel = tag.level;
  return (
    <article
      className={`risk-card risk-card--${level}${active ? " risk-card--active" : ""}${
        complete ? "" : " risk-card--partial"
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <header className="risk-card__head">
        <span className="risk-card__id mono">{tag.id}</span>
        <span className={`risk-level risk-level--${level}`}>{RISK_LEVEL_LABEL[level]}</span>
        <span className="risk-card__page mono">P.{tag.page}</span>
      </header>
      <h4 className="risk-card__title">{tag.title}</h4>
      <div className="risk-card__body">
        <Markdown text={repairMarkdown(body)} />
      </div>
      <footer className="risk-card__foot">
        <span>{complete ? "点击定位到 PDF 原文" : "正在分析…"}</span>
        <span className="risk-card__arrow" aria-hidden="true">→</span>
      </footer>
    </article>
  );
}

export function StreamPanel({
  activeRiskId,
  onSelectRisk,
}: {
  activeRiskId: string | null;
  onSelectRisk: (id: string) => void;
}) {
  const fullReport = useMemo(() => buildInspectionReport(), []);
  const [runKey, setRunKey] = useState(0);
  const { text, done } = useStream(fullReport, STREAM_SPEED, runKey);
  const segments = useMemo(() => parseReport(text), [text]);
  const stats = riskStats();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const completed = segments.filter(
    (segment) => segment.type === "risk" && segment.complete,
  ).length;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      pinnedRef.current = distance < 90;
      setShowJump(distance > 150);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node && pinnedRef.current) node.scrollTop = node.scrollHeight;
  }, [text]);

  return (
    <section className="risk-stream" aria-label="AI 巡检结果">
      <div className="risk-stream__head">
        <div>
          <p className="risk-stream__eyebrow mono">AI INSPECTION · STREAMING</p>
          <p className="risk-stream__title">巡检结果</p>
        </div>
        <div className="risk-stream__actions">
          <span className={`stream-status${done ? " stream-status--done" : ""}`}>
            <span className="stream-status__dot" aria-hidden="true" />
            {done ? "巡检完成" : "流式输出中"}
          </span>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              pinnedRef.current = true;
              setRunKey((key) => key + 1);
            }}
          >
            重新巡检
          </button>
        </div>
      </div>

      <div className="risk-stream__progress" aria-hidden="true">
        <span style={{ width: `${(text.length / Math.max(fullReport.length, 1)) * 100}%` }} />
      </div>

      <div className="risk-stream__scroll" ref={scrollRef}>
        <div className="risk-stream__content">
          {segments.map((segment, index) =>
            segment.type === "markdown" ? (
              <Markdown key={`md-${index}`} text={repairMarkdown(segment.text)} className="risk-md" />
            ) : (
              <RiskCard
                key={`${segment.tag.id}-${index}`}
                tag={segment.tag}
                body={segment.body}
                complete={segment.complete}
                active={activeRiskId === segment.tag.id}
                onSelect={() => onSelectRisk(segment.tag.id)}
              />
            ),
          )}
          {!done && <span className="stream-cursor" aria-hidden="true" />}
        </div>
        {showJump && (
          <button
            type="button"
            className="jump-latest"
            onClick={() => {
              const node = scrollRef.current;
              if (node) node.scrollTop = node.scrollHeight;
              pinnedRef.current = true;
            }}
          >
            回到最新 ↓
          </button>
        )}
      </div>

      <div className="risk-stream__foot">
        <span>
          已识别 <b>{completed}</b>/{stats.total} 项 · 高 {stats.high} / 中 {stats.medium} / 低 {stats.low}
        </span>
        <span className="mono">rAF 合并 · 未闭合语法修复</span>
      </div>
    </section>
  );
}
