"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Domain, Lens } from "@/db/schema";
import { createGoalAction } from "./actions";

type Props = {
  domains: Domain[];
  lenses: Lens[];
};

export function GoalCreateForm({ domains, lenses }: Props) {
  const domainLabel = (v: unknown) => {
    if (v === "none" || !v) return "None";
    const d = domains.find((x) => x.id === v);
    return d ? `${d.icon} ${d.name}` : "None";
  };
  const lensLabel = (v: unknown) => {
    if (v === "none" || !v) return "None";
    const l = lenses.find((x) => x.id === v);
    return l ? l.name : "None";
  };
  return (
    <Card>
      <CardContent className="p-5">
        <form action={createGoalAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Run 3 times per week"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What does success look like? Why does this matter?"
              rows={3}
              className="resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetDate">Target date</Label>
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Domain (optional)</Label>
              <Select name="domainId" defaultValue="none">
                <SelectTrigger className="h-9">
                  <SelectValue>{(v) => domainLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.icon} {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lens (optional)</Label>
              <Select name="lensId" defaultValue="none">
                <SelectTrigger className="h-9">
                  <SelectValue>{(v) => lensLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {lenses.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Create goal</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
