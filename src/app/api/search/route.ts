import { NextResponse } from "next/server";
import { parseSearchFilters, searchEntries } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseSearchFilters({
    q: searchParams.get("q") ?? undefined,
    domains: searchParams.get("domains") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  const results = searchEntries(filters);

  return NextResponse.json({
    filters,
    count: results.length,
    entries: results.map((e) => ({
      id: e.id,
      date: e.date,
      type: e.type,
      status: e.status,
      content: e.formattedContent ?? e.rawText ?? "",
      has_cleanup: !!e.formattedContent,
      domains: e.domains.map((d) => ({ id: d.id, name: d.name })),
      snippet: e.snippet,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    })),
  });
}
