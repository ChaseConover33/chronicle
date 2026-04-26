import type { Entry, Lens } from "@/db/schema";

export type LensReflectionInput = {
  entry: Pick<Entry, "id" | "date" | "type" | "rawText" | "formattedContent">;
  lens: Lens;
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
- Never diagnose, never prescribe medical advice, never moralize.`;
}

export function buildLensReflectionPrompt(input: LensReflectionInput): string {
  const { entry, lens } = input;
  const entryContent = (entry.formattedContent ?? entry.rawText ?? "").trim();
  const questionsBlock = lens.analysisQuestions
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");
  return `<analysis_questions>
${questionsBlock}
</analysis_questions>

<entry date="${entry.date}" type="${entry.type}">
${entryContent}
</entry>

Reflect on the entry through the lens, weaving the analysis questions in as a frame. Output the reflection as markdown beginning with "## ${lens.name}".`;
}
