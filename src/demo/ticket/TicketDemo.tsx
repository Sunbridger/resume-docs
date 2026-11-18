import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { TracePanel } from "./TracePanel";
import { useAgent } from "./useAgent";
import type { Role } from "./types";

const EXAMPLES: Record<Role, string[]> = {
  support: [
    "财务系统登录不上，提示账号被锁定怎么办？",
    "上次有同事反馈 VPN 连不上，后来怎么解决的？",
    "食堂刷卡机充值后余额没到账，怎么处理？",
    "帮我创建一个新工单",
    "帮我写一首关于春天的诗",
  ],
  dev: [
    "帮我推进上周未完成的工单",
    "查一下我最近一周的工单",
    "把 TK-1042 转交给张工",
    "复盘我上周处理过的工单",
    "帮我转交工单",
    "完结 TK-1031，原因是已修复并回归",
  ],
};

function AgentDemo({ role, onRoleChange }: { role: Role; onRoleChange: (role: Role) => void }) {
  const agent = useAgent(role);

  return (
    <div className="demo demo--agent">
      <div className="demo-bar">
        <div className="demo-bar__left">
          <span className="demo-bar__lights" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="demo-bar__title">工单智能体</span>
          <span className="demo-bar__tag mono">WORKFLOW · RAG · TOOLS</span>
        </div>
        <div className="demo-bar__right">
          <div className="segmented" role="tablist" aria-label="选择角色">
            <button
              type="button"
              role="tab"
              aria-selected={role === "support"}
              className={role === "support" ? "segmented__btn segmented__btn--active" : "segmented__btn"}
              onClick={() => onRoleChange("support")}
            >
              技术支持
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "dev"}
              className={role === "dev" ? "segmented__btn segmented__btn--active" : "segmented__btn"}
              onClick={() => onRoleChange("dev")}
            >
              研发
            </button>
          </div>
          <button type="button" className="link-btn" onClick={agent.reset}>
            重置对话
          </button>
        </div>
      </div>

      <div className="agent-body">
        <ChatPanel
          role={role}
          messages={agent.messages}
          busy={agent.busy}
          examples={EXAMPLES[role]}
          onSend={agent.send}
          onQuickCreate={agent.quickCreate}
          onSubmitForm={agent.submitForm}
        />
        <TracePanel steps={agent.steps} busy={agent.busy} />
      </div>
    </div>
  );
}

export function TicketDemo() {
  const [role, setRole] = useState<Role>("support");
  return <AgentDemo key={role} role={role} onRoleChange={setRole} />;
}
