import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import {
  entries,
  lensPeriodReflections,
  lenses,
  type Lens,
} from "@/db/schema";
import type { Range } from "./dates";
import { getLanguageModel } from "./language-model";
import { DEFAULT_MODEL_ID } from "./models";
import {
  buildLensPeriodPrompt,
  buildLensPeriodSystemPrompt,
  type LensPeriodScope,
  type PriorPeriodReflection,
} from "./lens-period-reflection-prompt";
import type { SummarySource } from "./summarize-prompt";

const PRIOR_LIMIT = 3;

const REFLECTION_SCHEMA = z.object({
  reflection: z
    .string()
    .describe(
      `The reflection as markdown, beginning with "## <Lens Name> — <period title>".`,
    ),
});

export function fetchEntriesInRange(range: Range): SummarySource[] {
  const rows = db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.type, "daily"),
        gte(entries.date, range.from),
        lte(entries.date, range.to),
      ),
    )
    .orderBy(asc(entries.date), asc(entries.createdAt))
    .all();
  return rows
    .map((r): SummarySource => ({
      id: r.id,
      date: r.date,
      type: r.type,
      content: (r.formattedContent ?? r.rawText ?? "").trim(),
    }))
    .filter((r) => r.content.length > 0);
}

export function fetchPriorPeriodReflectionsForLens(
  lensId: string,
  beforeRangeFrom: string,
  limit: number = PRIOR_LIMIT,
): PriorPeriodReflection[] {
  const rows = db
    .select({
      period: lensPeriodReflections.period,
      rangeFrom: lensPeriodReflections.rangeFrom,
      rangeTo: lensPeriodReflections.rangeTo,
      reflection: lensPeriodReflections.reflection,
    })
    .from(lensPeriodReflections)
    .where(
      and(
        eq(lensPeriodReflections.lensId, lensId),
        lt(lensPeriodReflections.rangeFrom, beforeRangeFrom),
      ),
    )
    .orderBy(desc(lensPeriodReflections.rangeFrom))
    .limit(limit)
    .all();
  return rows.reverse();
}

export function getLens(lensId: string): Lens | undefined {
  return db.select().from(lenses).where(eq(lenses.id, lensId)).get();
}

export function getLensPeriodReflection(
  reflectionId: string,
):
  | (typeof lensPeriodReflections.$inferSelect & { lensName: string | null })
  | undefined {
  const row = db
    .select()
    .from(lensPeriodReflections)
    .where(eq(lensPeriodReflections.id, reflectionId))
    .get();
  if (!row) return undefined;
  const lens = getLens(row.lensId);
  return { ...row, lensName: lens?.name ?? null };
}

export function listLensPeriodReflections(
  lensId: string,
): (typeof lensPeriodReflections.$inferSelect)[] {
  return db
    .select()
    .from(lensPeriodReflections)
    .where(eq(lensPeriodReflections.lensId, lensId))
    .orderBy(desc(lensPeriodReflections.rangeFrom))
    .all();
}

export type GenerateLensPeriodInput = {
  lens: Lens;
  period: LensPeriodScope;
  range: Range;
  modelId?: string;
};

export type GenerateLensPeriodResult = {
  reflection: string;
  sources: SummarySource[];
  priorReflections: PriorPeriodReflection[];
};

export async function generateLensPeriodReflection(
  input: GenerateLensPeriodInput,
): Promise<GenerateLensPeriodResult> {
  const sources = fetchEntriesInRange(input.range);
  if (sources.length === 0) {
    throw new Error(
      `no daily entries between ${input.range.from} and ${input.range.to}`,
    );
  }
  const priors = fetchPriorPeriodReflectionsForLens(
    input.lens.id,
    input.range.from,
  );
  const { object } = await generateObject({
    model: getLanguageModel(input.modelId ?? DEFAULT_MODEL_ID),
    schema: REFLECTION_SCHEMA,
    system: buildLensPeriodSystemPrompt(input.lens),
    prompt: buildLensPeriodPrompt({
      lens: input.lens,
      period: input.period,
      range: input.range,
      sources,
      priorPeriodReflections: priors,
    }),
    maxOutputTokens: 8000,
  });
  return {
    reflection: object.reflection.trim(),
    sources,
    priorReflections: priors,
  };
}

export type SaveLensPeriodInput = {
  lensId: string;
  period: LensPeriodScope;
  range: Range;
  reflection: string;
  modelId?: string;
};

export function saveLensPeriodReflection(input: SaveLensPeriodInput): string {
  const id = randomUUID();
  db.insert(lensPeriodReflections)
    .values({
      id,
      lensId: input.lensId,
      period: input.period,
      rangeFrom: input.range.from,
      rangeTo: input.range.to,
      reflection: input.reflection,
      modelId: input.modelId ?? null,
    })
    .run();
  return id;
}
