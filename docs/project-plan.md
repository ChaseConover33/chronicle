# Project Plan

Complete specification for Chronicle v1 — every feature, every API, every view, every table.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | SSR for public pages, API routes for backend, one deployment unit |
| **UI Components** | shadcn/ui | Pre-built calendar, cards, dialogs, tabs, forms, sidebar |
| **Styling** | Tailwind CSS | Utility-class styling, consistent design, fast iteration |
| **Editor** | MDXEditor or Milkdown | Markdown-aware rich text editor with toolbar |
| **Database** | SQLite via better-sqlite3 | Single-file, zero-config, trivial backup |
| **ORM** | Drizzle ORM | Type-safe queries, lightweight, SQLite-native |
| **AI** | Claude API (@anthropic-ai/sdk) | Entry cleanup, summarization, cross-referencing, lens analysis |
| **Auth** | NextAuth.js (optional, single-user initially) | Session management if/when multi-user is added |
| **Deployment** | Docker (single container) | Runs on Pi behind Caddy, bind-mounted SQLite volume |
| **Scheduling** | systemd timers (on Pi) | Trigger summary generation via API calls |

---

## Database Schema

### entries

```sql
CREATE TABLE entries (
  id            TEXT PRIMARY KEY,     -- uuid
  date          TEXT NOT NULL,        -- ISO date (YYYY-MM-DD) the entry is about
  type          TEXT NOT NULL,        -- 'daily' | 'retrospective' | 'weekly' | 'monthly' | 'yearly' | 'decade'
  status        TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  template      TEXT,                 -- which template was used (nullable for summaries)
  raw_text      TEXT,                 -- what the user typed, unmodified (null for AI-generated summaries)
  formatted_content TEXT,             -- AI-organized markdown
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  published_at  TEXT                  -- when status changed to 'published'
);

CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_status ON entries(status);
```

### domains

```sql
CREATE TABLE domains (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,   -- 'work', 'fitness', 'music', etc.
  icon        TEXT,                   -- emoji or icon name for UI
  color       TEXT,                   -- hex color for calendar/charts
  is_builtin  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
```

### entry_domains

```sql
CREATE TABLE entry_domains (
  entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  domain_id   TEXT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, domain_id)
);
```

### tags

```sql
CREATE TABLE tags (
  id        TEXT PRIMARY KEY,
  entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  name      TEXT NOT NULL
);

CREATE INDEX idx_tags_entry ON tags(entry_id);
CREATE INDEX idx_tags_name ON tags(name);
```

### links

```sql
CREATE TABLE links (
  id        TEXT PRIMARY KEY,
  entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  url       TEXT NOT NULL,
  note      TEXT                     -- why this link mattered
);
```

### relations

```sql
CREATE TABLE relations (
  id              TEXT PRIMARY KEY,
  source_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  target_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL,      -- 'similar_challenge' | 'growth_from' | 'pattern' | 'user_linked' | 'ai_suggested'
  description     TEXT                -- why these are connected
);

CREATE INDEX idx_relations_source ON relations(source_entry_id);
CREATE INDEX idx_relations_target ON relations(target_entry_id);
```

### lenses

```sql
CREATE TABLE lenses (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  system_prompt      TEXT NOT NULL,
  analysis_questions TEXT NOT NULL,   -- JSON array of strings
  summary_focus      TEXT NOT NULL,   -- JSON array of strings
  is_builtin         INTEGER NOT NULL DEFAULT 0,
  active             INTEGER NOT NULL DEFAULT 0,
  sort_order         INTEGER NOT NULL DEFAULT 0
);
```

### lens_reflections

```sql
CREATE TABLE lens_reflections (
  id          TEXT PRIMARY KEY,
  entry_id    TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  lens_id     TEXT NOT NULL REFERENCES lenses(id) ON DELETE CASCADE,
  reflection  TEXT NOT NULL,          -- AI-generated analysis
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reflections_entry ON lens_reflections(entry_id);
CREATE INDEX idx_reflections_lens ON lens_reflections(lens_id);
```

### goals

```sql
CREATE TABLE goals (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,                   -- why this goal matters, what success looks like
  lens_id     TEXT REFERENCES lenses(id),
  domain_id   TEXT REFERENCES domains(id),
  target_date TEXT,                   -- optional deadline
  status      TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'achieved' | 'paused' | 'abandoned'
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### goal_progress

```sql
CREATE TABLE goal_progress (
  id               TEXT PRIMARY KEY,
  goal_id          TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  summary_entry_id TEXT REFERENCES entries(id),  -- which summary triggered this eval
  assessment       TEXT NOT NULL,     -- AI-generated progress report
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### templates

```sql
CREATE TABLE templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  sections    TEXT NOT NULL,          -- JSON: [{id, heading, prompt, required}]
  is_builtin  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
```

### user_settings

```sql
CREATE TABLE user_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL                 -- JSON value
);
-- Stores: default_template, active_lenses, active_domains, summary_preferences, etc.
```

---

## API Routes

### Entries

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/entries` | List entries with filters (date range, type, status, domain, tag) |
| GET | `/api/entries/[id]` | Get single entry with tags, links, relations, domains, reflections |
| POST | `/api/entries` | Create new entry (draft) |
| PUT | `/api/entries/[id]` | Update entry (requires confirm flag if published) |
| DELETE | `/api/entries/[id]` | Delete entry (requires confirm if published) |
| GET | `/api/entries/calendar` | Calendar data: dates with entries, domain colors, entry counts per day |

### AI Processing

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/process/cleanup` | Submit raw text + template → get organized markdown back |
| POST | `/api/process/suggest-relations` | Submit entry → get suggested cross-references to past entries |
| POST | `/api/process/suggest-domains` | Submit entry text → get suggested domain tags |
| POST | `/api/process/suggest-tags` | Submit entry text → get suggested tags |

### Summarization

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/summarize` | Generate summary for a period (weekly/monthly/yearly/decade) |
| POST | `/api/summarize/domain` | Generate domain-specific summary for a period |
| POST | `/api/summarize/regenerate/[id]` | Regenerate a specific summary |

### Lenses

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/lenses` | List all lenses (builtin + custom) |
| POST | `/api/lenses` | Create custom lens |
| PUT | `/api/lenses/[id]` | Update lens (system prompt, questions, active status) |
| DELETE | `/api/lenses/[id]` | Delete custom lens (builtin lenses cannot be deleted) |
| POST | `/api/lenses/[id]/analyze/[entryId]` | Run lens analysis on a specific entry |
| POST | `/api/lenses/[id]/analyze-period` | Run lens analysis across a date range |

### Domains

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/domains` | List all domains |
| POST | `/api/domains` | Create custom domain |
| PUT | `/api/domains/[id]` | Update domain (name, color, icon) |
| DELETE | `/api/domains/[id]` | Delete custom domain |
| GET | `/api/domains/stats` | Domain distribution and trends |

### Goals

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/goals` | List goals with optional status/domain/lens filter |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/[id]` | Update goal (title, status, target date) |
| DELETE | `/api/goals/[id]` | Delete goal |
| POST | `/api/goals/[id]/evaluate` | AI evaluates progress based on recent entries |
| GET | `/api/goals/[id]/progress` | Get progress history for a goal |

### Templates

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/templates` | List all templates |
| POST | `/api/templates` | Create custom template |
| PUT | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete custom template |

### Reflection (Conversational AI)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/reflect` | Send a message in a reflective conversation (includes journal context) |

### Search

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/search` | Full-text search across entries with domain/tag/date filters |

### Public (for chaseconover.com integration)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/public/entries` | List published entries (no auth required, read-only) |
| GET | `/api/public/entries/[id]` | Get single published entry |

### Settings

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |

---

## Frontend Views

### 1. Dashboard (`/`)

The home page. Shows:

- **Today's entry status** — have you written today? Link to write or continue draft
- **This week at a glance** — mini calendar of the current week with domain dots
- **Recent entries** — last 5 entries, titles/dates, quick links
- **Active goals** — progress indicators for each active goal
- **Pending summaries** — any draft summaries awaiting review
- **Domain distribution** — small chart showing this month's domain balance

**Components:** Card, Badge, MiniCalendar (custom), ProgressBar

### 2. Write (`/write`)

The core writing experience.

- **Template selector** — dropdown to pick which template to use
- **Section-by-section editor** — each template section gets its own text area with the writing prompt as placeholder text
- **Domain picker** — multi-select sidebar to tag domains
- **"Clean Up" button** — sends raw text to AI, shows organized result in a preview pane
- **Side-by-side view** — raw text on left, AI-organized on right
- **Accept / Edit / Redo** — after AI cleanup, user can accept, manually edit, or regenerate
- **Save as Draft / Publish** — two distinct save actions
- **Link adder** — input for URL + title + note, rendered in the "What I Read" section

**Components:** Textarea, Select, MultiSelect, Button, SplitPane, Dialog (for publish confirmation)

### 3. Write Retrospective (`/retrospective`)

Similar to `/write` but uses the retrospective template and has a **date picker for which past period** this entry covers. Could be a single date or a date range (e.g., "Summer 2020" or "2018-2022").

**Components:** DatePicker, DateRangePicker, same editor components as `/write`

### 4. Calendar (`/calendar`)

Full-screen month-view calendar.

- **Month grid** — days with entries are highlighted, days without are muted
- **Domain color dots** — each day shows colored dots for which domains are present
- **Click a day** — opens that day's entry (or the write page if no entry exists)
- **Month/year navigation** — arrows to move between months, year selector
- **Domain filter** — toggle which domains are visible on the calendar
- **Entry count per day** — small number if multiple entries exist for a date (retrospectives)

**Components:** Calendar (shadcn), Badge, ToggleGroup, Popover

### 5. Entry View (`/entry/[id]`)

Single entry display.

- **Formatted markdown** rendered as HTML
- **Sidebar metadata** — date, type, status, domains, tags
- **Related entries** — linked entries with descriptions of the relationship
- **Lens reflections** — expandable sections showing each active lens's analysis
- **Links** — external resources with notes
- **Edit button** (with confirmation if published)
- **Cross-reference suggestions** — AI-suggested related entries the user can accept/dismiss

**Components:** Card, Badge, Accordion (for lens reflections), Button, AlertDialog (for edit confirmation)

### 6. Summaries (`/summaries`)

Browse summaries organized by period.

- **Period tabs** — Weekly | Monthly | Yearly | Decade
- **Summary list** — ordered by date, showing title and status
- **Summary detail** — full rendered summary with per-lens sections and goal progress
- **Regenerate button** — re-run AI summarization for this period
- **Domain filter** — show domain-specific summaries

**Components:** Tabs, Card, Button, Select

### 7. Goals (`/goals`)

Goal management and progress tracking.

- **Active goals** — each goal shows title, domain, lens, target date, latest progress assessment
- **Progress timeline** — for each goal, a chronological list of AI assessments
- **Add goal** — form with title, description, optional domain, optional lens, optional target date
- **Goal status management** — mark as achieved, paused, abandoned
- **Evaluate now** — manually trigger an AI progress evaluation

**Components:** Card, Form, DatePicker, Select, Timeline (custom), Badge

### 8. Lenses (`/settings/lenses`)

Lens configuration.

- **Active lenses** — toggle on/off for each lens
- **Lens detail** — view and edit system prompt, analysis questions, summary focus
- **Create custom lens** — form with all lens fields
- **Preview** — test a lens against a sample entry to see what it produces

**Components:** Switch, Textarea, Card, Form, Dialog

### 9. Domains (`/settings/domains`)

Domain management.

- **Domain list** — all domains with icon, color, entry count
- **Create custom domain** — name, icon picker, color picker
- **Domain stats** — distribution chart, trend over time
- **Reorder** — drag to change display order

**Components:** Card, ColorPicker, Form, DragHandle, Chart (recharts or similar)

### 10. Templates (`/settings/templates`)

Template management.

- **Template list** — all templates with section counts
- **Template detail** — view sections, prompts, required/optional flags
- **Create/edit template** — add/remove sections, customize prompts
- **Set default** — which template opens by default on `/write`

**Components:** Card, Form, Switch, SortableList

### 11. Reflect (`/reflect`)

Conversational AI interface for life reflection.

- **Chat interface** — message bubbles, input box
- **Context indicator** — shows how many entries are loaded as context
- **Suggested prompts** — "Where have I come from?", "What patterns do you see?", "Where am I heading?"
- **Entry references** — when the AI mentions a specific entry, it's linked

**Components:** Chat bubbles (custom), Input, Button, Card

### 12. Analytics (`/analytics`)

Quantitative self-reflection dashboard.

- **Writing streak** — current streak and longest streak
- **Domain distribution** — pie/bar chart of entry domains this month/quarter/year
- **Domain trends** — line chart showing domain frequency over time
- **Entry frequency** — calendar heatmap (like GitHub contributions)
- **Tag cloud** — most common tags
- **Goal progress overview** — all goals with trajectory indicators

**Components:** Charts (recharts), Calendar heatmap (custom), Card, Tabs

### 13. Search (`/search`)

Full-text search with filters.

- **Search bar** — query input
- **Filters** — date range, domains, tags, type, status
- **Results** — matching entries with highlighted excerpts
- **Sort** — by relevance or date

**Components:** Input, Select, DateRangePicker, Card

### 14. Settings (`/settings`)

General app settings.

- **Default template** — which template to use when creating a new entry
- **Active lenses** — quick toggle (also available on `/settings/lenses`)
- **Summary preferences** — which domains get their own summary track, summary schedule
- **Export** — download all entries as markdown files or SQLite database
- **Account** — (future) user management

**Components:** Form, Switch, Select, Button

---

## Document Format

### Stored Entry (in database)

The `formatted_content` column contains markdown with YAML frontmatter:

```markdown
---
date: 2026-04-23
type: daily
status: draft
template: daily-journal
---

## Summary

AI-generated 2-3 sentence overview of the day.

## What Happened

User's words organized into coherent paragraphs. Voice preserved,
structure added. The AI may reorder for flow but does not add
content or change vocabulary.

## What I Learned

The key insight, in the user's voice.

## Gratitude

What the user is grateful for.

## What I Read & Explored

- [Article Title](https://example.com) — why it mattered to me today
- [Book Chapter](https://example.com) — the idea that stuck

## Free Write

Anything else the user wanted to capture.
```

### Metadata (in relational tables)

Tags, domains, links, and relations are stored in their own tables, not in the markdown frontmatter. The frontmatter contains only the fields needed to render the entry independently (date, type, status, template). Everything else is joined from the database at query time.

This keeps the markdown clean and human-readable while letting the database handle efficient querying and filtering.

---

## Feature Priorities

### Phase 1 — Core Journal (MVP)

1. Database schema + seed data (domains, templates, lenses)
2. Write page — template-based editor, AI cleanup, save
3. Entry view — rendered markdown with metadata
4. Calendar view — month grid, click to read/write
5. API routes for entries CRUD + AI cleanup

### Phase 2 — Organization

6. Domain tagging (at write time + AI suggestions)
7. Tag system
8. Link attachment
9. Search with filters
10. Dashboard

### Phase 3 — AI Analysis

11. Lens reflections on entries
12. Cross-reference suggestions
13. Weekly summarization (scheduled)
14. Monthly/yearly summarization
15. Goal tracking + AI evaluation

### Phase 4 — Depth

16. Retrospective entries
17. Reflective conversation (`/reflect`)
18. Domain-specific summaries
19. Analytics dashboard
20. Entry relations browser

### Phase 5 — Public & Integration

21. Public API for published entries
22. Integration with chaseconover.com
23. Docker deployment on Pi
24. Caddy routing + Ansible integration
25. Export functionality

---

## Scheduled Jobs

| Job | Schedule | API Call | Description |
|-----|----------|----------|-------------|
| Weekly summary | Sundays 21:00 | `POST /api/summarize?period=weekly` | Summarize the past week |
| Monthly summary | 1st of month 21:00 | `POST /api/summarize?period=monthly` | Summarize the past month |
| Yearly summary | Jan 1st 21:00 | `POST /api/summarize?period=yearly` | Summarize the past year |
| Goal evaluation | Sundays 21:30 | `POST /api/goals/evaluate-all` | Evaluate all active goals |
| Domain summary | Sundays 21:15 | `POST /api/summarize/domain?period=weekly` | Domain-specific weekly summaries |
