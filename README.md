# Chronicle

A life reflection system disguised as a journal.

Chronicle helps you capture your daily experience, then uses AI to organize your writing, surface patterns across your life, and track growth toward the destinations you choose. It works for anyone — regardless of faith, profession, or purpose — because the analysis adapts to you, not the other way around.

## What It Does

- **Write daily entries** in your own voice, with optional prompted sections to guide reflection
- **AI cleanup** organizes your raw writing into structured sections while preserving your voice
- **Life domains** tag entries by area of life (work, fitness, relationships, music, faith, etc.) to filter, track, and analyze each part independently
- **Configurable lenses** analyze the same experiences through different frames: faith, career, therapy, creativity, or anything you define
- **Hierarchical summarization** rolls daily entries into weekly, monthly, yearly, and decade reflections — automatically
- **Goal tracking** ties your aspirations to your actual journal data and shows you the trajectory
- **Cross-referencing** links related entries across your timeline so you can see patterns in how you overcome challenges, how good things happen, and how you grow
- **Retroactive journaling** lets you paint a picture of the life you've already lived, so the system understands your full story
- **Analytics** visualize domain balance, writing streaks, and growth trends over time

## Architecture

```
Capture Layer     →  Write once, in your own words
Analysis Layer    →  AI examines your entries through configurable lenses
Goals Layer       →  Track pace toward your chosen destinations
Summary Layer     →  Daily → Weekly → Monthly → Yearly → Decade
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [Vision](docs/vision.md) | What Chronicle is and why it exists |
| [Architecture](docs/architecture.md) | System design, data model, and technical decisions |
| [Lenses](docs/lenses.md) | How configurable analysis lenses work |
| [Templates](docs/templates.md) | Entry formats and prompted sections |
| [Domains](docs/domains.md) | Life domains — work, fitness, relationships, music, and how they differ from lenses |
| [Summarization](docs/summarization.md) | How hierarchical summarization works (daily → decade) |
| [Decisions](docs/decisions.md) | Architecture Decision Records — the *why* behind every major choice |
| [Project Plan](docs/project-plan.md) | Full spec: database, APIs, frontend views, feature phases |

## Stack

- **Frontend:** Next.js + shadcn/ui + Tailwind
- **Database:** SQLite
- **AI:** Claude API (entry cleanup, summarization, cross-referencing, lens analysis)
- **Deployment:** Docker on Raspberry Pi, behind Caddy reverse proxy
- **Public display:** Eventually integrated with [chaseconover.com](https://chaseconover.com)

## Status

Early design phase. Documentation first, code second.
