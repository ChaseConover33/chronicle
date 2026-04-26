import "server-only";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { domains, entries, entryDomains, type Entry } from "@/db/schema";
import { searchEntries } from "./search";
import { DEFAULT_MODEL_ID } from "./models";
import { getLanguageModel } from "./language-model";

export type RelatedEntry = {
  id: string;
  date: string;
  type: Entry["type"];
  snippet: string;
  reason: string;
};

const MAX_RESULTS = 3;
const CANDIDATE_LIMIT = 25;

const SYSTEM_PROMPT = `You are picking the journal entries most thematically related to a given current entry. The writer wants to surface "you wrote about this before" connections — moments that echo, contrast, or build on the current one.

Pick up to ${MAX_RESULTS} entries from the candidate list. Skip any candidate that's only superficially related (same domain but unrelated content). For each pick, write ONE short sentence (≤ 18 words) explaining the thematic connection — what specifically links them. Use the writer's voice and refer to concrete details from both entries, not generic language ("similar topic", "related theme" — bad).

If fewer than ${MAX_RESULTS} candidates are genuinely related, return fewer. If none are, return an empty array.`;

const RELATED_SCHEMA = z.object({
  related: z.array(
    z.object({
      entry_id: z.string(),
      reason: z.string(),
    }),
  ),
});

function previewText(entry: Entry, limit = 400): string {
  const source = (entry.formattedContent ?? entry.rawText ?? "").trim();
  if (source.length <= limit) return source;
  return `${source.slice(0, limit)}…`;
}

export async function findRelatedEntries(
  entry: Entry,
  modelId: string = DEFAULT_MODEL_ID,
): Promise<RelatedEntry[]> {
  if (!entry.formattedContent && !entry.rawText) return [];

  const entryDomainIds = db
    .select({ domainId: entryDomains.domainId })
    .from(entryDomains)
    .where(eq(entryDomains.entryId, entry.id))
    .all()
    .map((r) => r.domainId);

  if (entryDomainIds.length === 0) return [];

  const candidates = searchEntries({
    query: "",
    domainIds: entryDomainIds,
    from: undefined,
    to: undefined,
    type: undefined,
  })
    .filter((c) => c.id !== entry.id && !!c.formattedContent)
    .slice(0, CANDIDATE_LIMIT);

  if (candidates.length === 0) return [];

  if (candidates.length <= MAX_RESULTS) {
    const domainNames = db
      .select({ name: domains.name })
      .from(domains)
      .where(eq(domains.id, entryDomainIds[0]))
      .all()
      .map((r) => r.name);
    const sharedLabel = domainNames[0] ?? "shared domain";
    return candidates.map((c) => ({
      id: c.id,
      date: c.date,
      type: c.type,
      snippet: c.snippet || previewText(c, 200),
      reason: `Tagged with ${sharedLabel}.`,
    }));
  }

  const candidateBlock = candidates
    .map(
      (c) =>
        `<candidate id="${c.id}" date="${c.date}" type="${c.type}">\n${previewText(c, 350)}\n</candidate>`,
    )
    .join("\n\n");

  const { object } = await generateObject({
    model: getLanguageModel(modelId),
    schema: RELATED_SCHEMA,
    system: SYSTEM_PROMPT,
    prompt: `<current_entry date="${entry.date}" type="${entry.type}">
${previewText(entry, 800)}
</current_entry>

<candidates>
${candidateBlock}
</candidates>

Pick up to ${MAX_RESULTS} candidate entries that are most thematically related to the current entry. Return their IDs and a short reason each.`,
    maxOutputTokens: 2000,
  });

  const candidateById = new Map(candidates.map((c) => [c.id, c]));
  return object.related
    .map((r) => {
      const c = candidateById.get(r.entry_id);
      if (!c) return null;
      return {
        id: c.id,
        date: c.date,
        type: c.type,
        snippet: c.snippet || previewText(c, 200),
        reason: r.reason.trim(),
      };
    })
    .filter((r): r is RelatedEntry => r !== null)
    .slice(0, MAX_RESULTS);
}
