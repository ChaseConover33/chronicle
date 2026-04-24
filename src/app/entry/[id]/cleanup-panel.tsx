"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateCleanupAction, saveCleanupAction } from "./actions";

type Props = { entryId: string };

export function CleanupPanel({ entryId }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runCleanup = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateCleanupAction(entryId);
      if (result.ok) {
        setPreview(result.formattedContent);
      } else {
        setError(result.error);
      }
    });
  };

  const accept = () => {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      const result = await saveCleanupAction(entryId, preview);
      if (!result.ok) setError(result.error);
    });
  };

  if (preview !== null) {
    return (
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Cleanup preview</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setError(null);
              }}
              disabled={pending}
            >
              Discard
            </Button>
            <Button variant="outline" onClick={runCleanup} disabled={pending}>
              {pending ? "Redoing…" : "Redo"}
            </Button>
            <Button onClick={accept} disabled={pending}>
              {pending ? "Saving…" : "Accept"}
            </Button>
          </div>
        </div>
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
        {error && (
          <p className="text-sm text-destructive">Error: {error}</p>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6 border-dashed bg-muted/40">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          This entry hasn&apos;t been through AI cleanup yet. Showing the raw text.
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button onClick={runCleanup} disabled={pending}>
            {pending ? "Cleaning up…" : "Clean up with AI"}
          </Button>
          {error && <p className="text-xs text-destructive">Error: {error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
