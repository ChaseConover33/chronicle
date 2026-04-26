"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { goals } from "@/db/schema";

export async function createGoalAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const targetDate = String(formData.get("targetDate") ?? "").trim() || null;
  const domainId = String(formData.get("domainId") ?? "").trim() || null;
  const lensId = String(formData.get("lensId") ?? "").trim() || null;

  if (!title) return;

  const id = randomUUID();
  db.insert(goals)
    .values({
      id,
      title,
      description,
      targetDate,
      domainId: domainId === "none" ? null : domainId,
      lensId: lensId === "none" ? null : lensId,
      status: "active",
    })
    .run();
  revalidatePath("/goals");
  redirect(`/goals/${id}`);
}

export async function updateGoalStatusAction(formData: FormData) {
  const goalId = String(formData.get("goalId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (
    !goalId ||
    !["active", "achieved", "paused", "abandoned"].includes(status)
  ) {
    return;
  }
  db.update(goals)
    .set({ status: status as "active" | "achieved" | "paused" | "abandoned" })
    .where(eq(goals.id, goalId))
    .run();
  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
}

export async function deleteGoalAction(formData: FormData) {
  const goalId = String(formData.get("goalId") ?? "");
  if (!goalId) return;
  db.delete(goals).where(eq(goals.id, goalId)).run();
  revalidatePath("/goals");
  redirect("/goals");
}
