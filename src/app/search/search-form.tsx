"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Domain } from "@/db/schema";
import type { EntryType, SearchFilters } from "@/lib/search";

const ANY_TYPE = "any";
const TYPE_OPTIONS: { value: EntryType | typeof ANY_TYPE; label: string }[] = [
  { value: ANY_TYPE, label: "Any type" },
  { value: "daily", label: "Daily" },
  { value: "retrospective", label: "Retrospective" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "decade", label: "Decade" },
];

type Props = {
  domains: Domain[];
  initialFilters: SearchFilters;
};

export function SearchForm({ domains, initialFilters }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialFilters.query);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    new Set(initialFilters.domainIds),
  );
  const [from, setFrom] = useState(initialFilters.from ?? "");
  const [to, setTo] = useState(initialFilters.to ?? "");
  const [type, setType] = useState<string>(initialFilters.type ?? ANY_TYPE);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedDomains.size > 0) {
      params.set("domains", Array.from(selectedDomains).join(","));
    }
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type && type !== ANY_TYPE) params.set("type", type);
    router.push(`/search?${params.toString()}`);
  };

  const clear = () => {
    setQuery("");
    setSelectedDomains(new Set());
    setFrom("");
    setTo("");
    setType(ANY_TYPE);
    router.push("/search");
  };

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="search-q">Query</Label>
        <input
          id="search-q"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search raw text or organized content. ⌘K to focus."
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Domains</Label>
        <div className="flex flex-wrap gap-2">
          {domains.map((d) => {
            const selected = selectedDomains.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDomain(d.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-transparent text-muted-foreground hover:bg-accent"
                }`}
              >
                {d.icon} {d.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="search-from">From</Label>
          <input
            id="search-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="search-to">To</Label>
          <input
            id="search-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="search-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? ANY_TYPE)}>
            <SelectTrigger id="search-type">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={clear}>
          Clear
        </Button>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}
