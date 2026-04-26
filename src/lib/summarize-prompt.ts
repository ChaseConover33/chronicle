import type { Lens, Entry } from "@/db/schema";
import type { Range } from "./dates";

export type SummaryPeriod = "weekly" | "monthly" | "yearly";

export const CHILD_TYPE: Record<SummaryPeriod, Entry["type"]> = {
  weekly: "daily",
  monthly: "weekly",
  yearly: "monthly",
};

const PERIOD_LABEL: Record<SummaryPeriod, string> = {
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export type SummarySource = {
  id: string;
  date: string;
  type: Entry["type"];
  content: string;
};

export const SUMMARY_SYSTEM_PROMPT = `You are synthesizing a journal summary that the writer will reread to see patterns, growth, and themes that aren't visible from inside a single entry.

Your output is markdown with these sections, in order:

1. ## <descriptive title for the period> — title, in title case, drawn from concrete details in the period (NOT generic like "Week in Review")
2. ## What Happened — narrative arc of the period, in chronological-ish order. Reference specific entries and events. Voice should match the writer's, not be journalistic.
3. ## Key Lessons — what the writer would want to remember a month from now. 2-5 bullet points or short paragraphs.
4. ## Patterns Noticed — recurring themes, emotions, behaviors, or tensions. Be specific (which entries showed what), not generic ("the writer reflected on...").
5. (only if lenses provided) ## <Lens Name> — one section per active lens, applying that lens's summary focus to the period's content. Explicitly distinguish factual synthesis from interpretive reflection.

Constraints:
- ALWAYS preserve the writer's voice traits visible in the source entries (lowercase proper nouns, shorthand, etc.).
- Distinguish "things that happened" (factual synthesis) from "patterns I notice" (interpretive reflection). The writer should be able to tell which is which.
- Reference specific source entries when claiming a pattern. Don't generalize without evidence.
- If the period has very little content, say so. Don't pad.
- Headings use Title Case.`;

export type BuildPromptInput = {
  period: SummaryPeriod;
  range: Range;
  sources: SummarySource[];
  lenses: Lens[];
};

export function buildSummaryPrompt(input: BuildPromptInput): string {
  const { period, range, sources, lenses } = input;
  const periodLabel = PERIOD_LABEL[period];
  const lensesBlock =
    lenses.length === 0
      ? "(No active lenses — skip per-lens sections.)"
      : lenses
          .map(
            (l) =>
              `<lens name="${l.name}">\n  Summary focus:\n${l.summaryFocus.map((f) => `  - ${f}`).join("\n")}\n</lens>`,
          )
          .join("\n\n");

  const sourcesBlock = sources
    .map(
      (s) =>
        `<source id="${s.id}" date="${s.date}" type="${s.type}">\n${s.content}\n</source>`,
    )
    .join("\n\n");

  return `Synthesize a ${periodLabel} summary covering ${range.from} through ${range.to}.

<active_lenses>
${lensesBlock}
</active_lenses>

<source_entries>
${sourcesBlock}
</source_entries>

Produce the summary as markdown per the system prompt.`;
}
