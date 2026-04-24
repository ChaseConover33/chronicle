import { NextResponse } from "next/server";
import { cleanupSections, type CleanupSection } from "@/lib/cleanup";

export async function POST(request: Request) {
  const body = await request.json();
  const sections = body.sections as CleanupSection[] | undefined;
  if (!Array.isArray(sections)) {
    return NextResponse.json(
      { error: "sections array is required" },
      { status: 400 },
    );
  }
  try {
    const formattedContent = await cleanupSections(sections);
    return NextResponse.json({ formattedContent });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
