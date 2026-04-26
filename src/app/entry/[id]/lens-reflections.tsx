"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/models";

const STORAGE_KEY = "chronicle.model";

type LensSummary = {
  id: string;
  name: string;
};

type ExistingReflection = {
  id: string;
  lensId: string;
  reflection: string;
  createdAt: string;
};

type Props = {
  entryId: string;
  activeLenses: LensSummary[];
  existing: ExistingReflection[];
};

type State = {
  reflections: Map<string, ExistingReflection>;
  pendingLensId: string | null;
  errorByLens: Map<string, string>;
};

export function LensReflections({ entryId, activeLenses, existing }: Props) {
  const [state, setState] = useState<State>(() => ({
    reflections: new Map(existing.map((r) => [r.lensId, r])),
    pendingLensId: null,
    errorByLens: new Map(),
  }));
  const [, startTransition] = useTransition();

  const orderedLenses = useMemo(() => activeLenses, [activeLenses]);

  const generate = (lensId: string) => {
    setState((prev) => ({
      ...prev,
      pendingLensId: lensId,
      errorByLens: new Map(prev.errorByLens).set(lensId, ""),
    }));
    startTransition(async () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const modelId = stored && getModel(stored) ? stored : DEFAULT_MODEL_ID;
      try {
        const response = await fetch(`/api/entries/${entryId}/reflect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lens_id: lensId, model_id: modelId }),
        });
        const data = (await response.json()) as
          | {
              reflection_id: string;
              reflection: string;
            }
          | { error: string };
        if (!response.ok || "error" in data) {
          const msg = "error" in data ? data.error : `HTTP ${response.status}`;
          setState((prev) => ({
            ...prev,
            pendingLensId: null,
            errorByLens: new Map(prev.errorByLens).set(lensId, msg),
          }));
          return;
        }
        setState((prev) => ({
          ...prev,
          pendingLensId: null,
          reflections: new Map(prev.reflections).set(lensId, {
            id: data.reflection_id,
            lensId,
            reflection: data.reflection,
            createdAt: new Date().toISOString(),
          }),
          errorByLens: new Map(prev.errorByLens).set(lensId, ""),
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          pendingLensId: null,
          errorByLens: new Map(prev.errorByLens).set(lensId, msg),
        }));
      }
    });
  };

  if (orderedLenses.length === 0) {
    return (
      <section className="mt-10 border-t pt-6">
        <h2 className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
          Lens reflections
        </h2>
        <p className="text-sm text-muted-foreground">
          No lenses are active.{" "}
          <Link
            href="/lenses"
            className="text-primary underline-offset-4 hover:underline"
          >
            Activate one
          </Link>{" "}
          to see this entry through a different frame.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 flex flex-col gap-4 border-t pt-6">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
        Lens reflections
      </h2>
      {orderedLenses.map((lens) => {
        const reflection = state.reflections.get(lens.id);
        const error = state.errorByLens.get(lens.id);
        const pending = state.pendingLensId === lens.id;
        if (reflection) {
          return (
            <Card key={lens.id}>
              <CardContent
                className="
                  flex flex-col gap-3 p-4 leading-7
                  [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold
                  [&_h2:first-child]:mt-0
                  [&_p]:my-2
                  [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                  [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                  [&_li]:my-1
                "
              >
                <ReactMarkdown>{reflection.reflection}</ReactMarkdown>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generate(lens.id)}
                    disabled={pending}
                  >
                    {pending ? "Regenerating…" : "Regenerate"}
                  </Button>
                </div>
                {error && (
                  <p className="text-xs text-destructive">Error: {error}</p>
                )}
              </CardContent>
            </Card>
          );
        }
        return (
          <Card key={lens.id} className="border-dashed">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{lens.name}</div>
                <p className="text-xs text-muted-foreground">
                  No reflection yet.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate(lens.id)}
                  disabled={pending}
                >
                  {pending ? "Generating…" : "Generate reflection"}
                </Button>
                {error && (
                  <p className="text-xs text-destructive">Error: {error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
