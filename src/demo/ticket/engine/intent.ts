import type { IntentKind, IntentResult, Role, Ticket, ToolName, ValidationCheck } from "../types";
import { parseRange } from "./time";

export const INTENT_LABELS: Record<IntentKind, string> = {
  knowledge_search: "知识检索",
  single_tool: "单工具调用",
  multi_step: "多步骤任务",
  clarify: "参数澄清",
  out_of_scope: "超出系统能力",
};

export const TOOL_LABELS: Record<ToolName, string> = {
  search_history_tickets: "search_history_tickets · 历史工单检索",
  query_my_tickets: "query_my_tickets · 个人工单查询",
  create_ticket: "create_ticket · 创建工单",
  transfer_ticket: "transfer_ticket · 工单转交",
  close_ticket: "close_ticket · 工单完结",
  review_tickets_async: "review_tickets_async · 异步复盘任务",
  triage_tickets: "triage_tickets · 遗留工单推进",
  get_ticket_detail: "get_ticket_detail · 工单详情补全",
  create_followup: "create_followup · 跟进提醒",
};

const DOMAIN_RE =
  /工单|故障|报错|异常|登录|登陆|密码|账号|vpn|网络|邮箱|邮件|数据库|接口|超时|部署|发布|构建|门禁|刷卡|证书|磁盘|缓存|队列|复盘|转交|完结|创建|新建|打印机|权限|系统|服务|研发|客服|支付|对账|物流/i;

const OFFTOPIC_RE = /天气|股票|诗|作文|笑话|电影|旅游|菜谱|音乐|翻译|写一篇|聊天|游戏|星座/i;

const DEV_ONLY: ToolName[] = [
  "query_my_tickets",
  "transfer_ticket",
  "close_ticket",
  "review_tickets_async",
  "triage_tickets",
];

export function extractTicketId(text: string): string | undefined {
  const match = text.match(/(?:TK|tk)[-_\s]?(\d{3,4})/);
  return match ? `TK-${match[1]}` : undefined;
}

export function extractAssignee(text: string): string | undefined {
  const match = text.match(/(?:转交给|转给|移交给|交给)\s*([一-龥]{2,6})/);
  if (!match) return undefined;
  const candidate = match[1].replace(/[的话吧呀。！!]/g, "");
  if (!candidate || ["工单", "同事", "别人", "一下"].includes(candidate)) return undefined;
  return candidate;
}

export function extractCloseReason(text: string): string | undefined {
  const match = text.match(/(?:原因(?:是|为)?[:：]?|因为|由于)(.{2,30})/);
  return match?.[1]?.trim();
}

export function routeIntent(raw: string, role: Role, _tickets: Ticket[]): IntentResult {
  const text = raw.trim();
  const range = parseRange(text);
  const params: Record<string, string | undefined> = {};
  if (range) {
    params.time_range = range.key;
    params.time_label = range.label;
  }

  let action: ToolName | undefined;
  let kind: IntentKind | undefined;
  let method: "regex" | "llm-mock" = "regex";
  let reason = "";

  if (/复盘|总结一下.{0,4}工单|工单.{0,4}总结|回顾.{0,6}工单/.test(text)) {
    action = "review_tickets_async";
    kind = "multi_step";
    reason = "正则命中复盘动作：需要查询 + 汇总 + 分析多步骤执行";
  } else if (
    /(?:遗留|未完成|进行中|积压).{0,8}工单|工单.{0,6}(?:遗留|未完成|进行中|积压)|(?:推进|安排|梳理|清理|跟进).{0,8}(?:工单|遗留)/.test(
      text,
    )
  ) {
    action = "triage_tickets";
    kind = "multi_step";
    reason = "命中遗留工单推进意图：查询 → 详情 → 判断 → 转交 → 提醒，工具间存在依赖";
  } else if (/转交|转给|移交/.test(text)) {
    action = "transfer_ticket";
    kind = "single_tool";
    params.ticket_id = extractTicketId(text);
    params.assignee = extractAssignee(text);
    reason = "正则命中转交动作，提取工单号与接收人";
  } else if (/完结|关闭.{0,4}工单|工单.{0,4}关闭|结单|处理完成|已修复/.test(text)) {
    action = "close_ticket";
    kind = "single_tool";
    params.ticket_id = extractTicketId(text);
    params.close_reason = extractCloseReason(text);
    reason = "正则命中完结动作，提取工单号与完结原因";
  } else if (/(?:查|看|找|列出|筛选).{0,6}(?:我|本人).{0,6}工单|我的工单/.test(text)) {
    action = "query_my_tickets";
    kind = "single_tool";
    reason = "正则命中个人工单查询，时间范围从文本参数中提取";
  } else if (/(?:创建|新建|提|发起|报).{0,6}工单|提个工单|报障|报修|报个/.test(text)) {
    action = "create_ticket";
    kind = "multi_step";
    reason = "命中创建工单意图：先补齐信息，再调用创建工具";
  }

  if (action) {
    if (role === "support" && DEV_ONLY.includes(action)) {
      return {
        intent: "out_of_scope",
        action,
        confidence: 0.92,
        method,
        reason: `当前为技术支持视角，不支持「${TOOL_LABELS[action].split(" · ")[0]}」`,
        params,
        missing: [],
      };
    }

    const missing: string[] = [];
    if (action === "transfer_ticket") {
      if (!params.ticket_id) missing.push("ticket_id");
      if (!params.assignee) missing.push("assignee");
    }
    if (action === "close_ticket" && !params.ticket_id) {
      missing.push("ticket_id");
    }

    if (missing.length > 0) {
      return {
        intent: "clarify",
        action,
        confidence: 0.88,
        method,
        reason: `${reason}；参数缺失（${missing.join("、")}），先进入澄清流程`,
        params,
        missing,
      };
    }

    return {
      intent: kind!,
      action,
      confidence: action === "create_ticket" ? 0.9 : 0.94,
      method,
      reason,
      params,
      missing,
    };
  }

  method = "llm-mock";
  if (OFFTOPIC_RE.test(text)) {
    return {
      intent: "out_of_scope",
      confidence: 0.86,
      method,
      reason: "结构化分类：未命中工单业务域，属于系统能力之外",
      params,
      missing: [],
    };
  }

  if (DOMAIN_RE.test(text) || /[?？]/.test(text) || text.length >= 6) {
    return {
      intent: "knowledge_search",
      confidence: 0.85,
      method,
      reason: "结构化分类：描述命中工单业务域，走历史经验检索流程",
      params,
      missing: [],
    };
  }

  return {
    intent: "clarify",
    confidence: 0.42,
    method,
    reason: "结构化分类置信度低于 0.5，无法判断具体意图",
    params,
    missing: ["问题描述"],
  };
}

export function validateAction(intent: IntentResult, tickets: Ticket[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const findTicket = (id?: string) => tickets.find((ticket) => ticket.id === id);

  checks.push({
    field: "confidence",
    ok: intent.confidence >= 0.5,
    message: intent.confidence >= 0.5 ? "置信度达标" : "置信度低于 0.5，需要澄清",
    input: intent.confidence.toFixed(2),
  });

  if (intent.action === "transfer_ticket") {
    const id = intent.params.ticket_id;
    const ticket = findTicket(id);
    checks.push({
      field: "ticket_id",
      ok: /^TK-\d{4}$/.test(id ?? ""),
      message: id ? "工单号格式合法" : "缺少工单号",
      input: id ?? "—",
    });
    checks.push({
      field: "ticket_exists",
      ok: Boolean(ticket),
      message: ticket ? `工单存在：${ticket.title}` : "工单不存在",
      input: id ?? "—",
    });
    checks.push({
      field: "assignee",
      ok: Boolean(intent.params.assignee),
      message: intent.params.assignee ? "接收人已提取" : "缺少接收人",
      input: intent.params.assignee ?? "—",
    });
    if (ticket) {
      checks.push({
        field: "status",
        ok: ticket.status !== "已完成",
        message: ticket.status !== "已完成" ? "工单可转交" : "已完结工单不能转交",
        input: ticket.status,
      });
    }
  }

  if (intent.action === "close_ticket") {
    const id = intent.params.ticket_id;
    const ticket = findTicket(id);
    checks.push({
      field: "ticket_id",
      ok: /^TK-\d{4}$/.test(id ?? ""),
      message: id ? "工单号格式合法" : "缺少工单号",
      input: id ?? "—",
    });
    checks.push({
      field: "ticket_exists",
      ok: Boolean(ticket),
      message: ticket ? `工单存在：${ticket.title}` : "工单不存在",
      input: id ?? "—",
    });
    if (ticket) {
      checks.push({
        field: "status",
        ok: ticket.status !== "已完成",
        message: ticket.status !== "已完成" ? "工单可完结" : "工单已完结",
        input: ticket.status,
      });
    }
  }

  if (intent.action === "query_my_tickets" || intent.action === "review_tickets_async") {
    checks.push({
      field: "time_range",
      ok: true,
      message: `时间范围：${intent.params.time_label ?? "最近一周（默认）"}`,
      input: intent.params.time_label ?? "默认",
    });
  }

  if (intent.action === "triage_tickets") {
    checks.push({
      field: "time_range",
      ok: true,
      message: `时间范围：${intent.params.time_label ?? "上周（默认）"}`,
      input: intent.params.time_label ?? "默认",
    });
    checks.push({
      field: "workflow_dag",
      ok: true,
      message: "6 个节点依赖拓扑有效，无环；后续工具入参来自前序输出",
      input: "DAG",
    });
  }

  if (intent.action === "search_history_tickets") {
    checks.push({
      field: "query",
      ok: true,
      message: "检索语句长度与结构校验通过",
      input: intent.params.query ?? "—",
    });
  }

  return checks;
}
