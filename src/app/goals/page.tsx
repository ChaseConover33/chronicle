import { asc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { domains, lenses } from "@/db/schema";
import { listAllGoals } from "@/lib/goal-evaluation";
import { GoalCreateForm } from "./goal-create-form";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const all = listAllGoals();
  const domainRows = db
    .select()
    .from(domains)
    .orderBy(asc(domains.sortOrder))
    .all();
  const lensRows = db.select().from(lenses).orderBy(asc(lenses.sortOrder)).all();

  const active = all.filter((g) => g.status === "active");
  const archived = all.filter((g) => g.status !== "active");

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
        <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
        <p className="text-sm text-muted-foreground">
          Goals you&apos;re working toward. AI evaluates your progress against
          your daily entries each week — referencing specific entries as
          evidence — and assigns a trajectory.
        </p>
      </header>

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Add a goal
        </h2>
        <GoalCreateForm domains={domainRows} lenses={lensRows} />
      </section>

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active goals yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((g) => (
              <Link key={g.id} href={`/goals/${g.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex flex-col gap-1 p-4">
                    <div className="font-medium">{g.title}</div>
                    {g.description && (
                      <p className="text-sm text-muted-foreground">
                        {g.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {g.targetDate ? `Target: ${g.targetDate}` : "Open-ended"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
            Archived ({archived.length})
          </h2>
          <div className="flex flex-col gap-3">
            {archived.map((g) => (
              <Link key={g.id} href={`/goals/${g.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/50 opacity-70">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {g.status}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
