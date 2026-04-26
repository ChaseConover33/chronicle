"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  previousYearRange,
  todayYmd,
  weekRange,
  yearRange,
} from "@/lib/dates";
import { DEFAULT_MODEL_ID, getModel } from "@/lib/models";

const STORAGE_KEY = "chronicle.model";

type PeriodChoice =
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "last-year"
  | "custom";

const CHOICES: { value: PeriodChoice; label: string }[] = [
  { value: "this-week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-year", label: "This year" },
  { value: "last-year", label: "Last year" },
  { value: "custom", label: "Custom date…" },
];

function rangeFor(
  choice: Exclude<PeriodChoice, "custom">,
): { period: "weekly" | "monthly" | "yearly"; date: string } {
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
    case "this-year":
      return { period: "yearly", date: yearRange(today).from };
    case "last-year":
      return { period: "yearly", date: previousYearRange(today).from };
  }
}

export function LensPeriodReflectionForm({ lensId }: { lensId: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<PeriodChoice>("last-week");
  const [customDate, setCustomDate] = useState<string>(todayYmd());
  const [customPeriod, setCustomPeriod] = useState<
    "weekly" | "monthly" | "yearly"
  >("weekly");
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

      const { period, date } =
        choice === "custom"
          ? { period: customPeriod, date: customDate }
          : rangeFor(choice);
      try {
        const response = await fetch(
          `/api/lenses/${lensId}/reflect-period`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ period, date, model_id: modelId }),
          },
        );
        const data = (await response.json()) as
          | { reflection_id: string }
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
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Period</Label>
          <Select
            value={choice}
            onValueChange={(v) => setChoice((v ?? "last-week") as PeriodChoice)}
          >
            <SelectTrigger className="h-9">
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
        </div>
        {choice === "custom" ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Anchor date + scope</Label>
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Select
                value={customPeriod}
                onValueChange={(v) =>
                  setCustomPeriod(
                    (v ?? "weekly") as "weekly" | "monthly" | "yearly",
                  )
                }
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-end">
          <Button onClick={submit} disabled={pending} className="h-9">
            {pending ? "Reflecting…" : "Generate"}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">Error: {error}</p>}
    </div>
  );
}
