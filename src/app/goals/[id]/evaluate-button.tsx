"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  monthRange,
  previousMonthRange,
  previousWeekRange,
  todayYmd,
  weekRange,
} from "@/lib/dates";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/models";

const STORAGE_KEY = "chronicle.model";

type Choice = "this-week" | "last-week" | "this-month" | "last-month";

const CHOICES: { value: Choice; label: string }[] = [
  { value: "this-week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
];

function rangeFor(choice: Choice): {
  period: "weekly" | "monthly";
  date: string;
} {
  const today = todayYmd();
  switch (choice) {
    case "this-week":
      return { period: "weekly", date: weekRange(today).from };
    case "last-week":
      return { period: "weekly", date: previousWeekRange(today).from };
    case "this-month":
      return { period: "monthly", date: monthRange(today).from };
    case "last-month":
      return { period: "monthly", date: previousMonthRange(today).from };
  }
}

export function GoalEvaluateButton({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>("last-week");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      const modelId = stored && getModel(stored) ? stored : DEFAULT_MODEL_ID;
      const { period, date } = rangeFor(choice);
      try {
        const response = await fetch(`/api/goals/${goalId}/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period, date, model_id: modelId }),
        });
        const data = (await response.json()) as
          | { progress_id: string }
          | { error: string };
        if (!response.ok || "error" in data) {
          setError("error" in data ? data.error : `HTTP ${response.status}`);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={choice}
          onValueChange={(v) => setChoice((v ?? "last-week") as Choice)}
        >
          <SelectTrigger className="h-9 min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHOICES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={pending}>
          {pending ? "Evaluating…" : "Evaluate"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">Error: {error}</p>}
    </div>
  );
}
