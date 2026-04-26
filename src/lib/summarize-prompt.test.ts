import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Lens } from "@/db/schema";
import {
  buildSummaryPrompt,
  type SummarySource,
} from "./summarize-prompt";

const SOURCE_A: SummarySource = {
  id: "a-id",
  date: "2026-04-20",
  type: "daily",
  content: "## Morning Run\n\nWent on a 5 mile run, felt strong.",
};

const SOURCE_B: SummarySource = {
  id: "b-id",
  date: "2026-04-22",
  type: "daily",
  content: "## Budget Fight With Sarah\n\nWe argued about refinancing again.",
};

const FAITH_LENS: Lens = {
  id: "faith-id",
  name: "Faith (Christian)",
  systemPrompt: "Christian lens prompt",
  analysisQuestions: ["q1", "q2"],
  summaryFocus: [
    "Patterns of provision or answered prayer",
    "Growth in character",
  ],
  isBuiltin: true,
  active: true,
  sortOrder: 0,
};

describe("buildSummaryPrompt", () => {
  it("includes the date range and period label", () => {
    const prompt = buildSummaryPrompt({
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A, SOURCE_B],
      lenses: [],
    });
    assert.match(prompt, /week/);
    assert.match(prompt, /2026-04-20/);
    assert.match(prompt, /2026-04-26/);
  });

  it("includes every source entry's content", () => {
    const prompt = buildSummaryPrompt({
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A, SOURCE_B],
      lenses: [],
    });
    assert.match(prompt, /Morning Run/);
    assert.match(prompt, /Budget Fight With Sarah/);
    assert.match(prompt, /5 mile run/);
    assert.match(prompt, /refinancing again/);
  });

  it("tags each source with its id, date, and type for traceability", () => {
    const prompt = buildSummaryPrompt({
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
      lenses: [],
    });
    assert.match(prompt, /<source id="a-id" date="2026-04-20" type="daily">/);
    assert.match(prompt, /<\/source>/);
  });

  it("renders a 'no active lenses' note when lenses is empty", () => {
    const prompt = buildSummaryPrompt({
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
      lenses: [],
    });
    assert.match(prompt, /No active lenses/);
  });

  it("includes each active lens's summary focus points", () => {
    const prompt = buildSummaryPrompt({
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
      lenses: [FAITH_LENS],
    });
    assert.match(prompt, /Faith \(Christian\)/);
    assert.match(prompt, /Patterns of provision or answered prayer/);
    assert.match(prompt, /Growth in character/);
  });

  it("differentiates monthly vs weekly in the period label", () => {
    const monthly = buildSummaryPrompt({
      period: "monthly",
      range: { from: "2026-04-01", to: "2026-04-30" },
      sources: [SOURCE_A],
      lenses: [],
    });
    assert.match(monthly, /\bmonth\b/);
    assert.doesNotMatch(monthly, /\bweek\b/);
  });
});
