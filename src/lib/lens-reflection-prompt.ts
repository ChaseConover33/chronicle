import type { Entry, Lens } from "@/db/schema";

export type PriorLensReflection = {
  entryDate: string;
  createdAt: string;
  reflection: string;
};

export type LensReflectionInput = {
  entry: Pick<Entry, "id" | "date" | "type" | "rawText" | "formattedContent">;
  lens: Lens;
  priorReflections?: PriorLensReflection[];
};

export function buildLensReflectionSystemPrompt(lens: Lens): string {
  return `${lens.systemPrompt}

You are producing a single per-entry reflection. The output is one section of markdown:
- Begin with a "## ${lens.name}" heading.
- Address the writer in second person where natural ("you noticed…").
- Engage with the analysis questions as a frame, but do not list them as Q&A — weave them into a coherent reflection.
- Keep it focused (3-6 short paragraphs or bullets max). Quality over completeness.
- Reference concrete details from the entry. No generic platitudes.
- Distinguish your interpretive observations from claims grounded in what they actually wrote.
- Preserve the writer's voice when quoting them (lowercase choices, shorthand, etc.).
- Never diagnose, never prescribe medical advice, never moralize.

You may receive prior reflections you have written through this same lens on the writer's earlier entries, in chronological order. When present:
- Notice continuity ("you returned to the same question of ...") or contrast ("for the first time in three weeks you ...") with prior reflections.
- Reference prior reflections by their entry_date when calling out a thread, e.g. "what you wrote on 2026-04-13".
- Stay grounded in the current entry. Do NOT invent connections that aren't supported by what the writer actually wrote — pattern-matching across entries should be conservative, not eager.
- If there are no meaningful threads to draw, just reflect on the current entry alone. Don't force continuity.`;
}

function renderPriorBlock(priors: PriorLensReflection[]): string {
  if (priors.length === 0) {
    return `<prior_reflections>\n(no prior reflections through this lens — this is the first one)\n</prior_reflections>`;
  }
  const ordered = [...priors].sort((a, b) =>
    a.entryDate.localeCompare(b.entryDate),
  );
  const blocks = ordered
    .map(
      (p) =>
        `<prior_reflection entry_date="${p.entryDate}" generated="${p.createdAt}">\n${p.reflection.trim()}\n</prior_reflection>`,
    )
    .join("\n\n");
  return `<prior_reflections>\n${blocks}\n</prior_reflections>`;
}

export function buildLensReflectionPrompt(input: LensReflectionInput): string {
  const { entry, lens } = input;
  const priors = input.priorReflections ?? [];
  const entryContent = (entry.formattedContent ?? entry.rawText ?? "").trim();
  const questionsBlock = lens.analysisQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");
  return `<analysis_questions>
${questionsBlock}
</analysis_questions>

${renderPriorBlock(priors)}

<entry date="${entry.date}" type="${entry.type}">
${entryContent}
</entry>

Reflect on the entry through the lens, weaving the analysis questions in as a frame and noticing any genuine continuity or contrast with prior reflections (only when grounded). Output the reflection as markdown beginning with "## ${lens.name}".`;
}
