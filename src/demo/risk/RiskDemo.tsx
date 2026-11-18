import { useState } from "react";
import { PdfViewer, type PdfFocus } from "./PdfViewer";
import { StreamPanel } from "./StreamPanel";

export function RiskDemo() {
  const [focus, setFocus] = useState<PdfFocus | null>(null);
  const [showHud, setShowHud] = useState(true);

  const selectRisk = (id: string) => {
    setFocus((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  return (
    <div className="demo demo--risk">
      <div className="demo-bar">
        <div className="demo-bar__left">
          <span className="demo-bar__lights" aria-hidden="true">
            <i /><i /><i />
          </span>
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
