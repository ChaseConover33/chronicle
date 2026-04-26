"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lenses } from "@/db/schema";

export async function toggleLensAction(formData: FormData) {
  const lensId = String(formData.get("lensId") ?? "");
  const next = formData.get("next") === "true";
  if (!lensId) return;
  db.update(lenses).set({ active: next }).where(eq(lenses.id, lensId)).run();
  revalidatePath("/lenses");
  revalidatePath("/entry");
}
