import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "@/db";
import {
  domains,
  entries,
  goalProgress,
  goals,
  lenses,
  type Goal,
  type GoalProgress,
} from "@/db/schema";
import type { Range } from "./dates";
import { getLanguageModel } from "./language-model";
import { DEFAULT_MODEL_ID } from "./models";
import {
  GOAL_EVALUATION_SYSTEM_PROMPT,
  buildGoalEvaluationPrompt,
  type GoalContext,
  type GoalTrajectory,
  type PriorGoalProgress,
} from "./goal-evaluation-prompt";
import type { SummarySource } from "./summarize-prompt";

const PRIOR_LIMIT = 3;

const EVAL_SCHEMA = z.object({
  trajectory: z.enum([
    "on_track",
    "at_risk",
    "off_track",
    "achieved",
    "abandoned",
  ]),
  assessment: z
    .string()
    .describe(
      "3-6 sentences in second person, referencing specific entries by date.",
    ),
});

export function listActiveGoals(): Goal[] {
  return db.select().from(goals).where(eq(goals.status, "active")).all();
}

export function listAllGoals(): Goal[] {
  return db.select().from(goals).orderBy(desc(goals.createdAt)).all();
}

export function getGoal(goalId: string): Goal | undefined {
  return db.select().from(goals).where(eq(goals.id, goalId)).get();
}

export function listGoalProgress(goalId: string): GoalProgress[] {
  return db
    .select()
    .from(goalProgress)
    .where(eq(goalProgress.goalId, goalId))
    .orderBy(desc(goalProgress.createdAt))
    .all();
}

function fetchPriorProgress(
  goalId: string,
  beforeRangeFrom: string,
): PriorGoalProgress[] {
  const rows = db
    .select({
      rangeFrom: goalProgress.rangeFrom,
      rangeTo: goalProgress.rangeTo,
      trajectory: goalProgress.trajectory,
      assessment: goalProgress.assessment,
      createdAt: goalProgress.createdAt,
    })
    .from(goalProgress)
    .where(eq(goalProgress.goalId, goalId))
    .orderBy(desc(goalProgress.createdAt))
    .limit(PRIOR_LIMIT * 4)
    .all();
  return rows
    .filter(
      (r) => r.rangeFrom === null || r.rangeFrom < beforeRangeFrom,
    )
    .slice(0, PRIOR_LIMIT)
    .reverse();
}

function fetchEntriesInRange(range: Range): SummarySource[] {
  const rows = db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.type, "daily"),
        gte(entries.date, range.from),
        lte(entries.date, range.to),
      ),
    )
    .orderBy(asc(entries.date), asc(entries.createdAt))
    .all();
  return rows
    .map((r): SummarySource => ({
      id: r.id,
      date: r.date,
      type: r.type,
      content: (r.formattedContent ?? r.rawText ?? "").trim(),
    }))
    .filter((r) => r.content.length > 0);
}

function buildGoalContext(goal: Goal): GoalContext {
  const domain = goal.domainId
    ? db.select().from(domains).where(eq(domains.id, goal.domainId)).get()
    : undefined;
  const lens = goal.lensId
    ? db.select().from(lenses).where(eq(lenses.id, goal.lensId)).get()
    : undefined;
  return {
    goal,
    domainName: domain?.name ?? null,
    lensName: lens?.name ?? null,
  };
}

export type EvaluateGoalInput = {
  goal: Goal;
  range: Range;
  modelId?: string;
  summaryEntryId?: string | null;
};

export type EvaluateGoalResult = {
  progressId: string;
  trajectory: GoalTrajectory;
  assessment: string;
};

export async function evaluateGoal(
  input: EvaluateGoalInput,
): Promise<EvaluateGoalResult> {
  const sources = fetchEntriesInRange(input.range);
  const priorProgress = fetchPriorProgress(input.goal.id, input.range.from);
  const goalContext = buildGoalContext(input.goal);

  const { object } = await generateObject({
    model: getLanguageModel(input.modelId ?? DEFAULT_MODEL_ID),
    schema: EVAL_SCHEMA,
    system: GOAL_EVALUATION_SYSTEM_PROMPT,
    prompt: buildGoalEvaluationPrompt({
      goalContext,
      range: input.range,
      sources,
      priorProgress,
    }),
    maxOutputTokens: 1500,
  });

  const id = randomUUID();
  db.insert(goalProgress)
    .values({
      id,
      goalId: input.goal.id,
      summaryEntryId: input.summaryEntryId ?? null,
      rangeFrom: input.range.from,
      rangeTo: input.range.to,
      trajectory: object.trajectory,
      assessment: object.assessment.trim(),
    })
    .run();

  if (object.trajectory === "achieved") {
    db.update(goals)
      .set({ status: "achieved" })
      .where(eq(goals.id, input.goal.id))
      .run();
  } else if (object.trajectory === "abandoned") {
    db.update(goals)
      .set({ status: "abandoned" })
      .where(eq(goals.id, input.goal.id))
      .run();
  }

  return {
    progressId: id,
    trajectory: object.trajectory,
    assessment: object.assessment.trim(),
  };
}

export async function evaluateAllActiveGoals(input: {
  range: Range;
  modelId?: string;
  summaryEntryId?: string | null;
}): Promise<EvaluateGoalResult[]> {
  const active = listActiveGoals();
  const results: EvaluateGoalResult[] = [];
  for (const goal of active) {
    try {
      const r = await evaluateGoal({
        goal,
        range: input.range,
        modelId: input.modelId,
        summaryEntryId: input.summaryEntryId ?? null,
      });
      results.push(r);
    } catch (err) {
      // Don't let one failure block the others.
      const message = err instanceof Error ? err.message : String(err);
      console.error(`goal eval failed for ${goal.id}: ${message}`);
    }
  }
  return results;
}
