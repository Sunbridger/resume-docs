import type { RagHit, RagOutcome, Ticket } from "../types";
import { BM25Index, VectorIndex, squashBM25 } from "./bm25";
import { tokenize, tokenizeQuery } from "./tokenize";

export type RagStageEvent =
  | {
      type: "rewrite";
      attempt: number;
      original: string;
      query: string;
      expansions: string[];
    }
  | {
      type: "recall";
      attempt: number;
      bm25Top: RagHit[];
      vectorTop: RagHit[];
      candidateCount: number;
    }
  | { type: "rerank"; attempt: number; hits: RagHit[] }
  | {
      type: "quality";
      attempt: number;
      passed: boolean;
      score: number;
      threshold: number;
      evidence: string[];
      coverage: number;
      reason: string;
    }
  | { type: "answer"; outcome: RagOutcome };

export interface RagOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

const SYNONYM_RULES: Array<{ match: RegExp; words: string[] }> = [
  { match: /登录|登陆|密码|账号/, words: ["账号", "密码", "认证", "AD"] },
  { match: /vpn/i, words: ["远程接入", "证书", "客户端"] },
  { match: /邮件|邮箱/, words: ["投递", "反垃圾", "附件"] },
  { match: /打印/, words: ["驱动", "打印队列"] },
  { match: /门禁|刷卡/, words: ["权限", "通行", "控制器"] },
  { match: /网络|断网|连不上|连接/, words: ["连通性", "DNS", "网关"] },
  { match: /数据库|sql|主从/i, words: ["索引", "慢查询", "事务"] },
  { match: /超时|504|性能/, words: ["连接池", "慢查询", "并发"] },
  { match: /构建|ci|流水线/i, words: ["缓存", "依赖", "构建节点"] },
  { match: /证书|https/i, words: ["续签", "网关", "CA"] },
  { match: /队列|堆积|mq/i, words: ["消费者", "死信", "积压"] },
];

export function searchText(ticket: Ticket): string {
  return [
    ticket.title,
    ticket.system,
    ticket.category,
    ticket.tags.join(" "),
    ticket.description,
    ticket.symptoms,
    ticket.rootCause,
    ticket.solution.join(" "),
  ].join(" ");
}

export function rewriteQuery(
  raw: string,
  attempt: number,
): { query: string; expansions: string[] } {
  const cleaned = raw.replace(/[？?！!。，,；;]/g, " ").replace(/\s+/g, " ").trim();
  const expansions = new Set<string>();
  for (const rule of SYNONYM_RULES) {
    if (rule.match.test(raw)) {
      for (const word of rule.words) expansions.add(word);
    }
  }
  if (attempt >= 2) {
    ["同类故障", "处理方案", "历史工单", "排查步骤"].forEach((word) => expansions.add(word));
  }
  if (attempt >= 3) {
    ["知识库", "最佳实践", "根因分析"].forEach((word) => expansions.add(word));
  }
  return { query: `${cleaned} ${[...expansions].join(" ")}`.trim(), expansions: [...expansions] };
}

interface Candidate {
  index: number;
  bm25: number;
  vector: number;
  fused: number;
}

function daysBetween(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86400000);
}

function buildHits(
  tickets: Ticket[],
  candidates: Candidate[],
  queryTokens: string[],
): RagHit[] {
  return candidates.map((candidate) => {
    const ticket = tickets[candidate.index];
    const titleTokens = new Set(tokenize(ticket.title));
    const titleHits = queryTokens.filter((token) => titleTokens.has(token)).length;
    const titleOverlap = queryTokens.length ? Math.min(1, titleHits / queryTokens.length) : 0;
    const tagHit = ticket.tags.some((tag) =>
      queryTokens.some((token) => tag.toLowerCase().includes(token) || token.includes(tag.toLowerCase())),
    );
    const resolved = ticket.status === "已完成" ? 0.03 : 0;
    const recency = Math.exp(-daysBetween(ticket.updatedAt) / 120) * 0.02;
    const rerank = Math.min(
      1,
      candidate.fused * 0.72 + titleOverlap * 0.24 + (tagHit ? 0.03 : 0) + resolved + recency,
    );
    return {
      ticket,
      bm25: candidate.bm25,
      vector: candidate.vector,
      fused: candidate.fused,
      rerank: Number(rerank.toFixed(3)),
    };
  });
}

function fuse(bm25: number, vector: number): number {
  return bm25 * 0.62 + Math.min(1, vector * 2) * 0.38;
}

function buildAnswer(hit: RagHit, second: RagHit | undefined, query: string): string {
  const steps = hit.ticket.solution.map((step, i) => `${i + 1}. ${step}`).join("\n");
  const secondary =
    second && second.rerank >= hit.rerank * 0.82
      ? `\n\n相关的历史记录还有 **${second.ticket.id} ${second.ticket.title}**，可作为补充参考。`
      : "";
  return [
    `与「${query}」最接近的历史工单是 **${hit.ticket.id} ${hit.ticket.title}**（${hit.ticket.system}，相关度 ${hit.rerank.toFixed(2)}）。`,
    "",
    `**可能原因**：${hit.ticket.rootCause}`,
    "",
    "**处理方案**",
    steps,
    secondary,
  ]
    .join("\n")
    .trim();
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 多阶段检索工作流：改写 → 双路召回 → 融合重排 → 质量判定。
 * 质量不达标时回退改写节点，最多重试 maxRetries 次。
 */
export async function* runRag(
  rawQuery: string,
  tickets: Ticket[],
  options: RagOptions = {},
): AsyncGenerator<RagStageEvent, RagOutcome> {
  const wait = options.sleep ?? sleep;
  const maxRetries = options.maxRetries ?? 2;

  const documents = tickets.map(searchText);
  const bm25 = new BM25Index(documents);
  const vectorIndex = new VectorIndex(documents);
  const originalTokens = tokenizeQuery(rawQuery);

  const rewrites: string[] = [];
  let finalHits: RagHit[] = [];
  let quality = 0;
  let qualityReason = "";
  let passed = false;
  let attempt = 0;

  for (let retry = 0; retry <= maxRetries; retry += 1) {
    attempt = retry + 1;
    await wait(240);
    const { query, expansions } = rewriteQuery(rawQuery, attempt);
    rewrites.push(query);
    yield { type: "rewrite", attempt, original: rawQuery, query, expansions };

    await wait(380);
    const queryTokens = tokenizeQuery(query);
    const bm25Scores = bm25.score(queryTokens);
    const cosines = vectorIndex.cosine(queryTokens);

    const bm25Order = bm25Scores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .filter((item) => item.score > 0);
    const vectorOrder = cosines
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .filter((item) => item.score > 0.001);

    const all = new Map<number, Candidate>();
    for (const item of bm25Order) {
      all.set(item.index, {
        index: item.index,
        bm25: item.score,
        vector: cosines[item.index],
        fused: fuse(squashBM25(item.score), Math.max(0, cosines[item.index])),
      });
    }
    for (const item of vectorOrder) {
      if (!all.has(item.index)) {
        all.set(item.index, {
          index: item.index,
          bm25: bm25Scores[item.index],
          vector: item.score,
          fused: fuse(squashBM25(bm25Scores[item.index]), Math.max(0, item.score)),
        });
      }
    }

    const bm25Hits = buildHits(
      tickets,
      bm25Order.map((item) => all.get(item.index)!).slice(0, 5),
      queryTokens,
    ).sort((a, b) => b.bm25 - a.bm25);
    const vectorHits = buildHits(
      tickets,
      vectorOrder.map((item) => all.get(item.index)!).slice(0, 5),
      queryTokens,
    ).sort((a, b) => b.vector - a.vector);

    yield {
      type: "recall",
      attempt,
      bm25Top: bm25Hits,
      vectorTop: vectorHits,
      candidateCount: all.size,
    };

    await wait(220);
    const hits = buildHits(tickets, [...all.values()], queryTokens)
      .sort((a, b) => b.rerank - a.rerank)
      .slice(0, 5);
    finalHits = hits;
    yield { type: "rerank", attempt, hits };

    await wait(240);
    const top = hits[0];
    const topTokens = new Set(tokenize(searchText(top.ticket)));
    // 证据词只统计用户原始查询中的词，避免改写扩展词虚增覆盖率
    const evidence = originalTokens.filter((token) => token.length >= 2 && topTokens.has(token));
    const coverage = evidence.length / Math.max(1, originalTokens.length);
    const scorePass = top.rerank >= 0.55;
    const evidencePass = evidence.length >= 2 || coverage >= 0.25;
    quality = top.rerank;
    passed = scorePass && evidencePass;
    qualityReason = passed
      ? `top1 相关度 ${quality.toFixed(2)}，命中 ${evidence.length} 个原始查询证据词，可进入答案生成`
      : !scorePass
        ? `top1 相关度 ${quality.toFixed(2)} 低于阈值 0.55，回退 Query 改写`
        : `相关度达标，但证据覆盖不足（命中 ${evidence.length}/${originalTokens.length} 个原始查询词），不生成答案`;
    yield {
      type: "quality",
      attempt,
      passed,
      score: Number(quality.toFixed(3)),
      threshold: 0.55,
      evidence: evidence.slice(0, 6),
      coverage: Number(coverage.toFixed(2)),
      reason: qualityReason,
    };

    if (passed) break;
    if (retry < maxRetries) await wait(320);
  }

  await wait(320);
  const answer = passed
    ? buildAnswer(finalHits[0], finalHits[1], rawQuery)
    : "";
  const outcome: RagOutcome = {
    query: rawQuery,
    rewrites,
    attempts: attempt,
    hits: finalHits,
    passed,
    quality: Number(quality.toFixed(3)),
    reason: qualityReason,
    answer,
  };
  yield { type: "answer", outcome };
  return outcome;
}
