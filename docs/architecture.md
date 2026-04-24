# Architecture

## System Overview

Chronicle is a full-stack web application with three conceptual layers that operate on the same underlying data.

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER                            │
│  Write entries, browse calendar, read summaries,     │
│  configure lenses, set goals, view analysis          │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               NEXT.JS APPLICATION                    │
│                                                      │
│  Pages:                                              │
│  ├── /write          Editor + AI cleanup             │
│  ├── /calendar       Month grid, domain-colored dots │
│  ├── /entry/[id]     Single entry view + reflections │
│  ├── /retrospective  Write about the past            │
│  ├── /summaries      Weekly / monthly / yearly       │
│  ├── /goals          Destination tracking            │
│  ├── /analytics      Domain balance, streaks, trends │
│  ├── /reflect        AI conversation about your life │
│  ├── /search         Full-text search with filters   │
│  └── /settings/*     Lenses, domains, templates      │
│                                                      │
│  API Routes:                                         │
│  ├── /api/entries    CRUD for journal entries         │
│  ├── /api/process    Submit raw text → AI cleanup    │
│  ├── /api/summarize  Generate period summaries       │
│  ├── /api/analyze    Run lens analysis on entries    │
│  ├── /api/goals      Goal CRUD + progress eval      │
│  └── /api/search     Full-text + semantic search     │
│                                                      │
├──────────────────────────────────────────────────────┤
│                    SQLITE                            │
│  Single file database — trivial to backup            │
├──────────────────────────────────────────────────────┤
│              SCHEDULED JOBS                          │
│  Weekly summary    — Sundays at 21:00                │
│  Monthly summary   — 1st of month at 21:00          │
│  Yearly summary    — January 1st at 21:00           │
│  Decade summary    — on demand                      │
└──────────────────────────────────────────────────────┘
```

## Data Model

### entries

The core table. Every piece of writing — daily, retrospective, or summary — is an entry.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| date | date | The date this entry is about (not necessarily when it was written) |
| type | enum | `daily`, `retrospective`, `weekly`, `monthly`, `yearly`, `decade` |
| status | enum | `draft`, `published` |
| raw_text | text | What the user actually wrote, unmodified |
| formatted_content | text | AI-organized markdown, preserving the user's voice |
| sections | json | Which optional sections are present and their content |
| created_at | timestamp | When the entry was created |
| updated_at | timestamp | Last modification |

### domains

Life areas that entries belong to. See [domains.md](domains.md) for full details.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Domain name (e.g., "work", "fitness", "music") |
| icon | text | Emoji or icon name for UI |
| color | text | Hex color for calendar dots and charts |
| is_builtin | boolean | Whether this is a system-provided domain |

### entry_domains

Many-to-many join between entries and domains.

| Column | Type | Description |
|--------|------|-------------|
| entry_id | uuid | FK to entries |
| domain_id | uuid | FK to domains |

### tags

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entry_id | uuid | FK to entries |
| name | text | Tag value (e.g., "growth", "career", "faith") |

### links

External resources attached to entries — articles, books, videos the user read or interacted with.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entry_id | uuid | FK to entries |
| title | text | Display name |
| url | text | External URL |
| note | text | Why this link mattered (optional) |

### relations

Connections between entries — either user-created or AI-suggested.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| source_entry_id | uuid | FK to entries |
| target_entry_id | uuid | FK to entries |
| relation_type | enum | `similar_challenge`, `growth_from`, `pattern`, `user_linked`, `ai_suggested` |
| description | text | Why these entries are connected |

### lenses

Configurable analysis frames. See [lenses.md](lenses.md) for full details.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Display name (e.g., "Faith (Christian)") |
| system_prompt | text | AI instructions for this lens |
| analysis_questions | json | Questions the AI asks of entries through this lens |
| summary_focus | json | What to emphasize in period summaries |
| is_builtin | boolean | Whether this is a system-provided lens or user-created |
| active | boolean | Whether this lens is currently enabled |

### lens_reflections

AI-generated analysis of entries through a specific lens.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entry_id | uuid | FK to entries |
| lens_id | uuid | FK to lenses |
| reflection | text | AI-generated analysis through this lens |
| created_at | timestamp | When generated |

### goals

Destinations the user is tracking toward.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lens_id | uuid | FK to lenses (which lens evaluates this goal) |
| title | text | The goal statement |
| description | text | Context — why this goal matters, what success looks like |
| target_date | date | Optional deadline |
| status | enum | `active`, `achieved`, `paused`, `abandoned` |
| created_at | timestamp | When set |

### goal_progress

Periodic evaluations of goal trajectory.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| goal_id | uuid | FK to goals |
| summary_entry_id | uuid | FK to the summary entry that triggered this evaluation |
| assessment | text | AI-generated progress report |
| created_at | timestamp | When evaluated |

## Stack Decisions

### Next.js (frontend + API)

One application serves both the private writing interface and the eventual public-facing published entries. Next.js provides:

- **Server-side rendering** for published entries — fast, SEO-friendly, no JavaScript required to read
- **API routes** for backend logic — no separate server to deploy
- **React ecosystem** for the interactive editor, calendar, and configuration UI

### shadcn/ui + Tailwind

Pre-built, accessible components (calendar, cards, dialogs, tabs, rich text areas) with utility-class styling. This avoids building UI primitives from scratch while keeping full control over the design.

### SQLite

A single-file database that is trivial to backup (it's just a file on disk). For a personal journal app, SQLite handles the read/write patterns easily — there's one user writing sequentially. The database file gets included in the Pi's existing backup system alongside other service data.

### Claude API

All AI operations go through the Claude API:

- **Entry cleanup:** Raw text → organized sections in the user's voice
- **Cross-referencing:** Find related past entries when saving a new one
- **Lens analysis:** Generate reflections through each active lens
- **Summarization:** Roll up entries into period summaries
- **Goal evaluation:** Assess trajectory based on recent entries
- **Reflective conversation:** Interactive discussion about growth and patterns

### Docker

Single container running the Next.js app. SQLite database is a bind-mounted volume for persistence and backup access. The container sits behind Caddy on the Pi's internal Docker network, served at `journal.lab.chaseconover.com`.

## AI Integration Points

### At Write Time (user-triggered)

1. User writes raw text in the editor
2. User clicks "Clean up" → raw text sent to Claude
3. Claude organizes into sections, preserving the user's voice
4. User reviews the formatted version, edits if needed, saves
5. On save, Claude searches past entries for related themes and suggests cross-references

### At Summary Time (scheduled)

1. Cron job fires (weekly/monthly/yearly)
2. System gathers all child entries for the period
3. For each active lens, Claude generates a summary focused on that lens's concerns
4. For each active goal tied to that lens, Claude evaluates progress
5. Summary entries are created in `draft` status for user review

### At Reflection Time (user-triggered)

1. User opens the reflect page
2. System loads recent entries and summaries as context
3. User has a conversation with Claude about their growth, patterns, and direction
4. Claude's responses are grounded in the user's actual journal data, not generic advice

## Deployment

```
Pi (Docker)
├── chronicle container (Next.js + SQLite)
│   ├── port 3000 (internal)
│   └── /data/chronicle.db (bind-mounted volume)
├── Caddy routes journal.lab.chaseconover.com → chronicle:3000
└── systemd timers for scheduled summarization

Eventually:
├── chaseconover.com pulls published entries via API
│   or static export of published content
```

The app is private by default (behind Tailscale). Published entries are the only content that eventually becomes public-facing on chaseconover.com. The mechanism for that integration depends on what chaseconover.com is built with — to be determined.
