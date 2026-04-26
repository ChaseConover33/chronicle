import { NextResponse } from "next/server";
import {
  isYmd,
  monthRange,
  todayYmd,
  weekRange,
  yearRange,
} from "@/lib/dates";
import { evaluateGoal, getGoal } from "@/lib/goal-evaluation";

const VALID_PERIODS = ["weekly", "monthly", "yearly"] as const;
type ApiPeriod = (typeof VALID_PERIODS)[number];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: goalId } = await context.params;
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

  const goal = getGoal(goalId);
  if (!goal) {
    return NextResponse.json({ error: "goal not found" }, { status: 404 });
  }

  const range =
    period === "weekly"
      ? weekRange(anchor)
      : period === "monthly"
        ? monthRange(anchor)
        : yearRange(anchor);

  try {
    const result = await evaluateGoal({
      goal,
      range,
      modelId,
    });
    return NextResponse.json({
      progress_id: result.progressId,
      trajectory: result.trajectory,
      assessment: result.assessment,
      range,
      period: period as ApiPeriod,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
