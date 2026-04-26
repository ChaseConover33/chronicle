import { NextResponse } from "next/server";
import {
  generateLensReflection,
  getEntry,
  getLens,
  saveLensReflection,
} from "@/lib/lens-reflection";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: entryId } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const lensId = typeof body.lens_id === "string" ? body.lens_id : "";
  const modelId = typeof body.model_id === "string" ? body.model_id : undefined;

  if (!lensId) {
    return NextResponse.json({ error: "lens_id is required" }, { status: 400 });
  }

  const entry = getEntry(entryId);
  if (!entry) {
    return NextResponse.json({ error: "entry not found" }, { status: 404 });
  }
  const lens = getLens(lensId);
  if (!lens) {
    return NextResponse.json({ error: "lens not found" }, { status: 404 });
  }

  try {
    const reflection = await generateLensReflection({ entry, lens, modelId });
    const reflectionId = saveLensReflection({
      entryId,
      lensId,
      reflection,
    });
    return NextResponse.json({
      reflection_id: reflectionId,
      reflection,
      lens_id: lensId,
      lens_name: lens.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
