export type Role = "support" | "dev";

export type TicketStatus = "已完成" | "处理中" | "待处理";

export type Priority = "P1" | "P2" | "P3";

export interface Ticket {
  id: string;
  title: string;
  system: string;
  category: string;
  tags: string[];
  requester: string;
  description: string;
  symptoms: string;
  rootCause: string;
  solution: string[];
  status: TicketStatus;
  priority: Priority;
  owner: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  effortHours: number;
}

export type IntentKind =
  | "knowledge_search"
  | "single_tool"
  | "multi_step"
  | "clarify"
  | "out_of_scope";

export type ToolName =
  | "search_history_tickets"
  | "query_my_tickets"
  | "create_ticket"
  | "transfer_ticket"
  | "close_ticket"
  | "review_tickets_async"
  | "triage_tickets"
  | "get_ticket_detail"
  | "create_followup";

export interface IntentResult {
  intent: IntentKind;
  action?: ToolName;
  confidence: number;
  method: "regex" | "llm-mock";
  reason: string;
  params: Record<string, string | undefined>;
  missing: string[];
}

export interface ValidationCheck {
  field: string;
  ok: boolean;
  message: string;
  input?: string;
}

export type DetailSection =
  | { label: string; kind: "json"; data: unknown }
  | { label: string; kind: "kv"; data: Array<[string, string]> }
  | { label: string; kind: "checks"; data: ValidationCheck[] }
  | { label: string; kind: "text"; data: string }
  | {
      label: string;
      kind: "scores";
      data: Array<{ label: string; value: number; max?: number; note?: string }>;
    };

export interface TraceStep {
  id: string;
  title: string;
  subtitle?: string;
  status: "running" | "done" | "retry" | "error" | "skipped";
  startedAt: number;
  durationMs?: number;
  meta?: string;
  depth?: number;
  detail?: DetailSection[];
}

export interface RagHit {
  ticket: Ticket;
  bm25: number;
  vector: number;
  fused: number;
  rerank: number;
}

export interface RagOutcome {
  query: string;
  rewrites: string[];
  attempts: number;
  hits: RagHit[];
  passed: boolean;
  quality: number;
  reason: string;
  answer: string;
}

export interface NewTicketInput {
  title: string;
  system: string;
  impact: string;
  occurredAt: string;
  description: string;
  priority: Priority;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ChatItemDraft = DistributiveOmit<ChatItem, "id">;

export type ChatItem =
  | { id: number; kind: "user"; text: string }
  | {
      id: number;
      kind: "assistant-text";
      text: string;
      mock?: boolean;
      tone?: "normal" | "warn";
    }
  | {
      id: number;
      kind: "rag-answer";
      query: string;
      hits: RagHit[];
      answer: string;
      attempts: number;
      quality: number;
    }
  | { id: number; kind: "ticket-table"; title: string; note?: string; tickets: Ticket[] }
  | { id: number; kind: "create-form"; prefill?: Partial<NewTicketInput>; hint?: string }
  | { id: number; kind: "created"; ticket: Ticket }
  | {
      id: number;
      kind: "action-result";
      title: string;
      lines: string[];
      tone?: "ok" | "warn";
    }
  | {
      id: number;
      kind: "async-review";
      jobId: string;
      worker: string;
      rangeLabel: string;
      tickets: Ticket[];
      summary: string;
    }
  | {
      id: number;
      kind: "workflow-summary";
      title: string;
      note?: string;
      steps: Array<{
        tool: string;
        label: string;
        dependsOn?: string;
        result: string;
      }>;
    };
