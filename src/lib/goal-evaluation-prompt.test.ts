import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GOAL_EVALUATION_SYSTEM_PROMPT,
  buildGoalEvaluationPrompt,
  type GoalContext,
  type PriorGoalProgress,
} from "./goal-evaluation-prompt";
import type { SummarySource } from "./summarize-prompt";

const SAMPLE_GOAL: GoalContext = {
  goal: {
    title: "Run 3 times per week",
    description: "Build a sustainable running habit through summer",
    targetDate: "2026-09-01",
    status: "active",
  },
  domainName: "Health & Fitness",
  lensName: null,
};

const SOURCE_RUN_DAY: SummarySource = {
  id: "a-id",
  date: "2026-04-21",
  type: "daily",
  content: "Ran 4 miles this morning. Felt good.",
};

const SOURCE_REST_DAY: SummarySource = {
  id: "b-id",
  date: "2026-04-23",
  type: "daily",
  content: "Long meeting day. Tired by evening, didn't move.",
};

describe("GOAL_EVALUATION_SYSTEM_PROMPT", () => {
  it("enumerates the trajectory buckets", () => {
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /on_track/);
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /at_risk/);
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /off_track/);
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /achieved/);
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /abandoned/);
  });
  it("forbids inventing activity not in the entries", () => {
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /Do NOT invent/);
  });
  it("forbids moralizing and diagnosing", () => {
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /never diagnose/i);
    assert.match(GOAL_EVALUATION_SYSTEM_PROMPT, /never moralize/i);
  });
});

describe("buildGoalEvaluationPrompt", () => {
  it("includes the goal title, target date, and description", () => {
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_RUN_DAY, SOURCE_REST_DAY],
      priorProgress: [],
    });
    assert.match(p, /Run 3 times per week/);
    assert.match(p, /Build a sustainable running habit/);
    assert.match(p, /2026-09-01/);
  });

  it("renders domain and lens names when supplied", () => {
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_RUN_DAY],
      priorProgress: [],
    });
    assert.match(p, /Domain: Health & Fitness/);
  });

  it("renders an empty-prior fallback when no prior progress", () => {
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_RUN_DAY],
      priorProgress: [],
    });
    assert.match(p, /no prior progress assessments/);
  });

  it("renders prior progress assessments oldest -> newest with trajectory tags", () => {
    const priors: PriorGoalProgress[] = [
      {
        rangeFrom: "2026-04-13",
        rangeTo: "2026-04-19",
        trajectory: "at_risk",
        assessment: "Ran twice; missed Sunday.",
        createdAt: "2026-04-19 21:00:00",
      },
      {
        rangeFrom: "2026-04-06",
        rangeTo: "2026-04-12",
        trajectory: "on_track",
        assessment: "Three runs, all completed.",
        createdAt: "2026-04-12 21:00:00",
      },
    ];
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_RUN_DAY],
      priorProgress: priors,
    });
    const earlier = p.indexOf("Three runs, all completed");
    const later = p.indexOf("Ran twice; missed Sunday");
    assert.ok(earlier > -1 && later > -1);
    assert.ok(earlier < later, "prior progress must be chronological");
    assert.match(p, /trajectory="on_track"/);
    assert.match(p, /trajectory="at_risk"/);
  });

  it("renders entries with id and date for traceability", () => {
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [SOURCE_RUN_DAY],
      priorProgress: [],
    });
    assert.match(p, /<entry id="a-id" date="2026-04-21" type="daily">/);
  });

  it("renders empty-entries fallback when no daily entries in range", () => {
    const p = buildGoalEvaluationPrompt({
      goalContext: SAMPLE_GOAL,
      range: { from: "2026-04-20", to: "2026-04-26" },
      sources: [],
      priorProgress: [],
    });
    assert.match(p, /no daily entries in this period/);
  });
});
