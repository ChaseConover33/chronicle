"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Domain } from "@/db/schema";
import { generateCleanupAction, saveCleanupAction } from "./actions";

type Props = {
  entryId: string;
  domains: Domain[];
  autoStart: boolean;
};

export function CleanupPanel({ entryId, domains, autoStart }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const startedRef = useRef(false);

  const runCleanup = () => {
    setError(null);
    setEditing(false);
    startTransition(async () => {
      const result = await generateCleanupAction(entryId);
      if (result.ok) {
        setPreview(result.formattedContent);
        setSelectedDomains(new Set(result.suggestedDomainIds));
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      runCleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const accept = () => {
    if (preview === null) return;
    setError(null);
    startTransition(async () => {
      const result = await saveCleanupAction(
        entryId,
        preview,
        Array.from(selectedDomains),
      );
      if (result.ok) {
        router.replace(`/entry/${entryId}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  if (preview !== null) {
    return (
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Cleanup preview {editing && <span className="text-muted-foreground">· editing</span>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setEditing(false);
                setSelectedDomains(new Set());
                setError(null);
              }}
              disabled={pending}
            >
              Discard
            </Button>
            <Button variant="outline" onClick={runCleanup} disabled={pending}>
              {pending ? "Redoing…" : "Redo"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing((v) => !v)}
              disabled={pending}
            >
              {editing ? "Done" : "Edit"}
            </Button>
            <Button onClick={accept} disabled={pending}>
              {pending ? "Saving…" : "Accept"}
            </Button>
          </div>
        </div>
        {editing ? (
          <Textarea
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            rows={Math.max(12, preview.split("\n").length + 2)}
            className="resize-y font-mono text-sm leading-6"
          />
        ) : (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent
              className="
                p-5 leading-7
                [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold
                [&_h2:first-child]:mt-0
                [&_p]:my-2
                [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                [&_li]:my-1
              "
            >
              <ReactMarkdown>{preview}</ReactMarkdown>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Domains {selectedDomains.size > 0 && `(${selectedDomains.size})`}
          </div>
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => {
              const selected = selectedDomains.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDomain(d.id)}
                  disabled={pending}
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
          <p className="text-xs text-muted-foreground">
            Tap to toggle. Suggested domains are pre-selected — adjust as
            needed before accepting.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">Error: {error}</p>}
      </div>
    );
  }

  return (
    <Card className="mb-6 border-dashed bg-muted/40">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {pending
            ? "Organizing your braindump and tagging domains…"
            : "This entry hasn't been organized yet. Showing the raw text."}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={runCleanup} disabled={pending}>
            {pending ? "Working…" : "Organize with AI"}
          </Button>
          {error && <p className="text-xs text-destructive">Error: {error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
