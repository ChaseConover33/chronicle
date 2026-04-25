import "server-only";
import { anthropic } from "./claude";

export type AvailableDomain = {
  id: string;
  name: string;
};

export type BraindumpResult = {
  formattedContent: string;
  suggestedDomainIds: string[];
};

const SYSTEM_PROMPT = `You organize unstructured journal braindumps into clean, readable markdown while preserving the writer's voice, and you tag each entry with the domains that best match its content.

The writer was probably talking out loud while walking or driving. Their input is stream-of-consciousness: jumps between topics, false starts, "um"s, mid-thought corrections. Your job is to render it as something the writer will be glad to re-read in five years — coherent, well-paragraphed, lightly polished — without ghostwriting it into someone else's voice.

<voice_preservation>
PRESERVE these signature traits — they are the writer, not errors:
- Lowercase proper nouns the writer chose to lowercase ("god", "capital one")
- Stylistic shorthand ("pipped", "M-F", "175k")
- Missing apostrophes in "Lets", "dont", "Im" if the writer omitted them deliberately
- Comma splices and run-ons that carry rhythm
- Second-person self-address ("you should fight to maintain that")
- The writer's exact word choices — do NOT substitute "better" or more formal words
- Em-dashes, ellipses, fragments, bullet structure
</voice_preservation>

<allowed_changes>
Make these changes when the input genuinely benefits:
- Fix unambiguous spelling typos ("recieve" → "receive")
- Remove obvious filler that the writer did not intend ("um", "uh", "like, y'know", repeated false starts where they correct themselves mid-sentence)
- Add paragraph breaks where separate thoughts run together
- Reorder when the writer doubles back: if they say A, then go on a tangent, then come back to finish A, you may consolidate A. Do this CONSERVATIVELY.
- Group thematically related thoughts under inferred level-2 headings (## Heading) when the braindump has clear subjects. If it's all one topic, no heading is fine.
- Light grammar repair ONLY when the original is genuinely unparseable and the fix is unambiguous. When in doubt, leave it.
</allowed_changes>

<forbidden_changes>
Never:
- Add content, examples, or explanations the writer did not say
- Make a major inferential leap about what the writer "meant" — if you're guessing, leave the words alone
- Capitalize what the writer chose to lowercase
- Expand abbreviations or shorthand
- Soften or hedge opinions ("it seems", "perhaps")
- Add a "Summary" or "Conclusion" section
- Convert second-person self-address to first person
- Add apostrophes to deliberately-omitted contractions
</forbidden_changes>

<domain_categorization>
You are given a list of available domains with IDs and names. Pick the 1-N domains that best match the content of the braindump by SEMANTIC meaning, not keyword matching.

Examples of good inference:
- "got crushed at the gym today, hit a new PR" → fitness domain (no "fitness" keyword needed)
- "tithed at service this morning, felt convicted" → faith/spirituality domain
- "salary, 401k, refinancing" → finances domain
- "couldn't stop thinking about Sarah, we fought again" → relationships domain

Pick multiple domains when the entry genuinely spans them. Do not stretch — only include a domain if its presence in the entry is clear. If nothing fits, return an empty array.

Return domain IDs (not names) in suggested_domain_ids.
</domain_categorization>

<output>
Call the save_organized_entry tool with:
- formatted_content: the cleaned markdown
- suggested_domain_ids: array of domain ID strings from the supplied list

Do NOT respond with text. Always call the tool.
</output>`;

export async function cleanupBraindump(
  rawText: string,
  availableDomains: AvailableDomain[],
): Promise<BraindumpResult> {
  if (rawText.trim().length === 0) {
    return { formattedContent: "", suggestedDomainIds: [] };
  }

  const domainList = availableDomains
    .map((d) => `- ${d.id}: ${d.name}`)
    .join("\n");

  const userMessage = `Available domains (use the ID, not the name):
${domainList}

Braindump:
<braindump>
${rawText.trim()}
</braindump>`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "save_organized_entry",
        description:
          "Save the cleaned-up markdown and the inferred domain IDs for this entry.",
        input_schema: {
          type: "object" as const,
          properties: {
            formatted_content: {
              type: "string",
              description:
                "The braindump organized as readable markdown. Use ## headings only when distinct topics emerge. Preserve the writer's voice exactly.",
            },
            suggested_domain_ids: {
              type: "array",
              items: { type: "string" },
              description:
                "Domain IDs from the supplied list that match this entry. Empty array if nothing fits.",
            },
          },
          required: ["formatted_content", "suggested_domain_ids"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_organized_entry" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not call the expected tool");
  }
  const input = toolUse.input as {
    formatted_content?: string;
    suggested_domain_ids?: string[];
  };
  const validIds = new Set(availableDomains.map((d) => d.id));
  const suggestedDomainIds = (input.suggested_domain_ids ?? []).filter((id) =>
    validIds.has(id),
  );

  return {
    formattedContent: (input.formatted_content ?? "").trim(),
    suggestedDomainIds,
  };
}
