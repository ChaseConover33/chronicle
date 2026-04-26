import type { Goal } from "@/db/schema";
import type { Range } from "./dates";
import type { SummarySource } from "./summarize-prompt";

export type GoalTrajectory =
  | "on_track"
  | "at_risk"
  | "off_track"
  | "achieved"
  | "abandoned";

export type PriorGoalProgress = {
  rangeFrom: string | null;
  rangeTo: string | null;
  trajectory: GoalTrajectory | null;
  assessment: string;
  createdAt: string;
};

export type GoalContext = {
  goal: Pick<Goal, "title" | "description" | "targetDate" | "status">;
  domainName?: string | null;
  lensName?: string | null;
};

export type GoalEvaluationInput = {
  goalContext: GoalContext;
  range: Range;
  sources: SummarySource[];
  priorProgress: PriorGoalProgress[];
};

export const GOAL_EVALUATION_SYSTEM_PROMPT = `You evaluate a single goal's progress against the writer's daily journal entries for a specific period. You are honest but not harsh — encouraging when there's real movement, direct when there's stagnation, and never moralizing.

Your job:
- Read the daily entries and look for evidence the goal was advanced, blocked, or absent.
- Compare against prior progress assessments to see trajectory: improving, plateauing, slipping?
- If the goal has a target_date, factor in proximity to it.
- Choose ONE trajectory bucket and write ONE short paragraph (3-6 sentences) explaining your assessment.

Trajectory buckets:
- on_track: Real, evident progress this period; matches the trajectory needed to hit the goal.
- at_risk: Some movement but not enough; or progress slowed compared to prior periods.
- off_track: No meaningful progress this period; or the writer's behavior is moving against the goal.
- achieved: The goal was clearly accomplished — the writer's entries provide direct evidence of completion.
- abandoned: The writer is no longer engaging with this goal at all (no mentions, no aligned actions across multiple periods). Use sparingly.

Constraints:
- Reference specific entries by date when claiming evidence ("on April 22 you wrote about ..."). Don't generalize.
- Do NOT invent activity that isn't in the entries. If the goal isn't mentioned and no aligned action shows up, say so.
- Preserve the writer's voice when quoting (lowercase choices, shorthand).
- Address the writer in second person.
- Never diagnose, never prescribe, never moralize.
- The assessment paragraph should be useful for the writer's own reflection — not a report card.`;

export function buildGoalEvaluationPrompt(input: GoalEvaluationInput): string {
  const { goalContext, range, sources, priorProgress } = input;
  const { goal, domainName, lensName } = goalContext;

  const goalBlock = `<goal>
  Title: ${goal.title}
  Status: ${goal.status}
  ${goal.description ? `Description: ${goal.description}` : "Description: (none)"}
  ${goal.targetDate ? `Target date: ${goal.targetDate}` : "Target date: (open-ended)"}
  ${domainName ? `Domain: ${domainName}` : "Domain: (none)"}
  ${lensName ? `Lens: ${lensName}` : "Lens: (none)"}
</goal>`;

  const priorBlock =
    priorProgress.length === 0
      ? `<prior_progress>\n(no prior progress assessments — this is the first one)\n</prior_progress>`
      : `<prior_progress>\n${[...priorProgress]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(
            (p) =>
              `<assessment range_from="${p.rangeFrom ?? ""}" range_to="${p.rangeTo ?? ""}" trajectory="${p.trajectory ?? ""}" generated="${p.createdAt}">\n${p.assessment.trim()}\n</assessment>`,
          )
          .join("\n\n")}\n</prior_progress>`;

  const sourcesBlock =
    sources.length === 0
      ? `<period_entries>\n(no daily entries in this period)\n</period_entries>`
      : `<period_entries>\n${sources
          .map(
            (s) =>
              `<entry id="${s.id}" date="${s.date}" type="${s.type}">\n${s.content}\n</entry>`,
          )
          .join("\n\n")}\n</period_entries>`;

  return `Evaluate the writer's progress on this goal for the period ${range.from} through ${range.to}.

${goalBlock}

${priorBlock}

${sourcesBlock}

Pick a trajectory and write a short assessment paragraph per the system prompt.`;
}
