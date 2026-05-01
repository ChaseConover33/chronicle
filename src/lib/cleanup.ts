import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { getLanguageModel } from "./language-model";
import { DEFAULT_MODEL_ID } from "./models";

export type AvailableDomain = {
  id: string;
  name: string;
};

export type BraindumpResult = {
  formattedContent: string;
  summary: string;
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
- Collapse redundancy. The writer rambles and circles back to the same point in slightly different words — sometimes three or four times in one braindump. When the writer makes the same point more than once, keep the single clearest expression of it (preferring their sharpest phrasing) and drop the restatements. Do NOT preserve every pass for "completeness". This is one of the most valuable things you do — the writer is explicitly asking you to handle their rambling. BUT: a restatement that adds new nuance, a new example, or a sharper conclusion is not redundancy — keep it. Only collapse when the second pass is genuinely saying the same thing.
- Add paragraph breaks where separate thoughts run together
- Reorder when the writer doubles back: if they say A, then go on a tangent, then come back to finish A, you may consolidate A. Do this CONSERVATIVELY.
- ALWAYS add at least one ## header. Every entry begins with a ## heading. If the braindump covers multiple topics, give each group its own ## heading. If the braindump is one tight topic, give the entry a single descriptive ## heading at the top. Headings should be short phrases the writer would recognize as theirs — drawn from their words and framing — not generic ("## Reflections", "## Thoughts") or corporate ("## Key Takeaways", "## Action Items"). HEADINGS MUST USE TITLE CASE — capitalize the first letter of every significant word ("## The Game Of Work", "## Capital One Productivity", "## 5 Mile Run"). This is the ONE place where you override the writer's lowercase-by-default style: headings are always capitalized even though the writer types in lowercase. Never produce formatted_content without at least one ## heading.
- Light grammar repair ONLY when the original is genuinely unparseable and the fix is unambiguous. When in doubt, leave it.
- Drop free-floating musings. The writer's journal is a record of their lived life, not a place for unresolved philosophical wondering. When a passage is purely abstract speculation — riffing on ideas, asking open questions, citing thinkers/articles, exploring concepts — and is NOT tied to something the writer actually did, felt, decided, or experienced that day, omit it from formatted_content entirely. Do NOT try to rescue it into the entry, do NOT keep a trimmed version, do NOT summarize the musing. Just leave it out. Edge cases: (1) if a musing is genuinely tied to a lived event ("at dinner I got into it with Mark about free will, and I keep turning it over — …"), keep the lived event and the writer's actual position, but drop the abstract elaboration. (2) If the ENTIRE braindump is musing with no lived content, produce a very short formatted_content with a single ## heading and one line noting the writer was thinking about <topic> today (drawn from their words), so the entry isn't empty. The summary should describe the lived content only; if there is no lived content, the summary should say the writer spent the day turning over <topic> without resolving it.
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

<summary>
You also produce a 2-3 sentence card summary that captures what the entry is actually about, for display on entry-list cards. The summary is the writer's later self getting a glance-able sense of "what was this day about" without re-reading the whole entry.

Rules:
- 2-3 sentences. Never one. Never four.
- Subject-less past tense, neutral observer voice — sentences begin with the verb ("Reflected on the disconnect between…", "Worked through frustration with…", "Played poker with friends and noticed…"). NEVER use a subject pronoun: no "he", no "she", no "they", no "the writer", no "the author". NOT first-person ("I"), NOT second-person ("you"), NOT a quote. The summary should read like a glance-able caption of the day, not like someone analyzing the writer from the outside.
- Cover the BREADTH of the entry, not just the first topic. If the entry covers running, work, and a disagreement with someone, the summary should touch all three.
- Lead with what was happening or being wrestled with, not the conclusion.
- Use specific nouns from the entry (people's names, project names, places) where they ground the summary. Don't strip detail to make it generic.
- Don't moralize ("important reflection on…"), don't editorialize ("a thoughtful look at…"), don't praise ("a great day where…").
- Don't include sentences like "the entry discusses" or "the writer talks about" — just describe the content directly.

Return the summary in the "summary" field.
</summary>`;

const REFINE_PROMPT = `You are refining a journal entry that you previously cleaned up. The writer is giving you feedback to adjust the previous output.

You will receive:
- The original raw braindump (sacred — do not regress to it; only use it to ground voice and verify nothing was added or removed beyond what the writer said)
- Your previous cleaned-up version
- The writer's note describing what they want changed (may be empty — in which case make a different reasonable attempt, e.g. add headers, regroup paragraphs, tighten phrasing — but do not invent content)

Your job:
- Apply the writer's note to the previous version
- Keep everything they did NOT ask to change exactly as it was in the previous version. This includes manual edits the writer made before clicking redo.
- All the same voice-preservation and forbidden-changes rules from the original cleanup still apply (lowercase proper nouns the writer used, stylistic shorthand, missing apostrophes, comma splices, second-person self-address, no added content, no softening, no expanding abbreviations).
- Continue collapsing redundancy: when the writer makes the same point more than once across the raw braindump, keep only the single clearest expression. Do not reintroduce repeated passes the previous version correctly trimmed.
- ALWAYS keep at least one ## header. Every refined entry must start with a ## heading. If the writer asks for additional headings, add them; if they ask to remove headings, still keep one descriptive heading at the top. HEADINGS MUST USE TITLE CASE — capitalize the first letter of every significant word ("## The Game Of Work"). Headings are the one place where capitalization overrides the writer's lowercase style.
- Re-infer suggested_domain_ids based on the resulting content (the writer may have asked for changes that shift what the entry is "about").
- Re-emit the "summary" field (2-3 sentences, subject-less past tense — sentences begin with the verb, never use "he"/"she"/"they"/"the writer", never first or second person — covering the breadth of the refined entry; same rules as the original cleanup).`;

const RESULT_SCHEMA = z.object({
  formatted_content: z
    .string()
    .describe(
      "The entry organized as readable markdown. ALWAYS includes at least one ## heading. Multi-topic entries get a ## heading per topic; single-topic entries get one ## heading at the top. Preserve the writer's voice exactly.",
    ),
  summary: z
    .string()
    .describe(
      "A 2-3 sentence card summary of the entry. Subject-less past tense — sentences begin with the verb (e.g. 'Reflected on…', 'Worked through…'). Never use 'he', 'she', 'they', 'the writer', first person, or second person. Covers the breadth of the entry, not just the first topic. Used on entry-list cards.",
    ),
  suggested_domain_ids: z
    .array(z.string())
    .describe(
      "Domain IDs from the supplied list that match this entry. Empty array if nothing fits.",
    ),
});

function formatDomainList(availableDomains: AvailableDomain[]): string {
  return availableDomains.map((d) => `- ${d.id}: ${d.name}`).join("\n");
}

function filterValidDomains(
  ids: string[],
  available: AvailableDomain[],
): string[] {
  const valid = new Set(available.map((d) => d.id));
  return ids.filter((id) => valid.has(id));
}

export async function cleanupBraindump(
  rawText: string,
  availableDomains: AvailableDomain[],
  modelId: string = DEFAULT_MODEL_ID,
): Promise<BraindumpResult> {
  if (rawText.trim().length === 0) {
    return { formattedContent: "", summary: "", suggestedDomainIds: [] };
  }

  const { object } = await generateObject({
    model: getLanguageModel(modelId),
    schema: RESULT_SCHEMA,
    system: SYSTEM_PROMPT,
    prompt: `Available domains (use the ID, not the name):
${formatDomainList(availableDomains)}

Braindump:
<braindump>
${rawText.trim()}
</braindump>`,
    maxOutputTokens: 16000,
  });

  return {
    formattedContent: object.formatted_content.trim(),
    summary: object.summary.trim(),
    suggestedDomainIds: filterValidDomains(
      object.suggested_domain_ids,
      availableDomains,
    ),
  };
}

const SUMMARY_ONLY_SYSTEM = `You produce a 2-3 sentence card summary of an existing journal entry, for display on entry-list cards.

Rules:
- 2-3 sentences. Never one. Never four.
- Subject-less past tense, neutral observer voice — sentences begin with the verb ("Reflected on the disconnect between…", "Worked through frustration with…", "Played poker with friends and noticed…"). NEVER use a subject pronoun: no "he", no "she", no "they", no "the writer", no "the author". NOT first-person ("I"), NOT second-person ("you"), NOT a quote. The summary should read like a glance-able caption of the day, not like someone analyzing the writer from the outside.
- Cover the BREADTH of the entry, not just the first section. If the entry covers running, work, and a disagreement, the summary should touch all three.
- Lead with what was happening or being wrestled with, not the conclusion.
- Use specific nouns from the entry (people's names, project names, places) where they ground the summary.
- Don't moralize, don't editorialize, don't praise, don't include "the entry discusses" framing — just describe the content directly.`;

const SUMMARY_ONLY_SCHEMA = z.object({
  summary: z.string().describe("2-3 sentence card summary. Subject-less past tense, sentences begin with the verb. No 'he'/'she'/'they'/'the writer', no first or second person."),
});

export async function summarizeFormatted(
  formattedContent: string,
  rawText: string,
  modelId: string = DEFAULT_MODEL_ID,
): Promise<string> {
  if (formattedContent.trim().length === 0 && rawText.trim().length === 0) {
    return "";
  }
  const { object } = await generateObject({
    model: getLanguageModel(modelId),
    schema: SUMMARY_ONLY_SCHEMA,
    system: SUMMARY_ONLY_SYSTEM,
    prompt: `<formatted_entry>
${formattedContent.trim() || rawText.trim()}
</formatted_entry>`,
    maxOutputTokens: 400,
  });
  return object.summary.trim();
}

export async function refineCleanup(
  rawText: string,
  previousFormatted: string,
  userNote: string,
  availableDomains: AvailableDomain[],
  modelId: string = DEFAULT_MODEL_ID,
): Promise<BraindumpResult> {
  if (previousFormatted.trim().length === 0) {
    return cleanupBraindump(rawText, availableDomains, modelId);
  }

  const noteBlock = userNote.trim().length > 0
    ? `<writer_note>\n${userNote.trim()}\n</writer_note>`
    : `<writer_note>\n(no specific instruction — produce a different, well-structured version. Add ## headers if the previous version lacked them.)\n</writer_note>`;

  const { object } = await generateObject({
    model: getLanguageModel(modelId),
    schema: RESULT_SCHEMA,
    system: REFINE_PROMPT,
    prompt: `Available domains (use the ID, not the name):
${formatDomainList(availableDomains)}

<original_raw>
${rawText.trim()}
</original_raw>

<previous_version>
${previousFormatted.trim()}
</previous_version>

${noteBlock}`,
    maxOutputTokens: 16000,
  });

  return {
    formattedContent: object.formatted_content.trim(),
    summary: object.summary.trim(),
    suggestedDomainIds: filterValidDomains(
      object.suggested_domain_ids,
      availableDomains,
    ),
  };
}
