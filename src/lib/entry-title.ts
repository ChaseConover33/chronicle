import type { Entry } from "@/db/schema";
import { weekRange, type Ymd } from "./dates";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(date: Ymd): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function monthName(date: Ymd): string {
  return MONTH_NAMES[parts(date).m - 1];
}

export function formatDateRange(from: Ymd, to: Ymd): string {
  const a = parts(from);
  const b = parts(to);
  if (a.y === b.y && a.m === b.m) {
    return `${monthName(from)} ${a.d}–${b.d}, ${b.y}`;
  }
  if (a.y === b.y) {
    return `${monthName(from)} ${a.d} – ${monthName(to)} ${b.d}, ${b.y}`;
  }
  return `${monthName(from)} ${a.d}, ${a.y} – ${monthName(to)} ${b.d}, ${b.y}`;
}

export function formatPeriodTitle(
  period: "weekly" | "monthly" | "yearly",
  rangeFrom: Ymd,
  rangeTo: Ymd,
): string {
  switch (period) {
    case "weekly":
      return `Week of ${formatDateRange(rangeFrom, rangeTo)}`;
    case "monthly":
      return `${monthName(rangeFrom)} ${parts(rangeFrom).y}`;
    case "yearly":
      return `${parts(rangeFrom).y}`;
  }
}

export function formatEntryTitle(
  entry: Pick<Entry, "type" | "date">,
): string {
  switch (entry.type) {
    case "weekly": {
      const r = weekRange(entry.date);
      return `Week of ${formatDateRange(r.from, r.to)}`;
    }
    case "monthly":
      return `${monthName(entry.date)} ${parts(entry.date).y}`;
    case "yearly":
      return `${parts(entry.date).y}`;
    case "decade": {
      const y = parts(entry.date).y;
      const decadeStart = Math.floor(y / 10) * 10;
      return `${decadeStart}s`;
    }
    case "goal_reflection":
      return `Reflection on ${entry.date}`;
    default:
      return entry.date;
  }
}

export function entryHeadline(
  entry: Pick<Entry, "type" | "formattedContent" | "rawText">,
  maxLength: number = 140,
): string {
  if (isSummaryType(entry.type)) return "";
  const source = (entry.formattedContent ?? entry.rawText ?? "").trim();
  if (!source) return "";

  const firstHeading = source.match(/^#{1,6}\s+(.+)$/m);
  if (firstHeading) {
    const text = firstHeading[1].trim().replace(/[*_`]/g, "");
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  }

  const prose = source
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*_`>]/g, "")
    .trim();
  const oneLine = prose.split(/\n+/).find((l) => l.trim().length > 0) ?? "";
  return oneLine.length > maxLength
    ? `${oneLine.slice(0, maxLength - 1)}…`
    : oneLine;
}

export function isSummaryType(type: Entry["type"]): boolean {
  return (
    type === "weekly" ||
    type === "monthly" ||
    type === "yearly" ||
    type === "decade"
  );
}

export function formatGeneratedDate(createdAt: string): string {
  // createdAt is "YYYY-MM-DD HH:MM:SS" from SQLite's datetime('now')
  const ymd = createdAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return createdAt;
  const { y, m, d } = parts(ymd);
  return `${monthName(ymd)} ${d}, ${y}`;
}
