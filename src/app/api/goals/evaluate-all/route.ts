import { NextResponse } from "next/server";
import {
  isYmd,
  monthRange,
  todayYmd,
  weekRange,
  yearRange,
} from "@/lib/dates";
import { evaluateAllActiveGoals } from "@/lib/goal-evaluation";

const VALID_PERIODS = ["weekly", "monthly", "yearly"] as const;

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const period = typeof body.period === "string" ? body.period : "weekly";
  if (!(VALID_PERIODS as readonly string[]).includes(period)) {
    return NextResponse.json(
      { error: `period must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 400 },
    );
  }
  const anchor =
    typeof body.date === "string" && isYmd(body.date) ? body.date : todayYmd();
  const modelId = typeof body.model_id === "string" ? body.model_id : undefined;

  const range =
    period === "weekly"
      ? weekRange(anchor)
      : period === "monthly"
        ? monthRange(anchor)
        : yearRange(anchor);

  try {
    const results = await evaluateAllActiveGoals({ range, modelId });
    return NextResponse.json({
      count: results.length,
      results,
      range,
      period,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
