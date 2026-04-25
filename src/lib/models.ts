export type ProviderId =
  | "anthropic"
  | "openai"
  | "google"
  | "xai"
  | "deepseek"
  | "ollama";

export type ModelEntry = {
  id: string;
  provider: ProviderId;
  label: string;
  blurb: string;
  inputCostPerM: number;
  outputCostPerM: number;
  isDefault?: boolean;
};

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  envVar?: string;
  isLocal?: boolean;
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  anthropic: { id: "anthropic", label: "Anthropic", envVar: "ANTHROPIC_API_KEY" },
  openai: { id: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY" },
  google: {
    id: "google",
    label: "Google",
    envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
  xai: { id: "xai", label: "xAI", envVar: "XAI_API_KEY" },
  deepseek: { id: "deepseek", label: "DeepSeek", envVar: "DEEPSEEK_API_KEY" },
  ollama: { id: "ollama", label: "Ollama (local)", isLocal: true },
};

export const MODELS: ModelEntry[] = [
  {
    id: "claude-opus-4-7",
    provider: "anthropic",
    label: "Opus 4.7",
    blurb: "Best quality, slowest, most expensive",
    inputCostPerM: 15,
    outputCostPerM: 75,
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    label: "Sonnet 4.6",
    blurb: "Balanced — recommended default",
    inputCostPerM: 3,
    outputCostPerM: 15,
    isDefault: true,
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    label: "Haiku 4.5",
    blurb: "Fast and cheap",
    inputCostPerM: 1,
    outputCostPerM: 5,
  },
  {
    id: "gpt-5",
    provider: "openai",
    label: "GPT-5",
    blurb: "Most capable OpenAI model",
    inputCostPerM: 1.25,
    outputCostPerM: 10,
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    label: "GPT-5 mini",
    blurb: "Smaller GPT-5 — cheap and fast",
    inputCostPerM: 0.25,
    outputCostPerM: 2,
  },
  {
    id: "gpt-5-nano",
    provider: "openai",
    label: "GPT-5 nano",
    blurb: "Smallest GPT-5 — cheapest API option here",
    inputCostPerM: 0.05,
    outputCostPerM: 0.4,
  },
  {
    id: "gemini-2.5-pro",
    provider: "google",
    label: "Gemini 2.5 Pro",
    blurb: "Google's most capable model",
    inputCostPerM: 1.25,
    outputCostPerM: 10,
  },
  {
    id: "gemini-2.5-flash",
    provider: "google",
    label: "Gemini 2.5 Flash",
    blurb: "Fast and inexpensive",
    inputCostPerM: 0.3,
    outputCostPerM: 2.5,
  },
  {
    id: "deepseek-chat",
    provider: "deepseek",
    label: "DeepSeek V3",
    blurb: "Strong open-weight model, very cheap API",
    inputCostPerM: 0.27,
    outputCostPerM: 1.1,
  },
  {
    id: "deepseek-reasoner",
    provider: "deepseek",
    label: "DeepSeek R1",
    blurb: "Reasoning model — slower, more thorough",
    inputCostPerM: 0.55,
    outputCostPerM: 2.19,
  },
  {
    id: "grok-4",
    provider: "xai",
    label: "Grok 4",
    blurb: "xAI's flagship model",
    inputCostPerM: 3,
    outputCostPerM: 15,
  },
];

export const DEFAULT_MODEL_ID = MODELS.find((m) => m.isDefault)?.id ?? MODELS[0].id;

export function getModel(id: string | undefined | null): ModelEntry | undefined {
  if (!id) return undefined;
  if (id.startsWith("ollama:")) {
    const name = id.slice("ollama:".length);
    return {
      id,
      provider: "ollama",
      label: name,
      blurb: "Local Ollama model",
      inputCostPerM: 0,
      outputCostPerM: 0,
    };
  }
  return MODELS.find((m) => m.id === id);
}

export function ollamaModelName(id: string): string {
  return id.startsWith("ollama:") ? id.slice("ollama:".length) : id;
}

export function resolveModel(id: string | undefined | null): ModelEntry {
  return getModel(id) ?? getModel(DEFAULT_MODEL_ID)!;
}

const TYPICAL_INPUT_TOKENS = 2000;
const TYPICAL_OUTPUT_TOKENS = 800;

export function estimatedCostPerEntry(model: ModelEntry): number {
  return (
    (TYPICAL_INPUT_TOKENS * model.inputCostPerM +
      TYPICAL_OUTPUT_TOKENS * model.outputCostPerM) /
    1_000_000
  );
}

export function formatCost(cost: number): string {
  if (cost === 0) return "free";
  if (cost < 0.001) return `~$${(cost * 1000).toFixed(2)}/1k entries`;
  if (cost < 0.01) return `~$${cost.toFixed(4)}/entry`;
  return `~$${cost.toFixed(3)}/entry`;
}

export type ProviderAvailability = {
  provider: ProviderId;
  available: boolean;
  reason?: string;
};

export function checkApiProviderAvailability(
  provider: ProviderId,
): ProviderAvailability {
  const info = PROVIDERS[provider];
  if (info.isLocal) {
    return { provider, available: false, reason: "use checkOllamaAvailability" };
  }
  if (!info.envVar) {
    return { provider, available: true };
  }
  const present = !!process.env[info.envVar];
  return present
    ? { provider, available: true }
    : { provider, available: false, reason: `set ${info.envVar} to enable` };
}

export async function checkOllamaAvailability(
  baseUrl: string = process.env.OLLAMA_URL ?? "http://localhost:11434",
): Promise<ProviderAvailability & { models?: string[] }> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      return {
        provider: "ollama",
        available: false,
        reason: `Ollama at ${baseUrl} returned HTTP ${response.status}`,
      };
    }
    const data = (await response.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    if (models.length === 0) {
      return {
        provider: "ollama",
        available: false,
        reason: "Ollama is running but no models pulled — try: ollama pull llama3.2",
      };
    }
    return { provider: "ollama", available: true, models };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      provider: "ollama",
      available: false,
      reason: `Ollama not reachable at ${baseUrl} (${msg})`,
    };
  }
}
