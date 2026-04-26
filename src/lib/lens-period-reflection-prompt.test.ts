import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Lens } from "@/db/schema";
import {
  buildLensPeriodPrompt,
  buildLensPeriodSystemPrompt,
} from "./lens-period-reflection-prompt";
import type { SummarySource } from "./summarize-prompt";

const FAITH_LENS: Lens = {
  id: "faith-id",
  name: "Faith (Christian)",
  systemPrompt: "Christian framing about grace and provision.",
  analysisQuestions: [
    "Where did you see God working today?",
    "What are you trusting God with?",
  ],
  summaryFocus: ["Patterns of provision", "Growth in character"],
  isBuiltin: true,
  active: true,
  sortOrder: 0,
};

const SOURCE_A: SummarySource = {
  id: "a-id",
  date: "2026-04-20",
  type: "daily",
  content: "Prayed in the morning. Felt at peace.",
};

const SOURCE_B: SummarySource = {
  id: "b-id",
  date: "2026-04-22",
  type: "daily",
  content: "Argued with sarah. Lost my temper.",
};

describe("buildLensPeriodSystemPrompt", () => {
  it("inlines the lens system prompt", () => {
    const p = buildLensPeriodSystemPrompt(FAITH_LENS);
    assert.match(p, /Christian framing about grace and provision\./);
  });
  it("forbids medical advice and moralizing", () => {
    const p = buildLensPeriodSystemPrompt(FAITH_LENS);
    assert.match(p, /never diagnose/i);
    assert.match(p, /never moralize/i);
  });
  it("instructs the model to use the lens's heading", () => {
    const p = buildLensPeriodSystemPrompt(FAITH_LENS);
    assert.match(p, /## Faith \(Christian\) — /);
  });
});

describe("buildLensPeriodPrompt", () => {
  it("includes the date range and period label", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A, SOURCE_B],
    });
    assert.match(p, /\bweek\b/);
    assert.match(p, /2026-04-20/);
    assert.match(p, /2026-04-26/);
  });

  it("includes lens analysis questions and summary focus", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
    });
    assert.match(p, /Where did you see God working today\?/);
    assert.match(p, /Patterns of provision/);
  });

  it("renders source entries with id and date", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A, SOURCE_B],
    });
    assert.match(p, /<source id="a-id" date="2026-04-20"/);
    assert.match(p, /Argued with sarah/);
  });

  it("renders empty-prior fallback by default", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
    });
    assert.match(p, /no prior period reflections through this lens/);
  });

  it("renders prior period reflections in chronological order with ranges", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_A],
      priorPeriodReflections: [
        {
          period: "weekly",
          rangeFrom: "2026-04-13",
          rangeTo: "2026-04-19",
          reflection: "## Faith — Later week\n\nLater content.",
        },
        {
          period: "weekly",
          rangeFrom: "2026-04-06",
          rangeTo: "2026-04-12",
          reflection: "## Faith — Earlier week\n\nEarlier content.",
        },
      ],
    });
    const earlier = p.indexOf("Earlier content");
    const later = p.indexOf("Later content");
    assert.ok(earlier > -1 && later > -1);
    assert.ok(earlier < later, "prior period reflections must be chronological");
    assert.match(p, /range_from="2026-04-06"/);
    assert.match(p, /range_from="2026-04-13"/);
  });

  it("renders an empty-sources note when no entries exist in the range", () => {
    const p = buildLensPeriodPrompt({
      lens: FAITH_LENS,
      period: "weekly",
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [],
    });
    assert.match(p, /no daily entries in this period/);
  });
});
