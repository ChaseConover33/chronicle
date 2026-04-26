import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult } from "@/lib/search";

type Props = {
  results: SearchResult[];
  query: string;
};

export function SearchResults({ results, query }: Props) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entries match. Try removing a filter or broadening the query.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {results.length === 100
          ? "Showing the first 100 results — refine your filters to narrow."
          : `${results.length} ${results.length === 1 ? "entry" : "entries"}`}
      </p>
      {results.map((entry) => (
        <Link key={entry.id} href={`/entry/${entry.id}`} className="block">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <div className="font-medium">{entry.date}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {entry.type}
                  </div>
                  {!entry.formattedContent && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                      Draft — needs cleanup
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.createdAt.slice(0, 10)}
                </div>
              </div>
              {entry.snippet && (
                <p className="text-sm text-muted-foreground">
                  <Highlight text={entry.snippet} query={query} />
                </p>
              )}
              {entry.domains.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.domains.map((d) => (
                    <span
                      key={d.id}
                      className="rounded-full border px-2 py-0.5 text-xs"
                    >
                      {d.icon} {d.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(needle, cursor);
    if (idx === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark
        key={`${idx}`}
        className="rounded bg-primary/20 px-0.5 text-foreground"
      >
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    cursor = idx + query.length;
  }
  return <>{parts}</>;
}
