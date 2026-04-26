import { asc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { lenses } from "@/db/schema";
import { toggleLensAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LensesPage() {
  const all = db.select().from(lenses).orderBy(asc(lenses.sortOrder)).all();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Chronicle
        </Link>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Lenses</h1>
        <p className="text-sm text-muted-foreground">
          Lenses are interpretive frames the AI uses to reflect on your entries.
          Activate the ones that match how you want to see your life. Each
          active lens generates its own reflection per entry and its own
          contribution to weekly/monthly summaries.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {all.map((lens) => (
          <Card
            key={lens.id}
            className={lens.active ? "border-primary/40 bg-primary/5" : ""}
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/lenses/${lens.id}`}
                      className="font-medium hover:underline underline-offset-4"
                    >
                      {lens.name}
                    </Link>
                    {lens.active && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lens.systemPrompt.length > 220
                      ? `${lens.systemPrompt.slice(0, 220)}…`
                      : lens.systemPrompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lens.analysisQuestions.length} analysis questions ·{" "}
                    {lens.summaryFocus.length} summary focus points
                  </p>
                </div>
                <form action={toggleLensAction}>
                  <input type="hidden" name="lensId" value={lens.id} />
                  <input
                    type="hidden"
                    name="next"
                    value={String(!lens.active)}
                  />
                  <button
                    type="submit"
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      lens.active
                        ? "border-input bg-transparent hover:bg-accent"
                        : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {lens.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
