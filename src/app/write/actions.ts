"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEntry } from "@/lib/entries";

export async function saveDraftEntry(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const sectionKeys = formData.getAll("sectionKey").map(String);
  const domainIds = formData.getAll("domainId").map(String);

  const sectionContent: Record<string, string> = {};
  for (const key of sectionKeys) {
    sectionContent[key] = String(formData.get(`section:${key}`) ?? "");
  }

  const id = createEntry({
    date,
    type: "daily",
    templateId: templateId || undefined,
    sectionContent,
    domainIds,
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/entry/${id}`);
}
