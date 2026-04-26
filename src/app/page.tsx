import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { entries } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const recent = await db
    .select()
    .from(entries)
    .orderBy(desc(entries.createdAt))
    .limit(5)
    .all();

  const todayIso = new Date().toISOString().slice(0, 10);
  const wroteToday = recent.some((e) => e.date === todayIso && e.type === "daily");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight">Chronicle</h1>
          <p className="text-muted-foreground">
            A life reflection system disguised as a journal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Search
          </Link>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">
          {wroteToday ? "You wrote today." : "Today's entry"}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/write" className={buttonVariants({ size: "lg" })}>
            {wroteToday ? "Write another entry" : "Start writing"}
          </Link>
          <Link
            href="/calendar"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Calendar
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Recent entries</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No entries yet. Your first one is waiting.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((e) => (
              <Link key={e.id} href={`/entry/${e.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{e.date}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {e.type} · {e.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
