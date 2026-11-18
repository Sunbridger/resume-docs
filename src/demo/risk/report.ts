import type { RiskLevel } from "../../data/risks";

export interface RiskTag {
  id: string;
  level: RiskLevel;
  page: number;
  title: string;
  label?: string;
}

export type ReportSegment =
  | { type: "markdown"; text: string }
  | { type: "risk"; tag: RiskTag; body: string; complete: boolean };

function parseAttrs(source: string): RiskTag | null {
  const attrs: Record<string, string> = {};
  const pattern = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    attrs[match[1]] = match[2];
  }
  if (!attrs.id || !attrs.page) return null;
  const level = attrs.level === "high" || attrs.level === "medium" || attrs.level === "low"
    ? attrs.level
    : "medium";
  return {
    id: attrs.id,
    level,
    page: Number(attrs.page),
    title: attrs.title ?? "",
    label: attrs.label,
  };
}

/**
 * 把流式 Markdown 切分为普通 Markdown 片段与 <risk> 自定义组件片段。
 * 未闭合的 risk 块作为 partial 组件渲染，模拟组件映射中间态。
 */
export function parseReport(input: string): ReportSegment[] {
  const segments: ReportSegment[] = [];
  let markdownBuffer: string[] = [];
  let current: { tag: RiskTag; body: string[] } | null = null;

  const flushMarkdown = () => {
    const text = markdownBuffer.join("\n").trim();
    if (text) segments.push({ type: "markdown", text });
    markdownBuffer = [];
  };

  const lines = input.split("\n");
  for (const line of lines) {
    if (!current) {
      const open = line.match(/^<risk\s+([^>]*)>\s*$/);
      if (open) {
        const tag = parseAttrs(open[1]);
        if (tag) {
          flushMarkdown();
          current = { tag, body: [] };
          continue;
        }
      }
      markdownBuffer.push(line);
    } else if (/^<\/risk>\s*$/.test(line)) {
      segments.push({
        type: "risk",
        tag: current.tag,
        body: current.body.join("\n").trim(),
        complete: true,
      });
      current = null;
    } else {
      current.body.push(line);
    }
  }

  if (current) {
    segments.push({
      type: "risk",
      tag: current.tag,
      body: current.body.join("\n").trim(),
      complete: false,
    });
  }
  flushMarkdown();
  return segments;
}

export function countRisks(input: string): number {
  return parseReport(input).filter((segment) => segment.type === "risk" && segment.complete).length;
}

/**
 * 流式输出中 Markdown 语法常常尚未闭合，直接渲染会造成 DOM 结构错乱。
 * 这里补齐加粗、行内代码、代码块、表格与链接的结束标记，仅用于渲染。
 */
export function repairMarkdown(partial: string): string {
  let text = partial;
  const lines = text.split("\n");
  const last = lines[lines.length - 1]?.trim() ?? "";

  // 丢弃尚未传输完整的自定义标签行
  if (/^<risk[^>]*$/.test(last) || /^<\/risk\s*$/.test(last)) {
    lines.pop();
    text = lines.join("\n");
  }

  const fences = text.match(/^```/gm)?.length ?? 0;
  if (fences % 2 === 1) text += "\n```";

  const withoutFences = text.replace(/```[\s\S]*?```/g, "");
  const inlineTicks = withoutFences.match(/(?<!`)`(?!`)/g)?.length ?? 0;
  if (inlineTicks % 2 === 1) text += "`";

  const bold = text.match(/\*\*/g)?.length ?? 0;
  if (bold % 2 === 1) text += "**";

  const lastLine = text.split("\n").pop() ?? "";
  if (lastLine.trimStart().startsWith("|") && !lastLine.trimEnd().endsWith("|")) {
    text += " |";
  }

  if (/\[[^\]]*\]\([^)]*$/.test(text)) text += ")";

  return text;
}
