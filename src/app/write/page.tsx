import Link from "next/link";
import { getGoal } from "@/lib/goal-evaluation";
import { WriteForm } from "./write-form";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; goal?: string }>;
}) {
  const sp = await searchParams;
  const initialDate = sp.date ?? new Date().toISOString().slice(0, 10);
  const goal = sp.goal ? getGoal(sp.goal) : undefined;

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
        </div>
      </div>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New Entry</h1>
      {goal && (
        <div className="mb-6 rounded-md border border-primary/40 bg-primary/5 p-4">
          <div className="text-xs uppercase tracking-wide text-primary">
            Reflecting on goal
          </div>
          <div className="mt-1 font-medium">{goal.title}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Why has this stalled, and what would change it? Talk it out — your
            entry gets tagged to the goal so the next evaluation can read your
            thinking.
          </p>
        </div>
      )}
      <WriteForm initialDate={initialDate} goalId={goal?.id} />
    </div>
  );
}
