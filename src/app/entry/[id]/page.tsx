import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { domains, entries, entryDomains, tags } from "@/db/schema";
import { CleanupPanel } from "./cleanup-panel";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const content = entry.formattedContent ?? entry.rawText ?? "";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <Link
          href="/write"
          className={buttonVariants({ variant: "outline", size: "default" })}
        >
          New entry
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <div className="text-sm text-muted-foreground capitalize">
          {entry.type} · {entry.status}
          {entry.publishedAt ? ` · published ${entry.publishedAt.slice(0, 10)}` : ""}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{entry.date}</h1>
      </header>

      {!entry.formattedContent && <CleanupPanel entryId={entry.id} />}

      <article
        className="
          max-w-none leading-7
          [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold
          [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold
          [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium
          [&_p]:my-3
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6
          [&_li]:my-1
          [&_a]:text-primary [&_a]:underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic
          [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm
          [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3
        "
      >
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground italic">No content.</p>
        )}
      </article>

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
