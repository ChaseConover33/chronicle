import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Entry } from "@/db/schema";
import {
  entryHeadline,
  formatEntryTitle,
  isSummaryType,
} from "@/lib/entry-title";

type Props = {
  entry: Pick<
    Entry,
    "id" | "date" | "type" | "status" | "rawText" | "formattedContent" | "summary"
  >;
};

export function EntryCard({ entry }: Props) {
  const isSummary = isSummaryType(entry.type);
  const heading = isSummary ? formatEntryTitle(entry) : entry.date;
  const body =
    entry.summary?.trim() || entryHeadline(entry, 220) || (isSummary ? "" : "(empty)");
  const typeLabel = entry.type.replace(/_/g, " ");

  return (
    <Link href={`/entry/${entry.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {heading} · <span className="normal-case">{typeLabel}</span>
            </div>
            {!entry.formattedContent && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                Draft
              </span>
            )}
          </div>
          {body && <p className="text-sm leading-6">{body}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
