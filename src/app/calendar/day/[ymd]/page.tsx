import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { entryHeadline } from "@/lib/entry-title";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export default async function DayPage({
  params,
}: {
  params: Promise<{ ymd: string }>;
}) {
  const { ymd } = await params;
  if (!YMD.test(ymd)) notFound();

  const rows = db
    .select()
    .from(entries)
    .where(eq(entries.date, ymd))
    .orderBy(asc(entries.createdAt))
    .all();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/calendar"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Calendar
        </Link>
        <Link
          href={`/write?date=${ymd}`}
          className={buttonVariants({ variant: "outline" })}
        >
          Add another entry
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{ymd}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"} on this day
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries yet for this day.{" "}
          <Link
            href={`/write?date=${ymd}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            Write one
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((e) => {
            const body = e.summary?.trim() || entryHeadline(e, 220) || "(empty)";
            return (
              <Link key={e.id} href={`/entry/${e.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex flex-col gap-1.5 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {e.type.replace(/_/g, " ")} · {e.status}
                      </div>
                      <div className="flex items-center gap-2">
                        {!e.formattedContent && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                            Draft
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {e.createdAt.slice(11, 16)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-6">{body}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
