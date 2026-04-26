import type { Lens } from "@/db/schema";
import type { Range } from "./dates";
import type { SummarySource } from "./summarize-prompt";

export type LensPeriodScope = "weekly" | "monthly" | "yearly";

const PERIOD_LABEL: Record<LensPeriodScope, string> = {
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export type PriorPeriodReflection = {
  rangeFrom: string;
  rangeTo: string;
  period: LensPeriodScope;
  reflection: string;
};

export type LensPeriodInput = {
  lens: Lens;
  period: LensPeriodScope;
  range: Range;
  sources: SummarySource[];
  priorPeriodReflections?: PriorPeriodReflection[];
};

export function buildLensPeriodSystemPrompt(lens: Lens): string {
  return `${lens.systemPrompt}

You are producing a SINGLE-LENS reflection over a stretch of journal entries — not a general summary. The output is markdown reflecting on the entire period THROUGH THIS LENS only. Other lenses do not exist for this output.

Structure:
- Begin with a "## ${lens.name} — <descriptive period title>" heading. Title in title case, drawn from concrete details of the period.
- Then 3-6 short paragraphs (or sections with ### subheadings if it helps). Address the writer in second person.
- Weave the lens's analysis questions and summary focus in as a frame, not as Q&A.
- Reference specific source entries by date when calling out something concrete.
- Distinguish factual synthesis ("you ran twice this week") from interpretive reflection ("the days you ran also tend to be the days you …").
- Be conservative about pattern claims. Two data points isn't a pattern.

If prior period reflections through this same lens are provided (in chronological order):
- Notice continuity ("you returned to the question of …") or contrast ("for the first time in three weeks you …").
- Reference prior reflections by their range when calling out a thread (e.g. "what came up the week of April 13").
- Stay grounded in the current period. Do NOT invent connections that aren't supported.

Constraints (all the standard voice-preservation and forbidden-changes rules from per-entry reflections still apply):
- Preserve the writer's voice when quoting them (lowercase choices, shorthand, etc.).
- Never diagnose, never prescribe medical advice, never moralize.
- No generic platitudes; no padding when the period had little content (just say so).
- Do NOT speak as "I" — speak as the lens reflecting on the writer.`;
}

function renderSources(sources: SummarySource[]): string {
  if (sources.length === 0) {
    return `<source_entries>\n(no daily entries in this period)\n</source_entries>`;
  }
  const blocks = sources
    .map(
      (s) =>
        `<source id="${s.id}" date="${s.date}" type="${s.type}">\n${s.content}\n</source>`,
    )
    .join("\n\n");
  return `<source_entries>\n${blocks}\n</source_entries>`;
}

function renderPriorPeriodBlock(priors: PriorPeriodReflection[]): string {
  if (priors.length === 0) {
    return `<prior_period_reflections>\n(no prior period reflections through this lens)\n</prior_period_reflections>`;
  }
  const ordered = [...priors].sort((a, b) =>
    a.rangeFrom.localeCompare(b.rangeFrom),
  );
  const blocks = ordered
    .map(
      (p) =>
        `<prior_period_reflection period="${p.period}" range_from="${p.rangeFrom}" range_to="${p.rangeTo}">\n${p.reflection.trim()}\n</prior_period_reflection>`,
    )
    .join("\n\n");
  return `<prior_period_reflections>\n${blocks}\n</prior_period_reflections>`;
}

export function buildLensPeriodPrompt(input: LensPeriodInput): string {
  const { lens, period, range, sources } = input;
  const priors = input.priorPeriodReflections ?? [];
  const periodLabel = PERIOD_LABEL[period];

  const analysisBlock =
    lens.analysisQuestions.length === 0
      ? "(no analysis questions)"
      : lens.analysisQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  const focusBlock =
    lens.summaryFocus.length === 0
      ? "(no summary focus points)"
      : lens.summaryFocus.map((f) => `- ${f}`).join("\n");

  return `Reflect through the ${lens.name} lens on the writer's ${periodLabel} from ${range.from} through ${range.to}.

<lens_analysis_questions>
${analysisBlock}
</lens_analysis_questions>

<lens_summary_focus>
${focusBlock}
</lens_summary_focus>

${renderPriorPeriodBlock(priors)}

${renderSources(sources)}

Produce the reflection as markdown per the system prompt.`;
}
