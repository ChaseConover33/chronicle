import { desc } from "drizzle-orm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { CalendarGrid } from "./calendar-grid";

export default async function CalendarPage() {
  const rows = await db
    .select({
      id: entries.id,
      date: entries.date,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .orderBy(desc(entries.createdAt))
    .all();

  const byDate = new Map<
    string,
    { firstEntryId: string; count: number }
  >();
  for (const r of rows) {
    const existing = byDate.get(r.date);
    if (existing) {
      existing.count += 1;
    } else {
      byDate.set(r.date, { firstEntryId: r.id, count: 1 });
    }
  }

  const days = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    firstEntryId: v.firstEntryId,
    count: v.count,
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <Link href="/write" className={buttonVariants({ variant: "outline" })}>
          New entry
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dots mark days with entries. Click a day to read it, or an empty day
          to write.
        </p>
      </header>

      <div className="flex flex-col items-center gap-6">
        <CalendarGrid days={days} />
        <div className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "entry" : "entries"} total
        </div>
      </div>
    </div>
  );
}
