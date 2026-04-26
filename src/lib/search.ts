import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  like,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { domains, entries, entryDomains, type Entry } from "@/db/schema";

export type EntryType = Entry["type"];

const VALID_TYPES: EntryType[] = [
  "daily",
  "retrospective",
  "weekly",
  "monthly",
  "yearly",
  "decade",
];

export type SearchFilters = {
  query: string;
  domainIds: string[];
  from: string | undefined;
  to: string | undefined;
  type: EntryType | undefined;
};

export type SearchResult = Entry & {
  domains: { id: string; name: string; icon: string | null }[];
  snippet: string;
};

export function parseSearchFilters(searchParams: {
  q?: string;
  domains?: string;
  from?: string;
  to?: string;
  type?: string;
}): SearchFilters {
  const query = (searchParams.q ?? "").trim();
  const domainIds = (searchParams.domains ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = isYmd(searchParams.from) ? searchParams.from : undefined;
  const to = isYmd(searchParams.to) ? searchParams.to : undefined;
  const type =
    searchParams.type && (VALID_TYPES as string[]).includes(searchParams.type)
      ? (searchParams.type as EntryType)
      : undefined;
  return { query, domainIds, from, to, type };
}

function isYmd(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

const SNIPPET_RADIUS = 80;

function makeSnippet(entry: Entry, query: string): string {
  const source = (entry.formattedContent ?? entry.rawText ?? "").trim();
  if (!source) return "";
  if (!query) return source.slice(0, SNIPPET_RADIUS * 2);
  const lower = source.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return source.slice(0, SNIPPET_RADIUS * 2);
  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(source.length, idx + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < source.length ? "…" : "";
  return `${prefix}${source.slice(start, end)}${suffix}`;
}

export function searchEntries(filters: SearchFilters): SearchResult[] {
  const conds: (SQL | undefined)[] = [];

  if (filters.query.length > 0) {
    const pattern = `%${escapeLike(filters.query)}%`;
    conds.push(
      or(like(entries.rawText, pattern), like(entries.formattedContent, pattern)),
    );
  }
  if (filters.from) conds.push(gte(entries.date, filters.from));
  if (filters.to) conds.push(lte(entries.date, filters.to));
  if (filters.type) conds.push(eq(entries.type, filters.type));

  let entryIdsByDomain: Set<string> | undefined;
  if (filters.domainIds.length > 0) {
    const links = db
      .select({ entryId: entryDomains.entryId })
      .from(entryDomains)
      .where(inArray(entryDomains.domainId, filters.domainIds))
      .all();
    entryIdsByDomain = new Set(links.map((r) => r.entryId));
    if (entryIdsByDomain.size === 0) return [];
    conds.push(inArray(entries.id, Array.from(entryIdsByDomain)));
  }

  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = db
    .select()
    .from(entries)
    .where(where)
    .orderBy(desc(entries.date), desc(entries.createdAt))
    .limit(100)
    .all();

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const domainLinks = db
    .select({
      entryId: entryDomains.entryId,
      id: domains.id,
      name: domains.name,
      icon: domains.icon,
      sortOrder: domains.sortOrder,
    })
    .from(entryDomains)
    .innerJoin(domains, eq(domains.id, entryDomains.domainId))
    .where(inArray(entryDomains.entryId, ids))
    .orderBy(asc(domains.sortOrder))
    .all();

  const byEntry = new Map<string, SearchResult["domains"]>();
  for (const link of domainLinks) {
    const arr = byEntry.get(link.entryId) ?? [];
    arr.push({ id: link.id, name: link.name, icon: link.icon });
    byEntry.set(link.entryId, arr);
  }

  return rows.map((entry) => ({
    ...entry,
    domains: byEntry.get(entry.id) ?? [],
    snippet: makeSnippet(entry, filters.query),
  }));
}
