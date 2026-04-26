import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import {
  entries,
  lensReflections,
  lenses,
  type Entry,
  type Lens,
} from "@/db/schema";
import { getLanguageModel } from "./language-model";
import { DEFAULT_MODEL_ID } from "./models";
import {
  buildLensReflectionPrompt,
  buildLensReflectionSystemPrompt,
} from "./lens-reflection-prompt";

const REFLECTION_SCHEMA = z.object({
  reflection: z
    .string()
    .describe(
      `The reflection as markdown, beginning with a "## <Lens Name>" heading.`,
    ),
});

export type GenerateLensReflectionInput = {
  entry: Entry;
  lens: Lens;
  modelId?: string;
};

export async function generateLensReflection(
  input: GenerateLensReflectionInput,
): Promise<string> {
  const content = (input.entry.formattedContent ?? input.entry.rawText ?? "").trim();
  if (content.length === 0) {
    throw new Error("entry has no content to reflect on");
  }
  const { object } = await generateObject({
    model: getLanguageModel(input.modelId ?? DEFAULT_MODEL_ID),
    schema: REFLECTION_SCHEMA,
    system: buildLensReflectionSystemPrompt(input.lens),
    prompt: buildLensReflectionPrompt({ entry: input.entry, lens: input.lens }),
    maxOutputTokens: 4000,
  });
  return object.reflection.trim();
}

export type SaveLensReflectionInput = {
  entryId: string;
  lensId: string;
  reflection: string;
};

export function saveLensReflection(input: SaveLensReflectionInput): string {
  const id = randomUUID();
  db.insert(lensReflections)
    .values({
      id,
      entryId: input.entryId,
      lensId: input.lensId,
      reflection: input.reflection,
    })
    .run();
  return id;
}

export function getEntry(entryId: string): Entry | undefined {
  return db.select().from(entries).where(eq(entries.id, entryId)).get();
}

export function getLens(lensId: string): Lens | undefined {
  return db.select().from(lenses).where(eq(lenses.id, lensId)).get();
}

export function getReflectionsForEntry(
  entryId: string,
): { id: string; lensId: string; reflection: string; createdAt: string }[] {
  return db
    .select({
      id: lensReflections.id,
      lensId: lensReflections.lensId,
      reflection: lensReflections.reflection,
      createdAt: lensReflections.createdAt,
    })
    .from(lensReflections)
    .where(eq(lensReflections.entryId, entryId))
    .all();
}
