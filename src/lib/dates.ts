export type Ymd = string;

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isYmd(value: string): value is Ymd {
  return YMD_PATTERN.test(value);
}

function parts(date: Ymd): { y: number; m: number; d: number } {
  if (!isYmd(date)) throw new Error(`invalid YMD: ${date}`);
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fromUTC(time: number): Ymd {
  const dt = new Date(time);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function toUTC(date: Ymd): number {
  const { y, m, d } = parts(date);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: Ymd, days: number): Ymd {
  return fromUTC(toUTC(date) + days * 86_400_000);
}

export function diffDays(a: Ymd, b: Ymd): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86_400_000);
}

export type Range = { from: Ymd; to: Ymd };

/** Monday → Sunday week containing the given date. ISO weeks (Mon = 1). */
export function weekRange(date: Ymd): Range {
  const { y, m, d } = parts(date);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const from = addDays(date, -daysSinceMonday);
  const to = addDays(from, 6);
  return { from, to };
}

/** Calendar-month range containing the given date. */
export function monthRange(date: Ymd): Range {
  const { y, m } = parts(date);
  const from = `${y}-${pad(m)}-01` as Ymd;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const to = `${y}-${pad(m)}-${pad(lastDay)}` as Ymd;
  return { from, to };
}

/** Calendar-year range containing the given date. */
export function yearRange(date: Ymd): Range {
  const { y } = parts(date);
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

/** Subtract one period from a date and return that period's range.
 *  Useful for "Last week"/"Last month"/"Last year" style triggers. */
export function previousWeekRange(today: Ymd): Range {
  return weekRange(addDays(today, -7));
}

export function previousMonthRange(today: Ymd): Range {
  const { y, m } = parts(today);
  const ref = m === 1 ? `${y - 1}-12-15` : `${y}-${pad(m - 1)}-15`;
  return monthRange(ref as Ymd);
}

export function previousYearRange(today: Ymd): Range {
  const { y } = parts(today);
  return yearRange(`${y - 1}-06-15` as Ymd);
}

export function todayYmd(): Ymd {
  return fromUTC(Date.now());
}
