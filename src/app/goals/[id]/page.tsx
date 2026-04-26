import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { domains, lenses } from "@/db/schema";
import { entryHeadline, formatGeneratedDate } from "@/lib/entry-title";
import {
  getGoal,
  listEntriesForGoal,
  listGoalProgress,
} from "@/lib/goal-evaluation";
import { GoalEvaluateButton } from "./evaluate-button";
import { GoalStatusForm } from "./status-form";

export const dynamic = "force-dynamic";

const TRAJECTORY_LABELS: Record<string, string> = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
  achieved: "Achieved",
  abandoned: "Abandoned",
};

const TRAJECTORY_CLASSES: Record<string, string> = {
  on_track:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  at_risk:
    "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  off_track:
    "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200",
  achieved:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
  abandoned:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const goal = getGoal(id);
  if (!goal) notFound();

  const progress = listGoalProgress(id);
  const taggedEntries = listEntriesForGoal(id);
  const latestProgress = progress[0];
  const reflectionPending =
    latestProgress != null &&
    (latestProgress.trajectory === "at_risk" ||
      latestProgress.trajectory === "off_track") &&
    taggedEntries.some((e) => e.createdAt > latestProgress.createdAt);
  const domain = goal.domainId
    ? db.select().from(domains).where(eq(domains.id, goal.domainId)).get()
    : undefined;
  const lens = goal.lensId
    ? db.select().from(lenses).where(eq(lenses.id, goal.lensId)).get()
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/goals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Goals
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {goal.title}
          </h1>
          <GoalStatusForm goalId={goal.id} status={goal.status} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Status: {goal.status}</span>
          {goal.targetDate && <span>· Target: {goal.targetDate}</span>}
          {domain && (
            <span>
              · Domain: {domain.icon} {domain.name}
            </span>
          )}
          {lens && <span>· Lens: {lens.name}</span>}
        </div>
        {goal.description && (
          <p className="mt-3 text-sm whitespace-pre-wrap">
            {goal.description}
          </p>
        )}
      </header>

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Evaluate progress
        </h2>
        <p className="text-sm text-muted-foreground">
          AI reads your daily entries for the chosen period and assigns a
          trajectory. Prior assessments get fed in so it can spot momentum and
          slippage.
        </p>
        {reflectionPending && (
          <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
            You&rsquo;ve reflected since the last assessment. Re-evaluate to
            see if the trajectory has shifted.
          </p>
        )}
        <GoalEvaluateButton goalId={goal.id} />
      </section>

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Tagged entries ({taggedEntries.length})
        </h2>
        {taggedEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No entries tagged to this goal yet. Reflections you write from the
            home page&rsquo;s prompt land here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {taggedEntries.map((e) => {
              const headline = entryHeadline(e);
              return (
                <Link key={e.id} href={`/entry/${e.id}`} className="block">
                  <Card className="transition-colors hover:bg-accent/50">
                    <CardContent className="flex flex-col gap-1 p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-medium">
                          {headline || e.date}
                        </div>
                        {!e.formattedContent && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.date} · <span className="capitalize">{e.type.replace(/_/g, " ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Progress history ({progress.length})
        </h2>
        {progress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No progress assessments yet. Click Evaluate above to run one.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {progress.map((p) => {
              const trajectoryKey = p.trajectory ?? "";
              const label = TRAJECTORY_LABELS[trajectoryKey] ?? "—";
              const cls = TRAJECTORY_CLASSES[trajectoryKey] ?? "bg-muted";
              return (
                <Card key={p.id}>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${cls}`}
                        >
                          {label}
                        </span>
                        {p.rangeFrom && p.rangeTo && (
                          <span className="text-xs text-muted-foreground">
                            {p.rangeFrom} – {p.rangeTo}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Generated {formatGeneratedDate(p.createdAt)}
                      </span>
                    </div>
                    <article
                      className="
                        text-sm leading-6
                        [&_p]:my-1
                      "
                    >
                      <ReactMarkdown>{p.assessment}</ReactMarkdown>
                    </article>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
