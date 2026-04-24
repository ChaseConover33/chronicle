"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";

type DayInfo = {
  date: string; // YYYY-MM-DD
  firstEntryId: string;
  count: number;
};

type Props = {
  days: DayInfo[];
};

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CalendarGrid({ days }: Props) {
  const router = useRouter();

  const { hasEntryDates, dayMap } = useMemo(() => {
    const map = new Map<string, DayInfo>();
    for (const d of days) map.set(d.date, d);
    const dates = days.map((d) => {
      const [y, m, day] = d.date.split("-").map(Number);
      return new Date(y, m - 1, day);
    });
    return { hasEntryDates: dates, dayMap: map };
  }, [days]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const ymd = localYmd(date);
    const info = dayMap.get(ymd);
    if (info && info.count === 1) {
      router.push(`/entry/${info.firstEntryId}`);
    } else if (info && info.count > 1) {
      router.push(`/calendar/day/${ymd}`);
    } else {
      router.push(`/write?date=${ymd}`);
    }
  };

  return (
    <Calendar
      mode="single"
      onSelect={handleSelect}
      modifiers={{ hasEntry: hasEntryDates }}
      modifiersClassNames={{
        hasEntry:
          "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
      }}
      className="mx-auto"
    />
  );
}
