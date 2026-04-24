import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entries } from "@/db/schema";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();

  const existing = db.select().from(entries).where(eq(entries.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }

  if (existing.status === "published" && !body.confirm) {
    return NextResponse.json(
      { error: "confirm: true required to update a published entry" },
      { status: 400 },
    );
  }

  const update: Partial<typeof entries.$inferInsert> = {
    updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
  if (typeof body.formattedContent === "string") {
    update.formattedContent = body.formattedContent;
  }
  if (body.status === "draft" || body.status === "published") {
    update.status = body.status;
    if (body.status === "published" && !existing.publishedAt) {
      update.publishedAt = new Date().toISOString();
    }
  }

  db.update(entries).set(update).where(eq(entries.id, id)).run();
  const updated = db.select().from(entries).where(eq(entries.id, id)).get();
  return NextResponse.json({ entry: updated });
}
