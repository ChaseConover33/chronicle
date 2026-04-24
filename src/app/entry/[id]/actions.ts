"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { cleanupSections } from "@/lib/cleanup";
import { sectionsForCleanup } from "@/lib/entry-sections";

export async function generateCleanupAction(
  entryId: string,
): Promise<{ ok: true; formattedContent: string } | { ok: false; error: string }> {
  try {
    const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
    if (!entry) return { ok: false, error: "entry not found" };

    const sections = sectionsForCleanup(entry);
    if (sections.length === 0) {
      return { ok: false, error: "entry has no content to clean up" };
    }
    const formattedContent = await cleanupSections(sections);
    return { ok: true, formattedContent };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function saveCleanupAction(
  entryId: string,
  formattedContent: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
  if (!entry) return { ok: false, error: "entry not found" };

  db.update(entries)
    .set({
      formattedContent,
      updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
    })
    .where(eq(entries.id, entryId))
    .run();

  revalidatePath(`/entry/${entryId}`);
  revalidatePath("/");
  return { ok: true };
}
