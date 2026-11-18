import { useEffect, useRef, useState } from "react";
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
}: {
  role: Role;
  messages: ChatItem[];
  busy: boolean;
  examples: string[];
  onSend: (text: string) => void;
  onQuickCreate: (prefill: Partial<NewTicketInput>) => void;
  onSubmitForm: (values: NewTicketInput) => void;
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
            →
          </button>
        </div>
        <p className="composer__tip">
          Enter 发送 · Shift + Enter 换行 · 输入内容与执行逻辑均在浏览器内运行
        </p>
      </div>
    </section>
  );
}
