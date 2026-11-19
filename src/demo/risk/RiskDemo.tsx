import { useState } from "react";
import { PdfViewer, type PdfFocus } from "./PdfViewer";
import { StreamPanel } from "./StreamPanel";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...stroke} aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...stroke} aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...stroke} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" {...stroke} strokeWidth={1.7} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...stroke} strokeWidth={1.6} aria-hidden="true">
      <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...stroke} strokeWidth={1.6} aria-hidden="true">
      <path d="M10 4h4v2.6a2 2 0 1 0 0 4V15h-4.4a2 2 0 1 1-4 0H3v-4h2.6a2 2 0 1 0 0-4H3V4h4.4a2 2 0 1 1 2.6 0Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

export function RiskDemo() {
  const [focus, setFocus] = useState<PdfFocus | null>(null);
  const [showHud, setShowHud] = useState(true);

  const selectRisk = (id: string) => {
    setFocus((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  return (
    <div className="demo demo--risk">
      <div className="chrome-tabbar">
        <span className="chrome-lights" aria-hidden="true">
          <i /><i /><i />
        </span>
        <div className="chrome-tabs">
          <div className="chrome-tab chrome-tab--active">
            <span className="chrome-favicon chrome-favicon--risk" aria-hidden="true" />
            <span className="chrome-tab__title">智能风险预警平台</span>
            <span className="chrome-tab__close" aria-hidden="true">×</span>
          </div>
          <div className="chrome-tab">
            <span className="chrome-favicon chrome-favicon--new" aria-hidden="true">＋</span>
            <span className="chrome-tab__title">新标签页</span>
          </div>
          <span className="chrome-newtab" aria-hidden="true">＋</span>
        </div>
      </div>

      <div className="chrome-toolbar">
        <div className="chrome-nav" aria-hidden="true">
          <span><BackIcon /></span>
          <span><ForwardIcon /></span>
          <span><ReloadIcon /></span>
        </div>
        <div className="chrome-omnibox">
          <LockIcon />
          <span className="chrome-url">risk-insight.internal/inspection/ZC-2026-0118</span>
          <StarIcon />
        </div>
        <div className="chrome-actions" aria-hidden="true">
          <PuzzleIcon />
          <span className="chrome-profile">S</span>
          <MenuIcon />
        </div>
      </div>

      <div className="demo-bar demo-bar--risk">
        <div className="demo-bar__left">
          <span className="demo-bar__title">智能风险预警平台</span>
          <span className="demo-bar__tag mono">PDF.JS · STREAMING · RANGE</span>
        </div>
        <div className="demo-bar__right">
          <div className="risk-legend" aria-label="风险等级图例">
            <span><i className="legend-dot legend-dot--high" />高风险</span>
            <span><i className="legend-dot legend-dot--medium" />中风险</span>
            <span><i className="legend-dot legend-dot--low" />低风险</span>
          </div>
          <button
            type="button"
            className={`toggle-btn${showHud ? " toggle-btn--on" : ""}`}
            onClick={() => setShowHud((value) => !value)}
            aria-pressed={showHud}
          >
            性能指标
            <span className="toggle-btn__track" aria-hidden="true"><i /></span>
          </button>
        </div>
      </div>

      <div className="risk-body">
        <PdfViewer focus={focus} onSelectRisk={selectRisk} showHud={showHud} />
        <StreamPanel activeRiskId={focus?.id ?? null} onSelectRisk={selectRisk} />
      </div>
    </div>
  );
}
