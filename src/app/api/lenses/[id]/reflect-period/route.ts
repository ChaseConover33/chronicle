import { NextResponse } from "next/server";
import {
  isYmd,
  monthRange,
  todayYmd,
  weekRange,
  yearRange,
} from "@/lib/dates";
import {
  generateLensPeriodReflection,
  getLens,
  saveLensPeriodReflection,
} from "@/lib/lens-period-reflection";
import type { LensPeriodScope } from "@/lib/lens-period-reflection-prompt";

const VALID_PERIODS: LensPeriodScope[] = ["weekly", "monthly", "yearly"];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: lensId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const period = typeof body.period === "string" ? body.period : "";
  if (!(VALID_PERIODS as string[]).includes(period)) {
    return NextResponse.json(
      { error: `period must be one of: ${VALID_PERIODS.join(", ")}` },
      { status: 400 },
    );
  }
  const anchor =
    typeof body.date === "string" && isYmd(body.date) ? body.date : todayYmd();
  const modelId = typeof body.model_id === "string" ? body.model_id : undefined;

  const lens = getLens(lensId);
  if (!lens) {
    return NextResponse.json({ error: "lens not found" }, { status: 404 });
  }

  const range =
    period === "weekly"
      ? weekRange(anchor)
      : period === "monthly"
        ? monthRange(anchor)
        : yearRange(anchor);

  try {
    const result = await generateLensPeriodReflection({
      lens,
      period: period as LensPeriodScope,
      range,
      modelId,
    });
    const reflectionId = saveLensPeriodReflection({
      lensId,
      period: period as LensPeriodScope,
      range,
      reflection: result.reflection,
      modelId,
    });
    return NextResponse.json({
      reflection_id: reflectionId,
      reflection: result.reflection,
      lens_id: lensId,
      lens_name: lens.name,
      period,
      range,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
