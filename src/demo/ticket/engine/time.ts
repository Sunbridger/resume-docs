import type { Ticket } from "../types";

export interface TimeRange {
  key: "week" | "last-week" | "recent" | "month" | "last-month";
  label: string;
  from: Date;
  to: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 周日
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function parseRange(text: string): TimeRange | null {
  const now = new Date();
  if (/本周|这周|这一周/.test(text)) {
    return { key: "week", label: "本周", from: startOfWeek(now), to: now };
  }
  if (/上周|上个星期|上一周/.test(text)) {
    const thisWeek = startOfWeek(now);
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return { key: "last-week", label: "上周", from: lastWeek, to: thisWeek };
  }
  if (/最近一周|近一周|过去一周|最近七天|近七天/.test(text)) {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { key: "recent", label: "最近一周", from, to: now };
  }
  if (/上个月|上月/.test(text)) {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { key: "last-month", label: "上个月", from: first, to: end };
  }
  if (/本月|这个月/.test(text)) {
    return { key: "month", label: "本月", from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  return null;
}

export function filterByRange(
  tickets: Ticket[],
  range: TimeRange | null,
  owner = "我",
): Ticket[] {
  const mine = tickets.filter((ticket) => ticket.owner === owner);
  if (!range) return mine;
  return mine.filter((ticket) => {
    const updated = new Date(ticket.updatedAt).getTime();
    return updated >= range.from.getTime() && updated <= range.to.getTime();
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}
