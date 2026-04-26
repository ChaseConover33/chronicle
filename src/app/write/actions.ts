"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEntry } from "@/lib/entries";
import { getGoal, tagEntryToGoal } from "@/lib/goal-evaluation";

export async function saveDraftEntry(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const rawText = String(formData.get("rawText") ?? "").trim();
  const goalId = String(formData.get("goalId") ?? "").trim() || undefined;

  if (!date || !rawText) {
    redirect("/write");
  }

  const isGoalReflection = !!(goalId && getGoal(goalId));

  const id = createEntry({
    date,
    type: isGoalReflection ? "goal_reflection" : "daily",
    rawText,
  });

  if (isGoalReflection && goalId) {
    tagEntryToGoal(id, goalId);
    revalidatePath(`/goals/${goalId}`);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/entry/${id}?autoclean=1`);
}
