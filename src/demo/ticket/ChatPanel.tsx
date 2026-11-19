import { useEffect, useRef, useState, type ReactNode } from "react";
import type { NewTicketInput, Role, ChatItem } from "./types";
import { Message } from "./Message";

const EMPTY_COPY: Record<Role, { badge: string; title: string; text: string; items: string[] }> = {
  support: {
    badge: "技术支持视角",
    title: "从一句问题描述开始",
    text: "我会检索历史工单里的处理经验并给出方案；如果确实没有可用方案，会引导你把工单建出来。",
    items: ["历史工单检索与方案推荐", "五类意图识别与参数澄清", "结构化表单创建新工单"],
  },
  dev: {
    badge: "研发视角",
    title: "管理你手上的工单",
    text: "查询个人工单、转交与完结；耗时的复盘交给异步任务，状态和结果都会回填到对话。",
    items: [
      "个人工单查询与时间范围筛选",
      "多工具依赖链：查询 → 详情 → 判断 → 转交 → 提醒",
      "Celery 异步复盘与状态轮询",
    ],
  },
};

export function ChatPanel({
  role,
  messages,
  busy,
  examples,
  onSend,
  onQuickCreate,
  onSubmitForm,
  actions,
}: {
  role: Role;
  messages: ChatItem[];
  busy: boolean;
  examples: string[];
  onSend: (text: string) => void;
  onQuickCreate: (prefill: Partial<NewTicketInput>) => void;
  onSubmitForm: (values: NewTicketInput) => void;
  actions?: ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft("");
  };

  const empty = messages.length === 0;
  const copy = EMPTY_COPY[role];

  return (
    <section className="chat" aria-label="对话区">
      <header className="dingtalk-chat-head">
        <span className="dingtalk-avatar" aria-hidden="true">
          AI
        </span>
        <div className="dingtalk-chat-head__body">
          <p className="dingtalk-chat-head__name">
            工单智能体
            <span className="dingtalk-chat-head__badge">机器人</span>
          </p>
          <p className="dingtalk-chat-head__meta">
            <span className="dingtalk-online-dot" aria-hidden="true" />
            Workflow 主 · LLM 辅 · 在线
          </p>
        </div>
        {actions && <div className="dingtalk-chat-head__actions">{actions}</div>}
      </header>

      <div className="chat__list" ref={listRef}>
        {empty && (
          <div className="chat-empty">
            <span className="chat-empty__badge">{copy.badge}</span>
            <h3 className="chat-empty__title">{copy.title}</h3>
            <p className="chat-empty__text">{copy.text}</p>
            <ul className="chat-empty__items">
              {copy.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((item) => (
          <Message
            key={item.id}
            item={item}
            role={role}
            onQuickCreate={onQuickCreate}
            onSubmitForm={onSubmitForm}
          />
        ))}

        {busy && (
          <div className="msg msg--assistant msg--typing" aria-label="Agent 正在执行">
            <span className="avatar avatar--ai" aria-hidden="true">AI</span>
            <div className="typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <div className="chat__composer">
        <div className="examples" aria-label="示例问题">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="example-chip"
              onClick={() => onSend(example)}
              disabled={busy}
            >
              {example}
            </button>
          ))}
        </div>
        <div className={`composer${busy ? " composer--busy" : ""}`}>
          <div className="composer__tools" aria-hidden="true">
            <span className="composer__tool">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M8.5 14.2c.8 1.2 2 1.9 3.5 1.9s2.7-.7 3.5-1.9M9 9.7h.01M15 9.7h.01" />
              </svg>
            </span>
            <span className="composer__tool">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4 4 7.5 16 2.2-6.3L20 11.5zM13.7 13.7 20 4" />
              </svg>
            </span>
            <span className="composer__tool">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                <path d="m6.5 15 3.2-3.6 2.8 3.1 2-2.2 3 3.5M9 10h.01" />
              </svg>
            </span>
            <span className="composer__tool">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2.5h5.5A2.5 2.5 0 0 1 20 10v6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16z" />
              </svg>
            </span>
            <span className="composer__tool">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <circle cx="6" cy="12" r="1.3" />
                <circle cx="12" cy="12" r="1.3" />
                <circle cx="18" cy="12" r="1.3" />
              </svg>
            </span>
          </div>
          <div className="composer__row">
            <textarea
              rows={1}
              value={draft}
              placeholder={
                role === "support"
                  ? "描述遇到的问题，例如：VPN 连不上，提示错误 800…"
                  : "试试：查我本周的工单 / 把 TK-1042 转交给张工…"
              }
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              disabled={busy}
            />
            <button
              type="button"
              className="composer__send"
              onClick={submit}
              disabled={busy || draft.trim().length === 0}
              aria-label="发送"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M3 20.5 21.4 12a.4.4 0 0 0 0-.8L3 3.5a.4.4 0 0 0-.5.5l1.8 6.6a.4.4 0 0 0 .3.3L13 12 4.6 13.1a.4.4 0 0 0-.3.3L2.5 20a.4.4 0 0 0 .5.5Z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="composer__tip">
          Enter 发送 · Shift + Enter 换行 · 输入内容与执行逻辑均在浏览器内运行
        </p>
      </div>
    </section>
  );
}
