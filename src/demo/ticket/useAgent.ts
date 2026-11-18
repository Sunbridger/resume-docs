import { useRef, useState } from "react";
import type {
  ChatItem,
  ChatItemDraft,
  IntentResult,
  NewTicketInput,
  RagOutcome,
  Role,
  Ticket,
  ToolName,
  TraceStep,
  ValidationCheck,
} from "./types";
import { INITIAL_TICKETS } from "./data";
import {
  INTENT_LABELS,
  TOOL_LABELS,
  extractAssignee,
  extractCloseReason,
  extractTicketId,
  routeIntent,
  validateAction,
} from "./engine/intent";
import { runRag } from "./engine/rag";
import { filterByRange, parseRange, type TimeRange } from "./engine/time";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MAX_RETRIES = 2;

function defaultRecentRange(): TimeRange {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  return { key: "recent", label: "最近一周", from, to: now };
}

function inferSystem(text: string): string | undefined {
  if (/食堂|刷卡|一卡通|充值/.test(text)) return "食堂消费 / 一卡通";
  if (/门禁|通行/.test(text)) return "门禁与通行";
  if (/vpn|网络|内网|wifi/i.test(text)) return "办公网络 / VPN";
  if (/邮箱|邮件/.test(text)) return "企业邮箱";
  if (/打印|投屏|会议设备/.test(text)) return "办公设备";
  if (/财务|报销|结算/.test(text)) return "财务共享系统";
  if (/构建|发布|流水线|ci/i.test(text)) return "研发工具";
  return undefined;
}

function toTicketTitle(text: string): string {
  return text
    .replace(/[，,]?\s*(怎么办|怎么处理|如何处理|如何解决|怎么解决)[？?]?\s*$/, "")
    .trim();
}

function buildReviewSummary(subset: Ticket[], label: string): string {
  if (subset.length === 0) {
    return `**复盘摘要 · ${label}**\n\n该时间范围内没有属于你的工单，暂时无需复盘。`;
  }
  const done = subset.filter((ticket) => ticket.status === "已完成").length;
  const doing = subset.filter((ticket) => ticket.status === "处理中").length;
  const pending = subset.filter((ticket) => ticket.status === "待处理").length;
  const totalHours = subset.reduce((sum, ticket) => sum + ticket.effortHours, 0);
  const avg = (totalHours / subset.length).toFixed(1);
  const categories = new Map<string, number>();
  for (const ticket of subset) {
    categories.set(ticket.category, (categories.get(ticket.category) ?? 0) + 1);
  }
  const topCategories = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} ${count} 单`)
    .join("、");
  const longest = [...subset].sort((a, b) => b.effortHours - a.effortHours)[0];
  return [
    `**复盘摘要 · ${label} · ${subset.length} 单**`,
    "",
    `- 已完成 **${done}** 单，处理中 **${doing}** 单，待处理 **${pending}** 单`,
    `- 平均处理时长 **${avg}** 小时，累计投入 ${totalHours.toFixed(1)} 小时`,
    `- 高频类别：${topCategories}`,
    "",
    "**建议**",
    `- 耗时最高的是 **${longest.id} ${longest.title}**（${longest.effortHours}h），建议沉淀为排查手册。`,
    "- 把重复出现的处理步骤整理成 SOP，并在下次同类工单中直接复用。",
  ].join("\n");
}

export function useAgent(role: Role) {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [busy, setBusy] = useState(false);

  const ticketsRef = useRef<Ticket[]>(INITIAL_TICKETS);
  const busyRef = useRef(false);
  const runIdRef = useRef(0);
  const messageSeq = useRef(0);
  const stepSeq = useRef(0);
  const ticketSeq = useRef(2021);
  const pendingRef = useRef<{ action: ToolName; params: Record<string, string | undefined> } | null>(
    null,
  );

  const mutateTickets = (updater: (prev: Ticket[]) => Ticket[]) => {
    const next = updater(ticketsRef.current);
    ticketsRef.current = next;
    setTickets(next);
  };

  const pushMessage = (item: ChatItemDraft) => {
    messageSeq.current += 1;
    const id = messageSeq.current;
    setMessages((prev) => [...prev, { ...item, id } as ChatItem]);
    return id;
  };

  const addStep = (step: Omit<TraceStep, "id" | "startedAt">) => {
    stepSeq.current += 1;
    const id = `step-${stepSeq.current}`;
    setSteps((prev) => [...prev, { ...step, id, startedAt: Date.now() }]);
    return id;
  };

  const updateStep = (id: string, patch: Partial<TraceStep>) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== id) return step;
        const next = { ...step, ...patch };
        if (patch.status && patch.status !== "running" && step.status === "running") {
          next.durationMs = patch.durationMs ?? Date.now() - step.startedAt;
        }
        return next;
      }),
    );
  };

  const addIntentStep = (intent: IntentResult, subtitlePrefix?: string) => {
    return addStep({
      title: "意图识别",
      subtitle: `${
        subtitlePrefix ? `${subtitlePrefix} · ` : ""
      }${INTENT_LABELS[intent.intent]} · ${
        intent.method === "regex" ? "规则优先" : "LLM 结构化分类 (mock)"
      }`,
      status: "done",
      meta: `置信度 ${intent.confidence.toFixed(2)}`,
      detail: [
        {
          label: "分类结果",
          kind: "kv",
          data: [
            ["意图", INTENT_LABELS[intent.intent]],
            [
              "动作",
              intent.action
                ? TOOL_LABELS[intent.action].split(" · ")[0]
                : intent.intent === "knowledge_search"
                  ? "search_history_tickets"
                  : "—",
            ],
            ["识别方式", intent.method === "regex" ? "正则优先匹配" : "LLM 结构化分类 (mock)"],
            ["置信度", intent.confidence.toFixed(2)],
          ],
        },
        { label: "结构化参数", kind: "json", data: intent.params },
        { label: "判定理由", kind: "text", data: intent.reason },
      ],
    });
  };

  const addValidationStep = (checks: ValidationCheck[], subtitle = "Pydantic 结构化校验") => {
    const okCount = checks.filter((check) => check.ok).length;
    return addStep({
      title: "参数校验",
      subtitle,
      status: okCount === checks.length ? "done" : "error",
      meta: `${okCount}/${checks.length} 通过`,
      detail: [{ label: "校验项", kind: "checks", data: checks }],
    });
  };

  const beginRun = () => {
    runIdRef.current += 1;
    busyRef.current = true;
    setBusy(true);
    return runIdRef.current;
  };

  const endRun = (runId: number) => {
    if (runIdRef.current === runId) {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const alive = (runId: number) => runIdRef.current === runId;

  const openCreateForm = (prefill: Partial<NewTicketInput>, note?: string) => {
    const enriched: Partial<NewTicketInput> = { ...prefill };
    if (!enriched.system && (prefill.title || prefill.description)) {
      enriched.system = inferSystem(`${prefill.title ?? ""} ${prefill.description ?? ""}`);
    }
    if (enriched.title) enriched.title = toTicketTitle(enriched.title);
    addStep({
      title: "结构化表单",
      subtitle: "信息完整度判定 · LLM 辅助 (mock)",
      status: "done",
      meta: "等待用户填写",
      detail: [
        {
          label: "需要补充的信息",
          kind: "kv",
          data: [
            ["问题标题", "必填 · 不少于 6 个字"],
            ["系统 / 设备", "必填 · 用于路由处理团队"],
            ["影响范围", "必填 · 单人 / 团队 / 全公司"],
            ["出现时间", "必填 · 定位时间线"],
            ["现象描述", "必填 · 不少于 10 个字"],
          ],
        },
      ],
    });
    pushMessage({
      kind: "assistant-text",
      text: note ?? "我来帮你创建工单。请补全下面的信息，提交后会由对应团队跟进：",
      mock: true,
    });
    pushMessage({ kind: "create-form", prefill: enriched });
  };

  const runRagFlow = async (query: string, runId: number) => {
    const parentId = addStep({
      title: "工具调用 search_history_tickets",
      subtitle: "RAG 多阶段检索工作流",
      status: "running",
      meta: "LangGraph 风格节点编排",
    });
    const generator = runRag(query, ticketsRef.current, { maxRetries: MAX_RETRIES });
    let outcome: RagOutcome | undefined;

    while (true) {
      const { value, done } = await generator.next();
      if (!alive(runId)) return;
      if (done) {
        outcome = value;
        break;
      }

      if (value.type === "rewrite") {
        addStep({
          title: value.attempt > 1 ? `Query 改写 · 重试 ${value.attempt - 1}/${MAX_RETRIES}` : "Query 改写",
          subtitle: "规则改写 + 同义词扩展",
          status: "done",
          meta: `第 ${value.attempt} 次检索`,
          depth: 1,
          detail: [
            {
              label: "原始查询",
              kind: "text",
              data: value.original,
            },
            {
              label: "改写后查询",
              kind: "text",
              data: value.query,
            },
            {
              label: "扩展词",
              kind: "text",
              data: value.expansions.length ? value.expansions.join(" / ") : "—",
            },
          ],
        });
      } else if (value.type === "recall") {
        const maxBm25 = Math.max(...value.bm25Top.map((hit) => hit.bm25), 0.01);
        const maxVector = Math.max(...value.vectorTop.map((hit) => hit.vector), 0.01);
        addStep({
          title: "多路召回",
          subtitle: "BM25 + 字符 n-gram 伪向量",
          status: "done",
          meta: `${value.bm25Top.length} + ${value.vectorTop.length} 条 → 去重 ${value.candidateCount} 条`,
          depth: 1,
          detail: [
            {
              label: "BM25 召回",
              kind: "scores",
              data: value.bm25Top.map((hit) => ({
                label: `${hit.ticket.id} ${hit.ticket.title}`,
                value: Number(hit.bm25.toFixed(2)),
                max: maxBm25,
                note: "BM25",
              })),
            },
            {
              label: "向量召回",
              kind: "scores",
              data: value.vectorTop.map((hit) => ({
                label: `${hit.ticket.id} ${hit.ticket.title}`,
                value: Number(hit.vector.toFixed(3)),
                max: maxVector,
                note: "cosine",
              })),
            },
          ],
        });
      } else if (value.type === "rerank") {
        addStep({
          title: "Rerank 重排",
          subtitle: "融合标题命中 / 标签 / 时效",
          status: "done",
          meta: `top5 · top1 ${value.hits[0]?.rerank.toFixed(2) ?? "—"}`,
          depth: 1,
          detail: [
            {
              label: "重排得分",
              kind: "scores",
              data: value.hits.map((hit) => ({
                label: `${hit.ticket.id} ${hit.ticket.title}`,
                value: hit.rerank,
                max: 1,
                note: hit.ticket.status,
              })),
            },
          ],
        });
      } else if (value.type === "quality") {
        addStep({
          title: "质量判定",
          subtitle: value.passed ? "通过 · 进入答案生成" : "未达标 · 回退改写",
          status: value.passed ? "done" : "retry",
          meta: `相关度 ${value.score.toFixed(2)} · 阈值 0.55`,
          depth: 1,
          detail: [
            {
              label: "判定结果",
              kind: "kv",
              data: [
                ["top1 相关度", value.score.toFixed(3)],
                ["阈值", "0.550"],
                ["证据词", value.evidence.join(" / ") || "—"],
                ["覆盖率", `${Math.round(value.coverage * 100)}%`],
                ["结论", value.passed ? "通过" : "回退 Query 改写"],
              ],
            },
            { label: "判定理由", kind: "text", data: value.reason },
          ],
        });
      }
    }

    if (!alive(runId) || !outcome) return;
    updateStep(parentId, {
      status: outcome.passed ? "done" : "retry",
      meta: `${outcome.attempts} 次检索 · top1 ${outcome.quality.toFixed(2)}`,
    });

    if (outcome.passed) {
      addStep({
        title: "答案生成",
        subtitle: "引用历史工单生成",
        status: "done",
        meta: `引用 ${Math.min(3, outcome.hits.length)} 条`,
        depth: 1,
        detail: [{ label: "回答", kind: "text", data: outcome.answer }],
      });
      pushMessage({
        kind: "rag-answer",
        query,
        hits: outcome.hits.slice(0, 3),
        answer: outcome.answer,
        attempts: outcome.attempts,
        quality: outcome.quality,
      });
      return;
    }

    addStep({
      title: "答案生成",
      subtitle: "质量不达标，不生成答案",
      status: "skipped",
      meta: `已重试 ${MAX_RETRIES} 次`,
      depth: 1,
      detail: [{ label: "质量判定结论", kind: "text", data: outcome.reason }],
    });

    if (role === "support") {
      pushMessage({
        kind: "assistant-text",
        tone: "warn",
        text: `已重试 ${MAX_RETRIES} 次，仍没有足够可靠的方案。${outcome.reason}。为避免误导，我不会直接给出答案，建议创建新工单由人工跟进。`,
        mock: true,
      });
      openCreateForm(
        {
          title: query.slice(0, 40),
          description: query,
        },
        "补充一下现场信息，我帮你把工单创建出来：",
      );
    } else {
      pushMessage({
        kind: "assistant-text",
        tone: "warn",
        text: `历史工单中没有检索到足够可靠的方案（${outcome.reason}）。可以补充具体报错码、系统名称或换个关键词，我再试一次。`,
        mock: true,
      });
    }
  };

  const runAction = async (intent: IntentResult, text: string, runId: number) => {
    const checks = validateAction(intent, ticketsRef.current);
    const validationId = addValidationStep(checks);
    await sleep(320);
    if (!alive(runId)) return;

    if (checks.some((check) => !check.ok)) {
      updateStep(validationId, { status: "error" });
      const failed = checks.filter((check) => !check.ok).map((check) => check.message);
      pushMessage({
        kind: "assistant-text",
        tone: "warn",
        text: `参数校验未通过：${failed.join("；")}。请修正后重试。`,
        mock: true,
      });
      return;
    }

    if (intent.action === "create_ticket") {
      pushMessage({
        kind: "assistant-text",
        text: "创建工单前需要先补齐现场信息，避免工单来回流转：",
        mock: true,
      });
      openCreateForm({});
      return;
    }

    if (intent.action === "query_my_tickets") {
      const range = parseRange(text);
      const subset = filterByRange(ticketsRef.current, range, "我");
      const toolId = addStep({
        title: "工具调用 query_my_tickets",
        subtitle: "调用工单业务接口",
        status: "running",
        meta: "owner = 我",
        detail: [
          {
            label: "调用参数",
            kind: "json",
            data: {
              owner: "我",
              time_range: range?.label ?? "全部",
              order_by: "updated_at desc",
            },
          },
        ],
      });
      await sleep(620);
      if (!alive(runId)) return;
      updateStep(toolId, {
        status: "done",
        meta: `返回 ${subset.length} 条`,
        detail: [
          {
            label: "调用参数",
            kind: "json",
            data: {
              owner: "我",
              time_range: range?.label ?? "全部",
              order_by: "updated_at desc",
            },
          },
          {
            label: "工具原始结果",
            kind: "text",
            data: `Redis 缓存 key: tool:query_my_tickets:${range?.key ?? "all"} · ${subset.length} 条记录已写入上下文摘要`,
          },
        ],
      });
      pushMessage({
        kind: "ticket-table",
        title:
          subset.length === 0
            ? "没有找到匹配的工单"
            : `我的工单 · ${range?.label ?? "全部"}（${subset.length} 条）`,
        note: "按更新时间倒序 · 原始结果已缓存至 Redis，仅注入当前步骤所需字段",
        tickets: subset.slice(0, 6),
      });
      return;
    }

    if (intent.action === "transfer_ticket") {
      const ticketId = intent.params.ticket_id!;
      const assignee = intent.params.assignee!;
      const ticket = ticketsRef.current.find((item) => item.id === ticketId)!;
      const toolId = addStep({
        title: "工具调用 transfer_ticket",
        subtitle: "工单流转 + 钉钉通知",
        status: "running",
        meta: "Pydantic 校验通过",
        detail: [
          {
            label: "调用参数",
            kind: "json",
            data: { ticket_id: ticketId, from: ticket.assignee, to: assignee },
          },
        ],
      });
      await sleep(680);
      if (!alive(runId)) return;
      mutateTickets((prev) =>
        prev.map((item) =>
          item.id === ticketId
            ? { ...item, assignee, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      updateStep(toolId, {
        status: "done",
        meta: "转交成功",
        detail: [
          {
            label: "工具返回",
            kind: "json",
            data: {
              ticket_id: ticketId,
              previous_assignee: ticket.assignee,
              assignee,
              dingtalk_notify: "sent (mock)",
            },
          },
        ],
      });
      pushMessage({
        kind: "action-result",
        title: "工单转交成功",
        tone: "ok",
        lines: [
          `工单：${ticketId} ${ticket.title}`,
          `原负责人：${ticket.assignee} → 新负责人：${assignee}`,
          "通知：钉钉工作通知已发送（mock）",
          "状态：处理中，保留原处理记录",
        ],
      });
      return;
    }

    if (intent.action === "close_ticket") {
      const ticketId = intent.params.ticket_id!;
      const reason = intent.params.close_reason ?? "已完成处理";
      const ticket = ticketsRef.current.find((item) => item.id === ticketId)!;
      const toolId = addStep({
        title: "工具调用 close_ticket",
        subtitle: "完结工单并写入处理记录",
        status: "running",
        meta: "Pydantic 校验通过",
        detail: [
          {
            label: "调用参数",
            kind: "json",
            data: { ticket_id: ticketId, reason },
          },
        ],
      });
      await sleep(620);
      if (!alive(runId)) return;
      mutateTickets((prev) =>
        prev.map((item) =>
          item.id === ticketId
            ? { ...item, status: "已完成", updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      updateStep(toolId, {
        status: "done",
        meta: "已完结",
        detail: [
          {
            label: "工具返回",
            kind: "json",
            data: { ticket_id: ticketId, status: "已完成", reason, closed_at: new Date().toISOString() },
          },
        ],
      });
      pushMessage({
        kind: "action-result",
        title: "工单已完结",
        tone: "ok",
        lines: [
          `工单：${ticketId} ${ticket.title}`,
          `完结原因：${reason}`,
          "处理记录已归档，复盘任务可随时调用",
        ],
      });
      return;
    }

    if (intent.action === "triage_tickets") {
      const range = parseRange(text) ?? defaultRecentRange();
      const statusOrder: Record<Ticket["status"], number> = { 待处理: 0, 处理中: 1, 已完成: 2 };
      const candidates = filterByRange(ticketsRef.current, range, "我")
        .filter((ticket) => ticket.status !== "已完成")
        .sort(
          (a, b) =>
            statusOrder[a.status] - statusOrder[b.status] ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

      addStep({
        title: "任务规划",
        subtitle: "多工具依赖链 · 代码编排",
        status: "done",
        meta: `${candidates.length} 条候选`,
        detail: [
          {
            label: "执行计划（DAG）",
            kind: "json",
            data: [
              {
                step: 1,
                tool: "query_my_tickets",
                depends_on: null,
                params: { owner: "我", range: range.label, status: ["待处理", "处理中"] },
              },
              { step: 2, tool: "get_ticket_detail", depends_on: "step1.ticket_ids" },
              { step: 3, tool: "llm.triage_decision", depends_on: "step2.details" },
              { step: 4, tool: "transfer_ticket", depends_on: "step3.ticket_id" },
              { step: 5, tool: "create_followup", depends_on: "step4.ok" },
              { step: 6, tool: "summarize", depends_on: "step2..step5" },
            ],
          },
        ],
      });

      const queryParams = {
        owner: "我",
        time_range: range.label,
        status: ["待处理", "处理中"],
        order_by: "priority asc, updated_at desc",
      };
      const queryStepId = addStep({
        title: "工具调用 query_my_tickets",
        subtitle: "依赖：无 · 链路入口",
        status: "running",
        meta: "owner = 我 · 未完成",
        detail: [{ label: "调用参数", kind: "json", data: queryParams }],
      });
      await sleep(720);
      if (!alive(runId)) return;
      updateStep(queryStepId, {
        status: "done",
        meta: `返回 ${candidates.length} 条`,
        detail: [
          { label: "调用参数", kind: "json", data: queryParams },
          {
            label: "工具返回",
            kind: "json",
            data: candidates.map((ticket) => ({
              ticket_id: ticket.id,
              title: ticket.title,
              status: ticket.status,
              priority: ticket.priority,
              updated_at: ticket.updatedAt,
            })),
          },
        ],
      });

      if (candidates.length === 0) {
        pushMessage({
          kind: "assistant-text",
          text: `「${range.label}」没有未完成的个人工单，不需要推进。`,
          mock: true,
        });
        return;
      }

      pushMessage({
        kind: "assistant-text",
        text: `找到 ${candidates.length} 条未完成工单，正在按依赖顺序补全详情、生成处置建议并执行转交与提醒…`,
        mock: true,
      });

      const focusTickets = candidates.slice(0, 2);
      type TicketDetail = {
        ticket_id: string;
        title: string;
        status: string;
        priority: string;
        assignee: string;
        system: string;
        days_since_update: number;
        sla_hours: number;
      };
      const detailMap: Record<string, TicketDetail> = {};

      for (const ticket of focusTickets) {
        const detailParams = { ticket_id: ticket.id, source: "query_my_tickets.results" };
        const detailStepId = addStep({
          title: "工具调用 get_ticket_detail",
          subtitle: `依赖 query_my_tickets 的 ${ticket.id}`,
          status: "running",
          meta: `ticket_id=${ticket.id}`,
          detail: [{ label: "调用参数", kind: "json", data: detailParams }],
        });
        await sleep(680);
        if (!alive(runId)) return;
        const days = Math.max(
          1,
          Math.round((Date.now() - new Date(ticket.updatedAt).getTime()) / 86400000),
        );
        const detail: TicketDetail = {
          ticket_id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          assignee: ticket.assignee,
          system: ticket.system,
          days_since_update: days,
          sla_hours: ticket.priority === "P1" ? 4 : 24,
        };
        detailMap[ticket.id] = detail;
        updateStep(detailStepId, {
          status: "done",
          meta: "上下文已裁剪",
          detail: [
            { label: "调用参数", kind: "json", data: detailParams },
            { label: "工具返回", kind: "json", data: detail },
          ],
        });
      }

      const judgeStepId = addStep({
        title: "语义判断 · 处置建议",
        subtitle: "LLM 辅助 (mock) · 依赖详情结果",
        status: "running",
        meta: `${focusTickets.length} 条详情`,
      });
      await sleep(520);
      if (!alive(runId)) return;

      const target = focusTickets.find((ticket) => ticket.status === "待处理") ?? focusTickets[0];
      const targetDetail = detailMap[target.id];
      const decision = {
        ticket_id: target.id,
        action: "transfer",
        assignee: "周航",
        reason: `已 ${targetDetail.days_since_update} 天未更新，${target.priority} 且影响 ${targetDetail.system}`,
        followup_after_hours: 24,
      };
      updateStep(judgeStepId, {
        status: "done",
        meta: `${target.id} 需转交`,
        detail: [
          { label: "判断依据", kind: "json", data: detailMap },
          { label: "处置决策", kind: "json", data: decision },
        ],
      });

      const transferParams = {
        ticket_id: decision.ticket_id,
        assignee: decision.assignee,
        reason: decision.reason,
      };
      const transferStepId = addStep({
        title: "工具调用 transfer_ticket",
        subtitle: `依赖 处置决策.ticket_id=${target.id}`,
        status: "running",
        meta: "入参来自前序节点",
        detail: [{ label: "调用参数", kind: "json", data: transferParams }],
      });
      await sleep(760);
      if (!alive(runId)) return;
      mutateTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === target.id
            ? { ...ticket, assignee: decision.assignee, updatedAt: new Date().toISOString() }
            : ticket,
        ),
      );
      updateStep(transferStepId, {
        status: "done",
        meta: `${target.id} → ${decision.assignee}`,
        detail: [
          { label: "调用参数", kind: "json", data: transferParams },
          {
            label: "工具返回",
            kind: "json",
            data: {
              ok: true,
              previous_assignee: target.assignee,
              assignee: decision.assignee,
              dingtalk_notify: "sent (mock)",
            },
          },
        ],
      });

      const followupId = `follow_${Math.random().toString(36).slice(2, 8)}`;
      const followupStepId = addStep({
        title: "工具调用 create_followup",
        subtitle: `依赖 transfer_ticket.ok=${target.id}`,
        status: "running",
        meta: "钉钉待办",
      });
      await sleep(700);
      if (!alive(runId)) return;
      updateStep(followupStepId, {
        status: "done",
        meta: "24 小时后提醒",
        detail: [
          {
            label: "调用参数",
            kind: "json",
            data: {
              ticket_id: target.id,
              assignee: decision.assignee,
              due: "24h",
              channel: "dingtalk",
            },
          },
          { label: "工具返回", kind: "json", data: { task_id: followupId, status: "created" } },
        ],
      });

      addStep({
        title: "汇总结果",
        subtitle: "依赖全链路输出",
        status: "done",
        meta: "编排完成",
      });

      pushMessage({
        kind: "workflow-summary",
        title: `遗留工单推进完成 · ${range.label}`,
        note: `候选 ${candidates.length} 条，补全 ${focusTickets.length} 条详情；其余工单保持原负责人跟进。`,
        steps: [
          {
            tool: "query_my_tickets",
            label: "查询未完成工单",
            result: `返回 ${candidates.length} 条：${candidates.map((ticket) => ticket.id).join("、")}`,
          },
          {
            tool: "get_ticket_detail",
            label: "补全工单详情",
            dependsOn: "query_my_tickets.ticket_ids",
            result: `${focusTickets.map((ticket) => ticket.id).join("、")} 详情已裁剪进上下文`,
          },
          {
            tool: "llm.triage_decision",
            label: "判断优先级与处置方式",
            dependsOn: "get_ticket_detail.details",
            result: `${target.id} 超时风险最高，建议转交`,
          },
          {
            tool: "transfer_ticket",
            label: "执行转交",
            dependsOn: "triage_decision.ticket_id",
            result: `${target.id} → ${decision.assignee}`,
          },
          {
            tool: "create_followup",
            label: "创建跟进提醒",
            dependsOn: "transfer_ticket.ok",
            result: `钉钉待办 · 24 小时后提醒（${followupId}）`,
          },
        ],
      });
      return;
    }

    if (intent.action === "review_tickets_async") {
      const range = parseRange(text) ?? defaultRecentRange();
      const subset = filterByRange(ticketsRef.current, range, "我");
      const jobId = `job_${Math.random().toString(36).slice(2, 8)}`;
      const worker = "celery@review-worker-2";
      const summary = buildReviewSummary(subset, range.label);

      addStep({
        title: "任务发起",
        subtitle: "Celery + MQ 异步任务",
        status: "done",
        meta: "已入队",
        detail: [
          {
            label: "任务载荷",
            kind: "json",
            data: {
              job_id: jobId,
              queue: "agent.review",
              task: "review_tickets",
              params: { owner: "我", range: range.label, count: subset.length },
            },
          },
        ],
      });

      pushMessage({
        kind: "async-review",
        jobId,
        worker,
        rangeLabel: range.label,
        tickets: subset,
        summary,
      });

      const workerStepId = addStep({
        title: "Worker 执行",
        subtitle: worker,
        status: "running",
        meta: "独立进程",
      });

      for (const [index, title] of ["查询工单数据", "汇总处理记录", "分析生成建议"].entries()) {
        const childId = addStep({ title, subtitle: "后台任务子步骤", status: "running", depth: 1 });
        await sleep(520 + index * 120);
        if (!alive(runId)) return;
        updateStep(childId, {
          status: "done",
          meta:
            index === 0
              ? `${subset.length} 条`
              : index === 1
                ? "按状态与类别聚合"
                : "生成复盘摘要",
        });
      }
      updateStep(workerStepId, { status: "done", meta: `处理 ${subset.length} 条工单` });

      const pollStepId = addStep({
        title: "状态轮询",
        subtitle: "Agent 仅发起任务与查询状态",
        status: "running",
        meta: "第 1/3 次 · RUNNING",
      });
      for (const [index, status] of ["PENDING", "RUNNING", "SUCCESS"].entries()) {
        await sleep(620);
        if (!alive(runId)) return;
        updateStep(pollStepId, { meta: `第 ${index + 1}/3 次 · ${status}` });
      }
      updateStep(pollStepId, { status: "done", meta: "3/3 次 · SUCCESS" });

      addStep({
        title: "结果回填",
        subtitle: "异步任务结果注入对话",
        status: "done",
        meta: `job ${jobId}`,
        detail: [{ label: "复盘摘要", kind: "text", data: summary }],
      });
      return;
    }
  };

  const handleTurn = async (text: string, runId: number) => {
    const pending = pendingRef.current;
    if (pending) {
      const merged = { ...pending.params };
      const ticketId = extractTicketId(text);
      if (ticketId) merged.ticket_id = ticketId;
      if (pending.action === "transfer_ticket") {
        const assignee = extractAssignee(text);
        if (assignee) merged.assignee = assignee;
      }
      if (pending.action === "close_ticket") {
        const closeReason = extractCloseReason(text);
        if (closeReason) merged.close_reason = closeReason;
      }
      const stillMissing =
        (pending.action === "transfer_ticket" && (!merged.ticket_id || !merged.assignee)) ||
        (pending.action === "close_ticket" && !merged.ticket_id);

      if (!stillMissing) {
        pendingRef.current = null;
        const intent: IntentResult = {
          intent: "single_tool",
          action: pending.action,
          confidence: 0.95,
          method: "regex",
          reason: "沿用上一轮动作，本轮补齐参数后继续执行",
          params: merged,
          missing: [],
        };
        addIntentStep(intent, "沿用上下文");
        await runAction(intent, text, runId);
        return;
      }

      pendingRef.current = { action: pending.action, params: merged };
      const intent: IntentResult = {
        intent: "clarify",
        action: pending.action,
        confidence: 0.9,
        method: "regex",
        reason: "沿用上一轮动作，但参数仍未补齐",
        params: merged,
        missing: pending.action === "transfer_ticket" ? ["ticket_id", "assignee"] : ["ticket_id"],
      };
      addIntentStep(intent, "沿用上下文");
      addValidationStep(validateAction(intent, ticketsRef.current), "缺失参数检查");
      pushMessage({
        kind: "assistant-text",
        tone: "warn",
        text:
          pending.action === "transfer_ticket"
            ? "还差工单编号或接收人。请补充，例如：“把 TK-1042 转交给张工”。"
            : "还差工单编号。请补充，例如：“完结 TK-1031，原因是已修复”。",
        mock: true,
      });
      return;
    }

    const intent = routeIntent(text, role, ticketsRef.current);
    if (intent.intent === "knowledge_search") intent.params.query = text;
    addIntentStep(intent);

    if (intent.intent === "out_of_scope") {
      addStep({
        title: "范围判定",
        subtitle: "拒绝执行 · 不调用任何工具",
        status: "done",
        meta: "out_of_scope",
      });
      const message = intent.action
        ? `「${TOOL_LABELS[intent.action].split(" · ")[0]}」在技术支持视角下不可用。切换到顶部「研发」标签即可体验。`
        : "这看起来不属于工单业务范围。我可以帮你检索历史处理经验、查询 / 转交 / 完结工单，或创建新工单。";
      pushMessage({ kind: "assistant-text", text: message, tone: "warn", mock: true });
      return;
    }

    if (intent.intent === "clarify") {
      if (intent.action === "transfer_ticket" || intent.action === "close_ticket") {
        pendingRef.current = { action: intent.action, params: intent.params };
      }
      addValidationStep(validateAction(intent, ticketsRef.current), "缺失参数检查");
      const missing = intent.missing;
      let message = "我还不太确定你的目标。可以试试：查询历史处理经验、查我的工单、转交 / 完结工单，或创建新工单。";
      if (intent.action === "transfer_ticket") {
        message =
          missing.includes("assignee") && !missing.includes("ticket_id")
            ? "可以帮你转交。请告诉我接收人，例如：“转交给张工”。"
            : "可以帮你转交工单。请补充工单编号和接收人，例如：“把 TK-1042 转交给张工”。";
      } else if (intent.action === "close_ticket") {
        message = "可以帮你完结工单。请补充工单编号，例如：“完结 TK-1031，原因是已修复”。";
      }
      pushMessage({ kind: "assistant-text", text: message, tone: "warn", mock: true });
      return;
    }

    if (intent.intent === "knowledge_search") {
      await runRagFlow(text, runId);
      return;
    }

    if (intent.action) {
      await runAction(intent, text, runId);
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;
    const runId = beginRun();
    pushMessage({ kind: "user", text });
    try {
      await handleTurn(text, runId);
    } finally {
      endRun(runId);
    }
  };

  const submitForm = async (values: NewTicketInput) => {
    if (busyRef.current) return;
    const runId = beginRun();
    pushMessage({
      kind: "user",
      text: `提交工单：${values.title}（${values.system} · ${values.priority}）`,
    });
    try {
      const checks: ValidationCheck[] = [
        {
          field: "title",
          ok: values.title.trim().length >= 6,
          message: values.title.trim().length >= 6 ? "标题长度合规" : "标题不少于 6 个字",
          input: values.title,
        },
        {
          field: "system",
          ok: Boolean(values.system),
          message: values.system ? "系统 / 设备已选择" : "缺少系统 / 设备",
          input: values.system,
        },
        {
          field: "impact",
          ok: Boolean(values.impact),
          message: values.impact ? "影响范围已选择" : "缺少影响范围",
          input: values.impact,
        },
        {
          field: "occurred_at",
          ok: Boolean(values.occurredAt) && !Number.isNaN(Date.parse(values.occurredAt)),
          message: "出现时间格式有效",
          input: values.occurredAt,
        },
        {
          field: "description",
          ok: values.description.trim().length >= 10,
          message:
            values.description.trim().length >= 10 ? "现象描述完整" : "现象描述不少于 10 个字",
          input: values.description,
        },
      ];
      addValidationStep(checks, "表单字段 · Pydantic 结构化校验");
      await sleep(320);
      if (!alive(runId)) return;
      if (checks.some((check) => !check.ok)) {
        pushMessage({
          kind: "assistant-text",
          tone: "warn",
          text: "表单校验未通过，请完善必填项后再提交。",
          mock: true,
        });
        return;
      }

      const toolId = addStep({
        title: "工具调用 create_ticket",
        subtitle: "写入工单业务系统",
        status: "running",
        meta: "校验通过",
        detail: [{ label: "调用参数", kind: "json", data: values }],
      });
      await sleep(680);
      if (!alive(runId)) return;

      const now = new Date().toISOString();
      const ticket: Ticket = {
        id: `TK-${ticketSeq.current++}`,
        title: values.title.trim(),
        system: values.system,
        category: values.system,
        tags: [values.system, values.impact],
        requester: "我",
        description: values.description.trim(),
        symptoms: values.description.trim(),
        rootCause: "待定位",
        solution: [],
        status: "待处理",
        priority: values.priority,
        owner: "我",
        assignee: "技术支持组",
        createdAt: now,
        updatedAt: now,
        effortHours: 0,
      };
      mutateTickets((prev) => [ticket, ...prev]);
      updateStep(toolId, {
        status: "done",
        meta: `已创建 ${ticket.id}`,
        detail: [
          { label: "调用参数", kind: "json", data: values },
          { label: "工具返回", kind: "json", data: ticket },
        ],
      });
      pushMessage({ kind: "created", ticket });
    } finally {
      endRun(runId);
    }
  };

  const quickCreate = (prefill: Partial<NewTicketInput>) => {
    if (busyRef.current) return;
    openCreateForm(prefill);
  };

  const reset = () => {
    runIdRef.current += 1;
    busyRef.current = false;
    pendingRef.current = null;
    ticketsRef.current = INITIAL_TICKETS;
    setTickets(INITIAL_TICKETS);
    setMessages([]);
    setSteps([]);
    setBusy(false);
  };

  return { tickets, messages, steps, busy, send, submitForm, quickCreate, reset };
}
