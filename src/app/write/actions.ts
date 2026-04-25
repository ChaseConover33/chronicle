"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEntry } from "@/lib/entries";

export async function saveDraftEntry(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const rawText = String(formData.get("rawText") ?? "").trim();

  if (!date || !rawText) {
    redirect("/write");
  }

  const id = createEntry({
    date,
    type: "daily",
    rawText,
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/entry/${id}?autoclean=1`);
}
