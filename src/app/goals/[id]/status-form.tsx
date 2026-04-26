"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteGoalAction, updateGoalStatusAction } from "../actions";

const STATUSES = ["active", "paused", "achieved", "abandoned"] as const;
type Status = (typeof STATUSES)[number];

export function GoalStatusForm({
  goalId,
  status,
}: {
  goalId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  const setStatus = (next: Status) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("goalId", goalId);
      fd.set("status", next);
      await updateGoalStatusAction(fd);
    });
  };

  const remove = () => {
    if (!window.confirm("Delete this goal and all progress assessments?")) {
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("goalId", goalId);
      await deleteGoalAction(fd);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
        disabled={pending}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        onClick={remove}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        Delete
      </Button>
    </div>
  );
}
