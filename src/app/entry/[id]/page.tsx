import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import {
  domains,
  entries,
  entryDomains,
  entryGoals,
  goals,
  lensReflections,
  lenses,
  tags,
} from "@/db/schema";
import { getLatestProgress } from "@/lib/goal-evaluation";
import {
  PROVIDERS,
  checkApiProviderAvailability,
  type ProviderId,
} from "@/lib/models";
import {
  formatEntryTitle,
  formatGeneratedDate,
  isSummaryType,
} from "@/lib/entry-title";
import { CleanupPanel } from "./cleanup-panel";
import { DeleteEntryButton } from "./delete-entry-button";
import { EntryArticle } from "./entry-article";
import { LensReflections } from "./lens-reflections";
import { RelatedEntries } from "./related-entries";

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoclean?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const entry = db.select().from(entries).where(eq(entries.id, id)).get();
  if (!entry) notFound();

  const domainLinks = db
    .select()
    .from(entryDomains)
    .where(eq(entryDomains.entryId, id))
    .all();

  const entryDomainList =
    domainLinks.length === 0
      ? []
      : db
          .select()
          .from(domains)
          .where(
            inArray(
              domains.id,
              domainLinks.map((d) => d.domainId),
            ),
          )
          .all();

  const entryTags = db.select().from(tags).where(eq(tags.entryId, id)).all();

  const allDomains = db
    .select()
    .from(domains)
    .orderBy(asc(domains.sortOrder))
    .all();

  const reflectionGoal =
    entry.type === "goal_reflection"
      ? db
          .select({
            id: goals.id,
            title: goals.title,
            status: goals.status,
          })
          .from(goals)
          .innerJoin(entryGoals, eq(entryGoals.goalId, goals.id))
          .where(eq(entryGoals.entryId, id))
          .get()
      : undefined;
  const reflectionTrajectory = reflectionGoal
    ? getLatestProgress(reflectionGoal.id)?.trajectory ?? null
    : null;

  const showCleanupPanel = !entry.formattedContent;
  const autoStart = sp.autoclean === "1";

  const apiProviderIds = (Object.keys(PROVIDERS) as ProviderId[]).filter(
    (id) => !PROVIDERS[id].isLocal,
  );
  const availableProviders = apiProviderIds.filter(
    (id) => checkApiProviderAvailability(id).available,
  );

  const activeLenses = db
    .select({ id: lenses.id, name: lenses.name })
    .from(lenses)
    .where(eq(lenses.active, true))
    .orderBy(asc(lenses.sortOrder))
    .all();
  const existingReflections = db
    .select({
      id: lensReflections.id,
      lensId: lensReflections.lensId,
      reflection: lensReflections.reflection,
      createdAt: lensReflections.createdAt,
    })
    .from(lensReflections)
    .where(eq(lensReflections.entryId, id))
    .all();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>
          <Link
            href="/lenses"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Lenses
          </Link>
          <Link
            href="/goals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Goals
          </Link>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
          <Link
            href="/write"
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            New entry
          </Link>
        </div>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground capitalize">
            {entry.type.replace(/_/g, " ")} · {entry.status}
            {entry.publishedAt
              ? ` · published ${entry.publishedAt.slice(0, 10)}`
              : ""}
          </div>
          <DeleteEntryButton entryId={entry.id} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatEntryTitle(entry)}
        </h1>
        {isSummaryType(entry.type) && (
          <p className="text-sm text-muted-foreground">
            Generated {formatGeneratedDate(entry.createdAt)}
          </p>
        )}
        {reflectionGoal && (
          <Link
            href={`/goals/${reflectionGoal.id}`}
            className="mt-1 inline-flex items-center gap-2 self-start rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm hover:bg-primary/10"
          >
            <span className="text-xs uppercase tracking-wide text-primary">
              On goal
            </span>
            <span className="font-medium">{reflectionGoal.title}</span>
            {reflectionTrajectory && (
              <span className="text-xs text-muted-foreground">
                · {reflectionTrajectory.replace(/_/g, " ")} at write-time
              </span>
            )}
          </Link>
        )}
      </header>

      {showCleanupPanel && (
        <CleanupPanel
          entryId={entry.id}
          domains={allDomains}
          autoStart={autoStart}
          availableProviders={availableProviders}
        />
      )}

      <EntryArticle
        formattedContent={entry.formattedContent}
        rawText={entry.rawText}
      />

      {entry.formattedContent && entryDomainList.length > 0 && (
        <RelatedEntries entryId={entry.id} />
      )}

      {entry.formattedContent && (
        <LensReflections
          entryId={entry.id}
          activeLenses={activeLenses}
          existing={existingReflections}
        />
      )}

      {(entryDomainList.length > 0 || entryTags.length > 0) && (
        <aside className="mt-10 flex flex-col gap-4 border-t pt-6">
          {entryDomainList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Domains
              </span>
              {entryDomainList.map((d) => (
                <span
                  key={d.id}
                  className="rounded-full border px-2.5 py-0.5 text-sm"
                >
                  {d.icon} {d.name}
                </span>
              ))}
            </div>
          )}
          {entryTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Tags
              </span>
              {entryTags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-sm"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
