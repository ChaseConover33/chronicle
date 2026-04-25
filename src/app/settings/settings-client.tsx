"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_MODEL_ID,
  type ModelEntry,
  type ProviderAvailability,
  type ProviderId,
  type ProviderInfo,
  estimatedCostPerEntry,
  formatCost,
  getModel,
} from "@/lib/models";

const STORAGE_KEY = "chronicle.model";

type Props = {
  models: ModelEntry[];
  providers: Record<ProviderId, ProviderInfo>;
  apiAvailability: Partial<Record<ProviderId, ProviderAvailability>>;
  ollama: ProviderAvailability & { models?: string[] };
};

export function SettingsClient({
  models,
  providers,
  apiAvailability,
  ollama,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_MODEL_ID);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && getModel(stored)) setSelectedId(stored);
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  };

  const groupedByProvider = useMemo(() => {
    const groups = new Map<ProviderId, ModelEntry[]>();
    for (const m of models) {
      const arr = groups.get(m.provider) ?? [];
      arr.push(m);
      groups.set(m.provider, arr);
    }
    return groups;
  }, [models]);

  const ollamaModels: ModelEntry[] = (ollama.models ?? []).map((name) => ({
    id: `ollama:${name}`,
    provider: "ollama",
    label: name,
    blurb: "Local model — runs on your machine, free",
    inputCostPerM: 0,
    outputCostPerM: 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      {Array.from(groupedByProvider.entries()).map(([providerId, list]) => {
        const provider = providers[providerId];
        const availability = apiAvailability[providerId];
        const isAvailable = availability?.available ?? false;
        return (
          <ProviderSection
            key={providerId}
            provider={provider}
            models={list}
            available={isAvailable}
            unavailableReason={availability?.reason}
            selectedId={selectedId}
            onSelect={select}
          />
        );
      })}

      <ProviderSection
        provider={providers.ollama}
        models={ollamaModels}
        available={ollama.available}
        unavailableReason={ollama.reason}
        selectedId={selectedId}
        onSelect={select}
        emptyHint={
          ollama.available && ollamaModels.length === 0
            ? "Ollama is running but no models pulled yet."
            : undefined
        }
      />

      <p className="text-xs text-muted-foreground">
        Selection is stored in your browser&apos;s localStorage under{" "}
        <code>{STORAGE_KEY}</code>. When account-based settings ship, this will
        sync across devices.
      </p>
    </div>
  );
}

function ProviderSection({
  provider,
  models,
  available,
  unavailableReason,
  selectedId,
  onSelect,
  emptyHint,
}: {
  provider: ProviderInfo;
  models: ModelEntry[];
  available: boolean;
  unavailableReason?: string;
  selectedId: string;
  onSelect: (id: string) => void;
  emptyHint?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-medium">{provider.label}</h2>
        {!available && (
          <span className="text-xs text-muted-foreground">
            {unavailableReason ?? "unavailable"}
          </span>
        )}
      </div>
      {models.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyHint ?? "No models configured."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {models.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              available={available}
              selected={m.id === selectedId}
              onSelect={() => onSelect(m.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ModelCard({
  model,
  available,
  selected,
  onSelect,
}: {
  model: ModelEntry;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const cost =
    model.inputCostPerM === 0 && model.outputCostPerM === 0
      ? "free (local)"
      : formatCost(estimatedCostPerEntry(model));

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!available}
      className={`text-left transition-colors ${
        !available ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Card
        className={
          selected
            ? "border-primary bg-primary/5"
            : "hover:bg-accent/40"
        }
      >
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-medium">{model.label}</div>
            <div className="text-xs text-muted-foreground">{cost}</div>
          </div>
          <div className="text-sm text-muted-foreground">{model.blurb}</div>
          {selected && (
            <div className="text-xs font-medium text-primary">✓ selected</div>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
