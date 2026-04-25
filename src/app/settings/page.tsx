import Link from "next/link";
import {
  MODELS,
  PROVIDERS,
  checkApiProviderAvailability,
  checkOllamaAvailability,
  type ProviderId,
} from "@/lib/models";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const apiProviderIds: ProviderId[] = (
    Object.keys(PROVIDERS) as ProviderId[]
  ).filter((id) => !PROVIDERS[id].isLocal);

  const apiAvailability = Object.fromEntries(
    apiProviderIds.map((id) => [id, checkApiProviderAvailability(id)]),
  );

  const ollama = await checkOllamaAvailability();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Chronicle
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Pick the model used for cleanup and domain inference. Choice is saved
          to your browser only — no account needed.
        </p>
      </header>

      <SettingsClient
        models={MODELS}
        providers={PROVIDERS}
        apiAvailability={apiAvailability}
        ollama={ollama}
      />
    </div>
  );
}
