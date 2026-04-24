# Summarization

## How Summarization Works

Chronicle automatically generates summary entries at regular intervals. Each summary synthesizes the entries from its period through each active lens, producing a reflection that shows patterns, growth, and trajectory that aren't visible from inside a single day.

## Summary Hierarchy

```
Daily Entry
  └── Weekly Summary (every Sunday)
        └── Monthly Summary (1st of each month)
              └── Yearly Summary (January 1st)
                    └── Decade Summary (on demand)
```

Each level summarizes the level below it, not the raw daily entries. A monthly summary reads the 4-5 weekly summaries for that month, not 30 daily entries. This keeps the AI context window manageable and produces increasingly distilled reflections at each zoom level.

## Schedule

| Period | Trigger | Covers |
|--------|---------|--------|
| Weekly | Sunday at 21:00 | Monday through Sunday |
| Monthly | 1st of month at 21:00 | All weeks in the prior month |
| Yearly | January 1st at 21:00 | All months in the prior year |
| Decade | Manual (user-triggered) | All years in the decade |

Summaries are generated in `draft` status. The user receives a notification (or sees them on their dashboard) and can review, edit, and publish.

## What Each Summary Contains

### Weekly Summary

- **What happened this week** — narrative arc of the 7 days
- **Key lessons** — the insights that will still matter next month
- **Patterns noticed** — recurring themes, emotions, or behaviors
- **Per-lens reflection** — each active lens produces its own paragraph
- **Goal progress** — for each active goal, how the week moved the needle

### Monthly Summary

- **The month in review** — synthesized from weekly summaries
- **Growth observed** — what changed between week 1 and week 4
- **Per-lens reflection** — broader patterns visible at the month scale
- **Goal progress** — trajectory over the month, not just the latest week

### Yearly Summary

- **The year in review** — the arc of 12 months
- **How you grew** — the person you were in January vs December
- **Defining moments** — entries and weeks that shaped the year
- **Per-lens reflection** — year-scale patterns
- **Goal outcomes** — goals achieved, abandoned, or still in progress

### Decade Summary

- **The decade in review** — the broadest possible zoom level
- **Life chapters** — how the years group into phases
- **Transformation** — who you were at the start vs the end
- **Per-lens reflection** — the deepest patterns
- **The long arc** — what the decade-scale trajectory reveals

## AI Prompting Strategy

Each summary level uses a prompt that:

1. Includes the child entries/summaries as context
2. Specifies the time period being summarized
3. Includes each active lens's summary focus points
4. Asks for both factual synthesis and reflective insight
5. Instructs the AI to reference specific entries when making claims about patterns

The prompt explicitly asks the AI to distinguish between "things that happened" and "patterns I notice" — the user should be able to tell which parts are factual recall and which are interpretive.

## Regeneration

If a user edits past entries or adds retrospective entries that fall within a summary's period, they can regenerate the summary. The old summary is not deleted — it's marked as superseded, and the new summary is created as a fresh draft. This preserves the history of what the AI noticed at different points in time.
