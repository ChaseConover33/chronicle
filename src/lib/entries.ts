import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { entries, entryDomains, type NewEntry } from "@/db/schema";

export type CreateEntryInput = {
  date: string;
  type: NewEntry["type"];
  templateId?: string;
  sectionContent: Record<string, string>;
  domainIds?: string[];
};

function buildRawText(sectionContent: Record<string, string>): string {
  return Object.entries(sectionContent)
    .filter(([, v]) => v.trim().length > 0)
    .map(([id, v]) => `# ${id}\n\n${v.trim()}`)
    .join("\n\n");
}

export function createEntry(input: CreateEntryInput): string {
  const id = randomUUID();
  const rawText = buildRawText(input.sectionContent);

  db.transaction((tx) => {
    tx.insert(entries)
      .values({
        id,
        date: input.date,
        type: input.type,
        status: "draft",
        template: input.templateId ?? null,
        rawText,
        formattedContent: null,
      })
      .run();

    if (input.domainIds?.length) {
      input.domainIds.forEach((domainId) => {
        tx.insert(entryDomains).values({ entryId: id, domainId }).run();
      });
    }
  });

  return id;
}
