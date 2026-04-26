import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { findRelatedEntries } from "@/lib/related";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("model_id") ?? undefined;

  const entry = db.select().from(entries).where(eq(entries.id, id)).get();
  if (!entry) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }

  try {
    const related = await findRelatedEntries(entry, modelId);
    return NextResponse.json({ related });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
