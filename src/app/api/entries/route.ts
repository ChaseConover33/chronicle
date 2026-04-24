import { NextResponse } from "next/server";
import { createEntry } from "@/lib/entries";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.date || !body.type) {
    return NextResponse.json(
      { error: "date and type are required" },
      { status: 400 },
    );
  }
  const id = createEntry({
    date: body.date,
    type: body.type,
    templateId: body.templateId,
    sectionContent: body.sectionContent ?? {},
    domainIds: body.domainIds ?? [],
  });
  return NextResponse.json({ id }, { status: 201 });
}
