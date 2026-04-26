import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { entries, lenses, type Entry, type Lens } from "@/db/schema";
import { getLanguageModel } from "./language-model";
import { DEFAULT_MODEL_ID } from "./models";
import type { Range } from "./dates";
import {
  CHILD_TYPE,
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryPrompt,
  type SummaryPeriod,
  type SummarySource,
} from "./summarize-prompt";

export type { SummaryPeriod, SummarySource } from "./summarize-prompt";

const SUMMARY_SCHEMA = z.object({
  formatted_content: z
    .string()
    .describe(
      "The full summary as markdown. Always begins with a ## heading. Includes sections for what happened, key lessons, patterns noticed, and (if lenses provided) one ## section per active lens.",
    ),
});

export function fetchChildEntries(
  period: SummaryPeriod,
  range: Range,
): SummarySource[] {
  const childType = CHILD_TYPE[period];
  const rows = db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.type, childType),
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

export function fetchActiveLenses(): Lens[] {
  return db.select().from(lenses).where(eq(lenses.active, true)).all();
}

export type GenerateSummaryInput = {
  period: SummaryPeriod;
  range: Range;
  modelId?: string;
};

export type GenerateSummaryResult = {
  formattedContent: string;
  sources: SummarySource[];
  activeLenses: Lens[];
};

export async function generateSummary(
  input: GenerateSummaryInput,
): Promise<GenerateSummaryResult> {
  const sources = fetchChildEntries(input.period, input.range);
  if (sources.length === 0) {
    throw new Error(
      `no ${CHILD_TYPE[input.period]} entries between ${input.range.from} and ${input.range.to}`,
    );
  }
  const activeLenses = fetchActiveLenses();
  const prompt = buildSummaryPrompt({
    period: input.period,
    range: input.range,
    sources,
    lenses: activeLenses,
  });
  const { object } = await generateObject({
    model: getLanguageModel(input.modelId ?? DEFAULT_MODEL_ID),
    schema: SUMMARY_SCHEMA,
    system: SUMMARY_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 16000,
  });
  return {
    formattedContent: object.formatted_content.trim(),
    sources,
    activeLenses,
  };
}

export type PersistSummaryInput = {
  period: SummaryPeriod;
  range: Range;
  formattedContent: string;
  sources: SummarySource[];
};

export function persistSummary(input: PersistSummaryInput): string {
  const id = randomUUID();
  const rawText = input.sources
    .map((s) => `# ${s.date} (${s.type})\n\n${s.content}`)
    .join("\n\n---\n\n");
  db.insert(entries)
    .values({
      id,
      date: input.range.to,
      type: input.period,
      status: "draft",
      template: null,
      rawText,
      formattedContent: input.formattedContent,
    })
    .run();
  return id;
}

export async function summarizePeriod(input: {
  period: SummaryPeriod;
  range: Range;
  modelId?: string;
}): Promise<{ entryId: string }> {
  const result = await generateSummary(input);
  const entryId = persistSummary({
    period: input.period,
    range: input.range,
    formattedContent: result.formattedContent,
    sources: result.sources,
  });
  return { entryId };
}
