import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { entries, entryDomains, type NewEntry } from "@/db/schema";

export type CreateEntryInput = {
  date: string;
  type: NewEntry["type"];
  templateId?: string;
  rawText: string;
  domainIds?: string[];
};

export function createEntry(input: CreateEntryInput): string {
  const id = randomUUID();

  db.transaction((tx) => {
    tx.insert(entries)
      .values({
        id,
        date: input.date,
        type: input.type,
        status: "draft",
        template: input.templateId ?? null,
        rawText: input.rawText,
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
