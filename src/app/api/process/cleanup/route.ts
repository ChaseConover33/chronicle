import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { domains } from "@/db/schema";
import { cleanupBraindump, type AvailableDomain } from "@/lib/cleanup";

export async function POST(request: Request) {
  const body = await request.json();
  const rawText = typeof body.raw_text === "string" ? body.raw_text : "";
  if (rawText.trim().length === 0) {
    return NextResponse.json(
      { error: "raw_text is required" },
      { status: 400 },
    );
  }

  let availableDomains: AvailableDomain[] = Array.isArray(
    body.available_domains,
  )
    ? body.available_domains
        .filter(
          (d: unknown): d is AvailableDomain =>
            !!d &&
            typeof d === "object" &&
            "id" in d &&
            "name" in d &&
            typeof (d as AvailableDomain).id === "string" &&
            typeof (d as AvailableDomain).name === "string",
        )
        .map((d: AvailableDomain) => ({ id: d.id, name: d.name }))
    : [];

  if (availableDomains.length === 0) {
    const rows = db
      .select({ id: domains.id, name: domains.name })
      .from(domains)
      .orderBy(asc(domains.sortOrder))
      .all();
    availableDomains = rows;
  }

  const modelId = typeof body.model_id === "string" ? body.model_id : undefined;

  try {
    const result = await cleanupBraindump(rawText, availableDomains, modelId);
    return NextResponse.json({
      formatted_content: result.formattedContent,
      summary: result.summary,
      suggested_domain_ids: result.suggestedDomainIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
