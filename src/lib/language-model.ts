import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOllama } from "ai-sdk-ollama";
import type { LanguageModel } from "ai";
import { ollamaModelName, resolveModel } from "./models";

export function getLanguageModel(
  modelId: string | undefined | null,
): LanguageModel {
  const entry = resolveModel(modelId);
  switch (entry.provider) {
    case "anthropic":
      return anthropic(entry.id);
    case "openai":
      return openai(entry.id);
    case "google":
      return google(entry.id);
    case "xai":
      return xai(entry.id);
    case "deepseek":
      return deepseek(entry.id);
    case "ollama": {
      const ollama = createOllama({
        baseURL: process.env.OLLAMA_URL ?? "http://localhost:11434/api",
      });
      return ollama(ollamaModelName(entry.id));
    }
  }
}
