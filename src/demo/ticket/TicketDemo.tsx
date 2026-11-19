import { useState, type ReactNode } from "react";
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

const RAIL_ICONS = [
  {
    title: "消息",
    active: true,
    path: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5v-3.5A2.5 2.5 0 0 1 4 13.5z",
  },
  {
    title: "通讯录",
    active: false,
    path: "M8 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM2.8 19c.7-3 2.9-4.7 5.2-4.7s4.5 1.7 5.2 4.7M16.5 11.5a2.6 2.6 0 1 0 0-5.2M16 14c2.6-.2 4.6 1.4 5.2 4",
  },
  {
    title: "工作台",
    active: false,
    path: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  },
  {
    title: "日程",
    active: false,
    path: "M5 6.5h14V20H5zM5 10h14M8.5 4v4M15.5 4v4",
  },
  {
    title: "云盘",
    active: false,
    path: "M7 18h9.5a3.5 3.5 0 0 0 .4-7A5.6 5.6 0 0 0 6.2 12.3 3 3 0 0 0 7 18Z",
  },
  {
    title: "更多",
    active: false,
    path: "M5 12h.01M12 12h.01M19 12h.01",
  },
];

function DingtalkShell({ children }: { children: ReactNode }) {
  return (
    <div className="dt-shell">
      <div className="dt-rail" aria-hidden="true">
        <span className="dt-rail__avatar">S</span>
        <span className="dt-rail__divider" />
        {RAIL_ICONS.map((icon) => (
          <span
            key={icon.title}
            title={icon.title}
            className={`dt-rail__icon${icon.active ? " dt-rail__icon--active" : ""}`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={icon.title === "更多" ? 2.6 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon.path} />
            </svg>
          </span>
        ))}
      </div>
      <div className="dt-main">{children}</div>
    </div>
  );
}

function AgentDemo({ role, onRoleChange }: { role: Role; onRoleChange: (role: Role) => void }) {
  const agent = useAgent(role);

  return (
    <div className="demo demo--agent demo--dingtalk">
      <div className="dt-chrome">
        <div className="dt-chrome__left">
          <span className="dingtalk-logo" aria-hidden="true">
            钉
          </span>
          <span className="dt-chrome__app">钉钉</span>
          <span className="dt-chrome__sep" aria-hidden="true" />
          <span className="dt-chrome__title">工单智能体 · 机器人会话</span>
        </div>
        <div className="dt-chrome__right">
          <span className="dt-chrome__status">
            <i aria-hidden="true" />
            在线
          </span>
          <span className="dt-win" aria-hidden="true">
            <b>—</b>
            <b>▢</b>
            <b>✕</b>
          </span>
        </div>
      </div>

      <DingtalkShell>
        <div className="agent-body">
          <ChatPanel
            role={role}
            messages={agent.messages}
            busy={agent.busy}
            examples={EXAMPLES[role]}
            onSend={agent.send}
            onQuickCreate={agent.quickCreate}
            onSubmitForm={agent.submitForm}
            actions={
              <>
                <div className="segmented" role="tablist" aria-label="选择角色">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={role === "support"}
                    className={
                      role === "support" ? "segmented__btn segmented__btn--active" : "segmented__btn"
                    }
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
                <button
                  type="button"
                  className="dt-round-btn"
                  onClick={agent.reset}
                  title="重置对话"
                  aria-label="重置对话"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5" />
                  </svg>
                </button>
              </>
            }
          />
          <TracePanel steps={agent.steps} busy={agent.busy} />
        </div>
      </DingtalkShell>
    </div>
  );
}

export function TicketDemo() {
  const [role, setRole] = useState<Role>("support");
  return <AgentDemo key={role} role={role} onRoleChange={setRole} />;
}
