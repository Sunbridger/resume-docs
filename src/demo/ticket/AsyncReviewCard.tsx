import { useEffect, useState } from "react";
import { Markdown } from "../../components/Markdown";
import type { Ticket } from "./types";

const STEPS = ["任务入队", "Worker 执行", "状态轮询", "结果回填"];

export function AsyncReviewCard({
  jobId,
  worker,
  rangeLabel,
  tickets,
  summary,
}: {
  jobId: string;
  worker: string;
  rangeLabel: string;
  tickets: Ticket[];
  summary: string;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 450),
      window.setTimeout(() => setPhase(2), 1450),
      window.setTimeout(() => setPhase(3), 2450),
      window.setTimeout(() => setPhase(4), 3350),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const done = phase >= 4;

  return (
    <div className="msg msg--assistant">
      <span className="avatar avatar--ai" aria-hidden="true">AI</span>
      <div className="msg__content">
        <div className="job-card">
          <div className="job-card__head">
            <div>
              <p className="job-card__eyebrow mono">ASYNC TASK · CELERY</p>
              <p className="job-card__title">工单复盘任务 · {rangeLabel}</p>
            </div>
            <span className={`job-card__status${done ? " job-card__status--done" : ""}`}>
              {done ? "SUCCESS" : "RUNNING"}
            </span>
          </div>

          <div className="job-card__meta">
            <span className="mono">job: {jobId}</span>
            <span className="mono">{worker}</span>
            <span className="mono">{tickets.length} 单</span>
          </div>

          <div className="job-progress" aria-hidden="true">
            <span className="job-progress__fill" style={{ width: `${(phase / 4) * 100}%` }} />
          </div>

          <ul className="job-steps">
            {STEPS.map((step, index) => {
              const stepDone = phase > index;
              const active = phase === index;
              return (
                <li
                  key={step}
                  className={`job-step${stepDone ? " job-step--done" : ""}${active ? " job-step--active" : ""}`}
                >
                  <span className="job-step__dot" aria-hidden="true" />
                  {step}
                </li>
              );
            })}
          </ul>

          {done ? (
            <div className="job-card__result">
              <Markdown text={summary} />
            </div>
          ) : (
            <p className="job-card__hint">
              主请求链路已返回，Agent 正在轮询任务状态，结果完成后自动回填。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
