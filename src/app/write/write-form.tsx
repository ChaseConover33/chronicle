"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Domain, Template } from "@/db/schema";
import { saveDraftEntry } from "./actions";

type Props = {
  templates: Template[];
  domains: Domain[];
  initialDate: string;
  initialTemplateId?: string;
};

export function WriteForm({
  templates,
  domains,
  initialDate,
  initialTemplateId,
}: Props) {
  const [templateId, setTemplateId] = useState<string | undefined>(
    initialTemplateId,
  );
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const sections = activeTemplate?.sections ?? [];
  const visibleSections = sections.filter((s) => s.id !== "summary");

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={saveDraftEntry} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
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
          <Label htmlFor="templateId">Template</Label>
          <Select
            name="templateId"
            value={templateId}
            onValueChange={(v) => setTemplateId(v ?? undefined)}
          >
            <SelectTrigger id="templateId">
              <SelectValue placeholder="Pick a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTemplate?.description && (
        <p className="text-sm text-muted-foreground">
          {activeTemplate.description}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {visibleSections.map((section) => (
          <Card key={section.id}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-baseline justify-between">
                <Label htmlFor={`section:${section.id}`} className="text-base">
                  {section.heading}
                </Label>
                {!section.required && (
                  <span className="text-xs text-muted-foreground">optional</span>
                )}
              </div>
              <input type="hidden" name="sectionKey" value={section.id} />
              <Textarea
                id={`section:${section.id}`}
                name={`section:${section.id}`}
                placeholder={section.prompt}
                required={section.required}
                rows={4}
                className="resize-y"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Label>Domains</Label>
        <div className="flex flex-wrap gap-3">
          {domains.map((d) => (
            <label
              key={d.id}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selectedDomains.has(d.id)}
                onCheckedChange={() => toggleDomain(d.id)}
              />
              {selectedDomains.has(d.id) && (
                <input type="hidden" name="domainId" value={d.id} />
              )}
              <span>
                {d.icon} {d.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="lg">
          Save as Draft
        </Button>
      </div>
    </form>
  );
}
