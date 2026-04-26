import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { lenses } from "@/db/schema";
import {
  formatGeneratedDate,
  formatPeriodTitle,
} from "@/lib/entry-title";
import { listLensPeriodReflections } from "@/lib/lens-period-reflection";
import { LensPeriodReflectionForm } from "./period-reflection-form";

export const dynamic = "force-dynamic";

export default async function LensDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lens = db.select().from(lenses).where(eq(lenses.id, id)).get();
  if (!lens) notFound();

  const periodReflections = listLensPeriodReflections(id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/lenses"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Lenses
        </Link>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{lens.name}</h1>
          {lens.active && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs uppercase tracking-wide text-primary">
              Active
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          A reflective frame the AI uses to see your entries from one
          perspective. Per-entry reflections appear on the entry view; period
          reflections (this page) span a stretch of entries.
        </p>
      </header>

      <section className="mb-10 flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          The lens
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                System prompt
              </div>
              <p className="whitespace-pre-wrap text-sm">{lens.systemPrompt}</p>
            </div>
            {lens.analysisQuestions.length > 0 && (
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Analysis questions (per entry)
                </div>
                <ul className="list-disc pl-5 text-sm">
                  {lens.analysisQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {lens.summaryFocus.length > 0 && (
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Summary focus (across periods)
                </div>
                <ul className="list-disc pl-5 text-sm">
                  {lens.summaryFocus.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mb-10 flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Generate a period reflection
        </h2>
        <p className="text-sm text-muted-foreground">
          Reflect over a stretch of daily entries through this lens. Past
          reflections from this lens get fed in as prior context so the new one
          can notice continuity or shifts.
        </p>
        <LensPeriodReflectionForm lensId={id} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Past period reflections ({periodReflections.length})
        </h2>
        {periodReflections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None yet. Generate one above.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {periodReflections.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {formatPeriodTitle(r.period, r.rangeFrom, r.rangeTo)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.period} · generated {formatGeneratedDate(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  <article
                    className="
                      leading-7
                      [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold
                      [&_h2:first-child]:mt-0
                      [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold
                      [&_p]:my-2
                      [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                      [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                      [&_li]:my-1
                      [&_em]:italic
                    "
                  >
                    <ReactMarkdown>{r.reflection}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
