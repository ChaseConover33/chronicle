import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { templates, type Entry, type Template } from "@/db/schema";
import type { CleanupSection } from "./cleanup";

function parseRawText(rawText: string): { id: string; body: string }[] {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const result: { id: string; body: string }[] = [];
  let currentId: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (currentId !== null) {
      result.push({ id: currentId, body: buf.join("\n").trim() });
    }
    buf = [];
  };

  for (const line of lines) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match) {
      flush();
      currentId = match[1];
    } else if (currentId !== null) {
      buf.push(line);
    }
  }
  flush();
  return result.filter((r) => r.body.length > 0);
}

export function sectionsForCleanup(entry: Entry): CleanupSection[] {
  const raw = entry.rawText ?? "";
  const parsed = parseRawText(raw);
  if (parsed.length === 0) return [];

  let template: Template | undefined;
  if (entry.template) {
    template = db
      .select()
      .from(templates)
      .where(eq(templates.id, entry.template))
      .get();
  }

  const headingById = new Map<string, string>();
  if (template) {
    for (const s of template.sections) {
      headingById.set(s.id, s.heading);
    }
  }

  return parsed.map((p) => ({
    heading: headingById.get(p.id) ?? prettifyId(p.id),
    rawText: p.body,
  }));
}

function prettifyId(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
