import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { domains, entries, entryDomains, tags } from "@/db/schema";
import { CleanupPanel } from "./cleanup-panel";
import { EntryArticle } from "./entry-article";

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

  const showCleanupPanel = !entry.formattedContent;
  const autoStart = sp.autoclean === "1";

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
        <div className="text-sm text-muted-foreground capitalize">
          {entry.type} · {entry.status}
          {entry.publishedAt ? ` · published ${entry.publishedAt.slice(0, 10)}` : ""}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{entry.date}</h1>
      </header>

      {showCleanupPanel && (
        <CleanupPanel
          entryId={entry.id}
          domains={allDomains}
          autoStart={autoStart}
        />
      )}

      <EntryArticle
        formattedContent={entry.formattedContent}
        rawText={entry.rawText}
      />

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
