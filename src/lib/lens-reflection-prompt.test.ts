import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Lens } from "@/db/schema";
import {
  buildLensReflectionPrompt,
  buildLensReflectionSystemPrompt,
} from "./lens-reflection-prompt";

const FAITH_LENS: Lens = {
  id: "faith-id",
  name: "Faith (Christian)",
  systemPrompt: "Christian framing about grace and provision.",
  analysisQuestions: [
    "Where did you see God working today?",
    "What are you trusting God with?",
  ],
  summaryFocus: ["Patterns of provision"],
  isBuiltin: true,
  active: true,
  sortOrder: 0,
};

const SAMPLE_ENTRY = {
  id: "entry-id",
  date: "2026-04-25",
  type: "daily" as const,
  rawText: "Raw text fallback.",
  formattedContent: "## Morning Prayer\n\nPrayed today and felt at peace.",
};

describe("buildLensReflectionSystemPrompt", () => {
  it("includes the lens's own system prompt verbatim", () => {
    const prompt = buildLensReflectionSystemPrompt(FAITH_LENS);
    assert.match(prompt, /Christian framing about grace and provision\./);
  });
  it("instructs the model to begin with the lens's heading", () => {
    const prompt = buildLensReflectionSystemPrompt(FAITH_LENS);
    assert.match(prompt, /## Faith \(Christian\)/);
  });
  it("forbids medical advice and moralizing", () => {
    const prompt = buildLensReflectionSystemPrompt(FAITH_LENS);
    assert.match(prompt, /never diagnose/i);
    assert.match(prompt, /never moralize/i);
  });
});

describe("buildLensReflectionPrompt", () => {
  it("includes the entry's formatted content", () => {
    const prompt = buildLensReflectionPrompt({
      entry: SAMPLE_ENTRY,
      lens: FAITH_LENS,
    });
    assert.match(prompt, /Morning Prayer/);
    assert.match(prompt, /Prayed today and felt at peace/);
  });
  it("falls back to raw_text when formatted_content is null", () => {
    const prompt = buildLensReflectionPrompt({
      entry: { ...SAMPLE_ENTRY, formattedContent: null },
      lens: FAITH_LENS,
    });
    assert.match(prompt, /Raw text fallback\./);
  });
  it("numbers the lens's analysis questions", () => {
    const prompt = buildLensReflectionPrompt({
      entry: SAMPLE_ENTRY,
      lens: FAITH_LENS,
    });
    assert.match(prompt, /1\. Where did you see God working today\?/);
    assert.match(prompt, /2\. What are you trusting God with\?/);
  });
  it("tags the entry with date and type for traceability", () => {
    const prompt = buildLensReflectionPrompt({
      entry: SAMPLE_ENTRY,
      lens: FAITH_LENS,
    });
    assert.match(prompt, /<entry date="2026-04-25" type="daily">/);
  });
  it("instructs the model to start with the lens heading", () => {
    const prompt = buildLensReflectionPrompt({
      entry: SAMPLE_ENTRY,
      lens: FAITH_LENS,
    });
    assert.match(prompt, /beginning with "## Faith \(Christian\)"/);
  });
});
