import Link from "next/link";
import { WriteForm } from "./write-form";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const initialDate = sp.date ?? new Date().toISOString().slice(0, 10);

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
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
        </div>
      </div>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New Entry</h1>
      <WriteForm initialDate={initialDate} />
    </div>
  );
}
