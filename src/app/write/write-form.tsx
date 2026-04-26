"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveDraftEntry } from "./actions";

type Props = {
  initialDate: string;
  goalId?: string;
};

export function WriteForm({ initialDate, goalId }: Props) {
  return (
    <form action={saveDraftEntry} className="flex flex-col gap-6">
      {goalId && <input type="hidden" name="goalId" value={goalId} />}
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="date">Date</Label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={initialDate}
          required
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rawText">Braindump</Label>
        <p className="text-sm text-muted-foreground">
          Just talk. Don&apos;t worry about structure — the AI will organize it
          and tag domains for you. Tip: tap{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">
            Fn
          </kbd>{" "}
          twice to dictate.
        </p>
        <Textarea
          id="rawText"
          name="rawText"
          required
          rows={18}
          autoFocus
          placeholder="What's on your mind? It can be all over the place — just get it out."
          className="resize-y text-base leading-7"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="lg">
          Save &amp; Organize
        </Button>
      </div>
    </form>
  );
}
