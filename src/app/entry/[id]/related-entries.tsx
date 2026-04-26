"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/models";
import type { RelatedEntry } from "@/lib/related";

const STORAGE_KEY = "chronicle.model";

type Props = {
  entryId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "ready"; results: RelatedEntry[] }
  | { status: "error"; message: string };

export function RelatedEntries({ entryId }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const modelId = stored && getModel(stored) ? stored : DEFAULT_MODEL_ID;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/entries/${entryId}/related?model_id=${encodeURIComponent(modelId)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as
          | { related: RelatedEntry[] }
          | { error: string };
        if (cancelled) return;
        if (!response.ok || "error" in data) {
          setState({
            status: "error",
            message: "error" in data ? data.error : `HTTP ${response.status}`,
          });
        } else {
          setState({ status: "ready", results: data.related });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (state.status === "loading") {
    return (
      <section className="mt-10 border-t pt-6">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
          Related entries
        </h2>
        <p className="text-sm text-muted-foreground">Looking for connections…</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mt-10 border-t pt-6">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
          Related entries
        </h2>
        <p className="text-sm text-destructive">
          Couldn&apos;t fetch related entries: {state.message}
        </p>
      </section>
    );
  }

  if (state.results.length === 0) return null;

  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        Related entries
      </h2>
      <div className="flex flex-col gap-3">
        {state.results.map((r) => (
          <Link key={r.id} href={`/entry/${r.id}`} className="block">
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium">{r.date}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {r.type}
                  </div>
                </div>
                <p className="text-sm italic text-foreground">{r.reason}</p>
                {r.snippet && (
                  <p className="text-sm text-muted-foreground">{r.snippet}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
