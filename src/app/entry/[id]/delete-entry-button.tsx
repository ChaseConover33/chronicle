"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteEntryAction } from "./actions";

type Props = { entryId: string };

export function DeleteEntryButton({ entryId }: Props) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (
      !window.confirm(
        "Delete this entry? This is permanent — the entry, its domain tags, and any lens reflections will be removed.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("entryId", entryId);
      await deleteEntryAction(formData);
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
