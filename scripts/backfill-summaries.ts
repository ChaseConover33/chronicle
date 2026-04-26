import path from "node:path";
import Database from "better-sqlite3";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const SYSTEM = `You produce a 2-3 sentence card summary of an existing journal entry, for display on entry-list cards.

Rules:
- 2-3 sentences. Never one. Never four.
- Third-person, past tense, neutral observer voice ("Reflected on the disconnect between…", "Worked through frustration with…", "Played poker with friends and noticed…"). NOT first-person, NOT second-person, NOT a quote.
- Cover the BREADTH of the entry, not just the first section.
- Lead with what the writer was doing or wrestling with, not their conclusion.
- Use specific nouns from the entry where they ground the summary.
- Don't moralize, don't editorialize, don't praise, don't include "the entry discusses" framing — just describe the content directly.`;

const SCHEMA = z.object({ summary: z.string() });

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const anthropic = createAnthropic({ apiKey });
  const model = anthropic("claude-sonnet-4-5");

  const dbPath =
    process.env.CHRONICLE_DB_PATH ?? path.join(process.cwd(), "data", "chronicle.db");
  const db = new Database(dbPath);

  type Row = {
    id: string;
    date: string;
    type: string;
    raw_text: string | null;
    formatted_content: string | null;
  };
  const rows = db
    .prepare<[], Row>(
      "SELECT id, date, type, raw_text, formatted_content FROM entries WHERE summary IS NULL",
    )
    .all();
  const candidates = rows.filter(
    (r) => (r.formatted_content ?? r.raw_text ?? "").trim().length > 0,
  );

  console.log(`Backfilling ${candidates.length} entries…`);
  const update = db.prepare("UPDATE entries SET summary = ? WHERE id = ?");

  for (const r of candidates) {
    process.stdout.write(`  ${r.date} ${r.type} ${r.id.slice(0, 8)} … `);
    try {
      const content = (r.formatted_content ?? r.raw_text ?? "").trim();
      const { object } = await generateObject({
        model,
        schema: SCHEMA,
        system: SYSTEM,
        prompt: `<formatted_entry>\n${content}\n</formatted_entry>`,
        maxOutputTokens: 400,
      });
      const summary = object.summary.trim();
      update.run(summary || null, r.id);
      console.log(`ok (${summary.length} chars)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED: ${msg}`);
    }
  }
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
