import { Markdown } from "../../components/Markdown";
import { formatDate } from "./engine/time";
import { AsyncReviewCard } from "./AsyncReviewCard";
import { CreateTicketForm } from "./CreateTicketForm";
import type { ChatItem, NewTicketInput, Role, TicketStatus } from "./types";

function StatusPill({ status }: { status: TicketStatus }) {
  const tone = status === "已完成" ? "ok" : status === "处理中" ? "busy" : "idle";
  return <span className={`status-pill status-pill--${tone}`}>{status}</span>;
}

export function Message({
  item,
  role,
  onQuickCreate,
  onSubmitForm,
}: {
  item: ChatItem;
  role: Role;
  onQuickCreate: (prefill: Partial<NewTicketInput>) => void;
  onSubmitForm: (values: NewTicketInput) => void;
}) {
  if (item.kind === "user") {
    return (
      <div className="msg msg--user">
        <div className="msg__content">
          <div className="bubble bubble--user">{item.text}</div>
        </div>
        <span className="avatar avatar--user" aria-hidden="true">我</span>
      </div>
    );
  }

  if (item.kind === "assistant-text") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className={`bubble bubble--assistant${item.tone === "warn" ? " bubble--warn" : ""}`}>
            {item.text}
          </div>
          {item.mock && <span className="mock-tag">LLM 语义判断 · 规则模拟</span>}
        </div>
      </div>
    );
  }

  if (item.kind === "rag-answer") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className="answer-card">
            <div className="answer-card__head">
              <span className="answer-card__badge">方案推荐</span>
              <span className="answer-card__meta mono">
                检索 {item.attempts} 次 · 质量分 {item.quality.toFixed(2)}
              </span>
            </div>
            <Markdown text={item.answer} className="answer-card__md" />
            <div className="citations">
              <p className="citations__title">引用历史工单</p>
              {item.hits.map((hit) => (
                <div className="citation" key={hit.ticket.id}>
                  <span className="citation__id mono">{hit.ticket.id}</span>
                  <span className="citation__title">{hit.ticket.title}</span>
                  <span className="citation__bar" aria-hidden="true">
                    <span
                      className="citation__fill"
                      style={{ width: `${Math.min(100, hit.rerank * 100)}%` }}
                    />
                  </span>
                  <span className="citation__score mono">{hit.rerank.toFixed(2)}</span>
                  <StatusPill status={hit.ticket.status} />
                </div>
              ))}
            </div>
            {role === "support" && (
              <div className="answer-card__foot">
                <span>以上为历史经验，若未解决可提交新工单。</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() =>
                    onQuickCreate({
                      title: item.query.slice(0, 40),
                      description: item.query,
                    })
                  }
                >
                  方案未解决，创建工单
                </button>
              </div>
            )}
          </div>
          <span className="mock-tag">答案模板 + 真实检索结果</span>
        </div>
      </div>
    );
  }

  if (item.kind === "ticket-table") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className="table-card">
            <div className="table-card__head">
              <p className="table-card__title">{item.title}</p>
              {item.note && <p className="table-card__note">{item.note}</p>}
            </div>
            {item.tickets.length > 0 ? (
              <div className="table-wrap">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>编号</th>
                      <th>标题</th>
                      <th>状态</th>
                      <th>负责人</th>
                      <th>更新</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="mono">{ticket.id}</td>
                        <td>
                          {ticket.title}
                          <span className="tickets-table__system">{ticket.system}</span>
                        </td>
                        <td><StatusPill status={ticket.status} /></td>
                        <td>{ticket.assignee}</td>
                        <td className="mono">{formatDate(ticket.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="table-card__empty">该时间范围内没有匹配的工单。</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (item.kind === "create-form") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content msg__content--wide">
          <CreateTicketForm prefill={item.prefill} onSubmit={onSubmitForm} />
        </div>
      </div>
    );
  }

  if (item.kind === "created") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className="result-card result-card--ok">
            <p className="result-card__eyebrow mono">TICKET CREATED</p>
            <p className="result-card__title">工单已创建 · {item.ticket.id}</p>
            <ul className="result-card__lines">
              <li>{item.ticket.title}</li>
              <li>
                {item.ticket.system} · {item.ticket.priority} · {item.ticket.status}
              </li>
              <li>处理团队：{item.ticket.assignee}，已发送钉钉通知（mock）</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (item.kind === "action-result") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className={`result-card${item.tone === "ok" ? " result-card--ok" : ""}`}>
            <p className="result-card__eyebrow mono">TOOL RESULT</p>
            <p className="result-card__title">{item.title}</p>
            <ul className="result-card__lines">
              {item.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (item.kind === "workflow-summary") {
    return (
      <div className="msg msg--assistant">
        <span className="avatar avatar--ai" aria-hidden="true">AI</span>
        <div className="msg__content">
          <div className="workflow-card">
            <p className="workflow-card__eyebrow mono">MULTI-TOOL ORCHESTRATION</p>
            <p className="workflow-card__title">{item.title}</p>
            <ol className="workflow-chain">
              {item.steps.map((step, index) => (
                <li className="workflow-step" key={`${step.tool}-${index}`}>
                  <span className="workflow-step__index">{index + 1}</span>
                  <div className="workflow-step__body">
                    <div className="workflow-step__head">
                      <span className="workflow-step__tool mono">{step.tool}</span>
                      {step.dependsOn && (
                        <span className="workflow-step__dep">依赖 {step.dependsOn}</span>
                      )}
                    </div>
                    <p className="workflow-step__label">{step.label}</p>
                    <p className="workflow-step__result">{step.result}</p>
                  </div>
                </li>
              ))}
            </ol>
            {item.note && <p className="workflow-card__note">{item.note}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AsyncReviewCard
      jobId={item.jobId}
      worker={item.worker}
      rangeLabel={item.rangeLabel}
      tickets={item.tickets}
      summary={item.summary}
    />
  );
}
