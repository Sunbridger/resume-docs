import { useState } from "react";
import type { NewTicketInput, Priority } from "./types";

const SYSTEMS = [
  "财务共享系统",
  "办公网络 / VPN",
  "企业邮箱",
  "门禁与通行",
  "食堂消费 / 一卡通",
  "办公设备",
  "研发工具",
  "其他系统",
];

const IMPACTS = ["仅我一人", "我的团队（2–10 人）", "全公司"];

function today(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function CreateTicketForm({
  prefill,
  onSubmit,
}: {
  prefill?: Partial<NewTicketInput>;
  onSubmit: (values: NewTicketInput) => void;
}) {
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [system, setSystem] = useState(prefill?.system ?? "其他系统");
  const [impact, setImpact] = useState(prefill?.impact ?? "仅我一人");
  const [occurredAt, setOccurredAt] = useState(prefill?.occurredAt ?? today());
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [priority, setPriority] = useState<Priority>(prefill?.priority ?? "P2");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (submitted) return;
    if (title.trim().length < 6) {
      setError("问题标题不少于 6 个字");
      return;
    }
    if (description.trim().length < 10) {
      setError("现象描述不少于 10 个字，越具体越容易被处理");
      return;
    }
    setError(null);
    setSubmitted(true);
    onSubmit({
      title: title.trim(),
      system,
      impact,
      occurredAt,
      description: description.trim(),
      priority,
    });
  };

  return (
    <form className={`ticket-form${submitted ? " ticket-form--submitted" : ""}`} onSubmit={handleSubmit}>
      <div className="ticket-form__grid">
        <label className="field field--wide">
          <span className="field__label">
            问题标题 <i>必填</i>
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="一句话描述问题，例如：财务系统登录提示账号锁定"
            disabled={submitted}
          />
        </label>

        <label className="field">
          <span className="field__label">系统 / 设备</span>
          <select value={system} onChange={(event) => setSystem(event.target.value)} disabled={submitted}>
            {SYSTEMS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">影响范围</span>
          <select value={impact} onChange={(event) => setImpact(event.target.value)} disabled={submitted}>
            {IMPACTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">出现时间</span>
          <input
            type="date"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            disabled={submitted}
          />
        </label>

        <label className="field">
          <span className="field__label">优先级</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            disabled={submitted}
          >
            <option value="P1">P1 · 阻断业务</option>
            <option value="P2">P2 · 影响效率</option>
            <option value="P3">P3 · 一般问题</option>
          </select>
        </label>

        <label className="field field--wide">
          <span className="field__label">
            现象描述 <i>必填</i>
          </span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="补充报错信息、操作路径、已尝试的方法等"
            disabled={submitted}
          />
        </label>
      </div>

      {error && <p className="ticket-form__error">{error}</p>}

      <div className="ticket-form__foot">
        <p className="ticket-form__hint">
          提交后 Agent 会做 Pydantic 校验并调用创建工具，无需来回确认。
        </p>
        <button type="submit" className="btn btn--primary btn--sm" disabled={submitted}>
          {submitted ? "已提交" : "提交工单"}
        </button>
      </div>
    </form>
  );
}
