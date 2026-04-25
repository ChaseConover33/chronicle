"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { domains, entries, entryDomains } from "@/db/schema";
import { cleanupBraindump } from "@/lib/cleanup";

export type CleanupActionResult =
  | {
      ok: true;
      formattedContent: string;
      suggestedDomainIds: string[];
    }
  | { ok: false; error: string };

export async function generateCleanupAction(
  entryId: string,
): Promise<CleanupActionResult> {
  try {
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
    if (!entry) return { ok: false, error: "entry not found" };

    const rawText = entry.rawText ?? "";
    if (rawText.trim().length === 0) {
      return { ok: false, error: "entry has no content to clean up" };
    }

    const availableDomains = db
      .select({ id: domains.id, name: domains.name })
      .from(domains)
      .orderBy(asc(domains.sortOrder))
      .all();

    const result = await cleanupBraindump(rawText, availableDomains);
    return {
      ok: true,
      formattedContent: result.formattedContent,
      suggestedDomainIds: result.suggestedDomainIds,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function saveCleanupAction(
  entryId: string,
  formattedContent: string,
  selectedDomainIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
  if (!entry) return { ok: false, error: "entry not found" };

  db.transaction((tx) => {
    tx.update(entries)
      .set({
        formattedContent,
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(entries.id, entryId))
      .run();

    tx.delete(entryDomains).where(eq(entryDomains.entryId, entryId)).run();
    for (const domainId of selectedDomainIds) {
      tx.insert(entryDomains).values({ entryId, domainId }).run();
    }
  });

  revalidatePath(`/entry/${entryId}`);
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true };
}
