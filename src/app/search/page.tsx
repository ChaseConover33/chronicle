import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { domains } from "@/db/schema";
import { parseSearchFilters, searchEntries } from "@/lib/search";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    domains?: string;
    from?: string;
    to?: string;
    type?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters = parseSearchFilters(sp);
  const allDomains = db
    .select()
    .from(domains)
    .orderBy(asc(domains.sortOrder))
    .all();

  const hasFilters =
    filters.query.length > 0 ||
    filters.domainIds.length > 0 ||
    !!filters.from ||
    !!filters.to ||
    !!filters.type;

  const results = hasFilters ? searchEntries(filters) : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Settings
        </Link>
      </div>

      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find past entries by text, domain, date, or type.
        </p>
      </header>

      <SearchForm domains={allDomains} initialFilters={filters} />

      <div className="mt-8">
        {!hasFilters ? (
          <p className="text-sm text-muted-foreground">
            Enter a query or pick a filter to search.
          </p>
        ) : (
          <SearchResults results={results} query={filters.query} />
        )}
      </div>
    </div>
  );
}
