# Architecture Decisions

This document captures the *why* behind major design decisions in Chronicle. Each decision records the choice made, the reasoning, the alternatives considered, and the consequences accepted.

When a decision is revisited or reversed, the original entry is updated with a "Superseded by" note rather than deleted — the reasoning behind past decisions is part of the project's history.

---

## Decision 1: One dataset, many lenses (not many templates)

**What:** The journal entry format is universal. All users write into the same flexible structure regardless of their worldview, profession, or goals. Personalization happens in the analysis layer (lenses), not the capture layer.

**Why:**
- **People aren't one thing.** A user who is a Christian software engineer in therapy shouldn't have to choose between a faith template, a career template, and a therapeutic template. They write once; three lenses each produce their own analysis of the same entry.
- **The data stays queryable.** If entries had different schemas per worldview, cross-referencing and pattern detection would require mapping between formats. A universal capture format means every entry is comparable to every other entry regardless of when it was written or what the user was focused on that day.
- **Lenses are cheap to add and modify.** A lens is just a system prompt and a set of questions. Adding a new analysis frame doesn't touch the data model, the editor, or the entry format. Templates are more expensive — they affect the UI, the AI cleanup process, and the stored format.
- **Capture should be low-friction.** The more structure you impose at write time, the more the journal feels like a form. Templates provide just enough structure to guide reflection without making it feel like work. Heavy per-worldview templates would make the writing step heavier.

**Alternatives considered:**
- **Per-worldview templates with worldview-specific sections baked in** — rejected because it forces users to pick one identity and creates a proliferation of formats that are hard to maintain and cross-reference.
- **No templates at all (pure free-write)** — rejected because some structure helps users who don't know what to write about. The prompted sections reduce blank-page anxiety.
- **Templates that vary by profession** — rejected because professions change, and a "medical student" template becomes wrong the day someone graduates. Lenses adapt; templates calcify.

**Consequences:**
- Templates are intentionally simple — they're just a selection of which universal sections to show. Custom templates can add new sections but shouldn't create incompatible entry formats.
- Lenses need to be well-written to produce genuinely useful analysis rather than generic platitudes. The quality of the system prompt matters more than the quantity of lenses.
- A user who wants a very specific capture format (e.g., a sobriety journal with AA-specific sections) would need to create a custom template with custom sections. This is supported but requires more setup.

---

## Decision 2: Markdown for entry storage, not HTML or rich text

**What:** Entries are stored as markdown with YAML frontmatter. The AI cleanup process produces markdown. The display layer renders markdown to HTML at read time.

**Why:**
- **Human-readable without tooling.** If the database is exported or the app is abandoned, every entry is a readable text file. No vendor lock-in on the format.
- **Version-controllable.** Markdown diffs cleanly in git. If a user wants to track changes to their entries over time, or if the app ever gains version history, markdown makes that trivial.
- **Renders cleanly to HTML.** For the eventual public display on chaseconover.com, markdown → HTML is a solved problem with mature libraries. The same markdown renders in the app, in a static site generator, or in a README.
- **The AI works natively in markdown.** Claude produces well-structured markdown without any special prompting. HTML or rich text formats would require additional post-processing.

**Alternatives considered:**
- **HTML** — rejected because it's hard to read raw, hard to diff, and ties the content to a rendering engine.
- **Rich text (ProseMirror/TipTap document format)** — rejected because it's a proprietary JSON structure that only makes sense inside the editor. The content would be locked to the app.
- **Plain text with no formatting** — rejected because section headers, links, and lists add genuine structure that helps readability. Markdown is the minimal viable formatting.

**Consequences:**
- The editor needs a markdown-aware text area (or a WYSIWYG editor that stores markdown). Several good options exist in the React ecosystem (e.g., MDXEditor, Milkdown).
- Links and images in entries are standard markdown syntax, which keeps them portable but means the editor should provide link/image insertion helpers.
- The AI cleanup step produces markdown directly — no format conversion needed.

---

## Decision 3: SQLite, not Postgres or a file-based system

**What:** All data lives in a single SQLite database file. Entries, tags, links, relations, lenses, goals, and reflections are all tables in this database.

**Why:**
- **Single-file backup.** The entire journal — every entry, every lens, every goal — is one file. It participates in the Pi's existing backup system (daily tar to three locations) without any special handling.
- **No separate database server.** SQLite runs in-process. No Postgres container, no connection pooling, no database crashes independent of the app. One fewer thing to operate on a Raspberry Pi with limited resources.
- **More than sufficient for the workload.** A personal journal generates maybe 1-2 writes per day and a handful of reads. SQLite handles orders of magnitude more than this.
- **Easy to develop against.** The database file can be copied to a dev machine, inspected with any SQLite client, and tested without Docker or database setup.

**Alternatives considered:**
- **PostgreSQL** — rejected as unnecessary operational complexity for a single-user app. Postgres would require its own container, health checks, memory allocation, and backup coordination.
- **Flat markdown files on disk** — considered seriously. Entries as individual `.md` files in a date-based directory structure would be the simplest possible storage. Rejected because querying (search, cross-referencing, filtering by tag/date/type) requires either loading all files into memory or building an index — at which point you've built a worse database. SQLite gives you indexed queries for free.
- **JSON files** — rejected for the same reasons as flat files, plus JSON is less readable than markdown for prose content.

**Consequences:**
- The app must handle SQLite's single-writer constraint. This is fine for a single-user journal but would need revisiting if the app ever supported multiple concurrent users.
- Database migrations need to be managed (e.g., with Drizzle or Prisma migrations). SQLite supports ALTER TABLE for simple schema changes.
- The SQLite file must be excluded from any git repository to avoid bloating the repo with binary diffs.

---

## Decision 4: Next.js, not FastAPI + separate frontend

**What:** The application is a single Next.js app that serves both the frontend UI and the backend API routes. There is no separate Python or Node backend server.

**Why:**
- **One deployment unit.** One Docker container, one process, one thing to monitor. On a resource-constrained Pi, fewer processes means more headroom.
- **SSR for public entries.** Published journal entries that eventually appear on chaseconover.com need to be server-rendered for performance and SEO. Next.js does this natively. A separate SPA frontend would require a build step to generate static pages or a separate SSR layer.
- **API routes are sufficient.** The backend operations (CRUD, Claude API calls, scheduled job triggers) are straightforward request/response patterns. They don't need the concurrency model or ecosystem of a dedicated backend framework.
- **TypeScript end-to-end.** One language for frontend, backend, and database queries. No context-switching between Python and TypeScript, no type mismatches at the API boundary.

**Alternatives considered:**
- **FastAPI (Python) + React SPA** — the original proposal. Rejected because it means two deployment units, two languages, and a serialization boundary between them. The Python advantage (Claude SDK) is offset by the fact that the Anthropic TypeScript SDK is equally capable.
- **SvelteKit** — a viable alternative to Next.js with a lighter footprint. Rejected in favor of Next.js because shadcn/ui (the chosen component library) is React-based, and the React component ecosystem is significantly larger for the specific components needed (calendar, rich text editor).
- **HTMX + server-rendered templates** — rejected because the interactive features (calendar navigation, live editor preview, lens configuration UI) need client-side state management that HTMX handles poorly.

**Consequences:**
- The Claude API is called from TypeScript using the `@anthropic-ai/sdk` package, not the Python SDK. Functionality is equivalent.
- Scheduled summarization jobs run as API route calls triggered by external cron/systemd timers (e.g., `curl http://localhost:3000/api/summarize?period=weekly`). This is simpler than embedding a job scheduler in the app.
- If the backend needs ever outgrow API routes (e.g., long-running AI jobs that exceed request timeouts), the architecture would need to add a background worker. For now, Claude API calls complete within seconds, so request/response is fine.

---

## Decision 5: AI preserves voice, does not rewrite

**What:** When the AI cleans up a journal entry, it organizes the user's writing into sections, fixes obvious typos, and improves paragraph flow — but it does not rewrite sentences, elevate vocabulary, or make the writing "better." The user's voice is the product, not the AI's.

**Why:**
- **The journal's value is in authentic self-expression.** If the AI rewrites your messy, emotional, real entry into polished prose, you lose the data that matters most. When you re-read an entry from 2028, you want to hear yourself, not a corporate writing assistant.
- **Pattern detection requires consistent voice.** If the AI rewrites entries in its own style, the summarization and cross-referencing layers lose the signal of how the user's thinking and expression actually evolves over time. A summary that says "your writing became more confident in Q3" only works if the confidence came from the user, not the AI.
- **Trust requires predictability.** Users need to trust that hitting "Clean up" won't turn their private, raw thoughts into something they don't recognize. The cleanup should feel like a helpful editor who tidied your desk, not an author who rewrote your manuscript.

**Alternatives considered:**
- **Full rewrite with tone matching** — rejected because even good tone matching drifts from the user's actual voice over time, and the cumulative effect is a journal that sounds like the AI, not the human.
- **No AI cleanup at all** — considered. A raw-only journal has integrity. Rejected because many people write in fragments, bullet points, and stream-of-consciousness that becomes hard to re-read later. Organization (not rewriting) genuinely helps.
- **Cleanup with before/after diff** — a middle ground where the user sees exactly what changed. Worth implementing as a feature, but the underlying principle is still "organize, don't rewrite."

**Consequences:**
- The AI cleanup system prompt must be carefully written and tested to enforce this boundary. "Organize into sections" and "fix typos" are clear. "Improve clarity" is a slippery slope. The prompt should err on the side of changing too little.
- Entries from users who write in fragments or shorthand will look less polished than entries from users who write in full sentences. That's correct — it reflects the actual person.
- The summary layer (weekly/monthly) is where the AI's own voice appears. Summaries are explicitly AI-generated and labeled as such. The distinction is: entries are yours, summaries are the AI's interpretation of yours.

---

## Decision 6: Summaries are entries, not a separate data type

**What:** Weekly, monthly, yearly, and decade summaries are stored in the same `entries` table as daily entries, distinguished by their `type` field. A weekly summary is an entry with `type: weekly` and a `date` of the Sunday that ends the week.

**Why:**
- **Summaries participate in cross-referencing.** A monthly summary might reference the same challenge that a daily entry from two years ago described. If summaries are a separate data type, the cross-referencing system needs to query two tables. Same table means one query.
- **Summaries are editable like entries.** The user should be able to review and edit an AI-generated weekly summary before publishing it. If summaries are entries, the same editor, the same draft/published workflow, and the same display logic apply.
- **Hierarchical summarization is recursive.** A monthly summary summarizes weekly summaries. A yearly summary summarizes monthly summaries. If they're all entries, the summarization logic is: "find entries of type X within date range Y, summarize them into a new entry of type Z." One function, not four.

**Alternatives considered:**
- **Separate `summaries` table** — rejected because it duplicates the entry schema (date, content, status, tags) and requires the UI to handle two data types everywhere entries are displayed.
- **Summaries as metadata on entries** — rejected because a weekly summary isn't metadata on a single entry; it's a synthesis of 7 entries. It deserves to be a first-class object.

**Consequences:**
- Queries that should return "only what the user wrote" need to filter by `type = daily OR type = retrospective`. This is a simple WHERE clause but must be remembered.
- The calendar view shows daily entries and retrospectives, not summaries. Summaries have their own browsing interface organized by period.
- Deleting a daily entry doesn't automatically update the weekly summary that included it. Summaries are snapshots — if the underlying data changes significantly, the user can regenerate the summary.

---

## Decision 7: Draft/published workflow with post-publish lock

**What:** Every entry starts as a `draft`. The user can edit drafts freely. When they publish, the entry moves to `published` status. Published entries can still be edited, but the UI discourages it with a confirmation step, and edits to published entries are noted.

**Why:**
- **Publishing to a public website should be intentional.** The eventual integration with chaseconover.com means published entries are potentially public. The draft → publish step is a deliberate gate.
- **Journal integrity matters over time.** If you freely edit old published entries, you lose the authentic record of what you thought and felt at that moment. The slight friction of "are you sure you want to edit this published entry?" preserves authenticity without making it impossible to fix typos or factual errors.
- **AI summaries reference published content.** If a weekly summary was generated from 7 published entries and one of them later changes substantially, the summary becomes inaccurate. The soft lock makes this less likely.

**Alternatives considered:**
- **Hard lock on published entries (no edits at all)** — rejected as too rigid. Typos happen. Factual corrections are legitimate.
- **No publish concept (everything is always editable)** — rejected because the public website integration requires a clear "this is ready to show" signal.
- **Version history on every edit** — a good future feature but not required for v1. The draft/published distinction provides enough protection for now.

**Consequences:**
- The API needs to enforce the confirmation step for published entry edits — the frontend sends a `confirm_edit: true` flag.
- Published entries display a "last edited" indicator if they've been modified after publishing.
- The public website integration only queries `status = published` entries.

---

## Decision 8: Domains and lenses are independent axes

**What:** Chronicle has two independent organizational systems: **domains** (what part of life an entry is about — work, fitness, music, relationships) and **lenses** (how to interpret the entry — faith, therapy, career growth). An entry can have multiple domains and be analyzed through multiple lenses. The two systems do not depend on each other.

**Why:**
- **They answer different questions.** A domain answers "what is this about?" A lens answers "how should I think about this?" These are orthogonal. An entry tagged with the "music" domain can be analyzed through a faith lens ("music as worship"), a therapeutic lens ("creative expression as coping"), or a career lens ("building performance skills").
- **Domains enable filtering and tracking.** Without domains, the only way to see "how has my fitness journey gone this year?" is to search for fitness-related keywords. With domains, it's a single filter. This enables domain-specific summaries, domain-specific goal tracking, and domain balance analytics.
- **Lenses enable interpretation.** Without lenses, the only way to get a faith-based reflection is to write one yourself. Lenses automate the interpretive layer so the same raw experience gets examined from multiple angles without extra writing effort.
- **Combining them is where the power is.** "Analyze my work entries through the therapeutic lens" reveals emotional patterns at work. "Analyze my relationship entries through the faith lens" reveals spiritual themes in how you treat people. Neither system alone produces these cross-cutting insights.

**Alternatives considered:**
- **Merge domains into lenses** — rejected because they serve different purposes. A "music lens" that also filters entries conflates categorization with interpretation. You'd lose the ability to apply a faith lens to music entries.
- **Merge domains into tags** — considered seriously. Tags and domains both categorize. But domains are a curated, stable set of life areas with colors, icons, and dedicated analytics. Tags are freeform and numerous. Making "work" a tag instead of a domain means it competes visually with "tuesday" and "rainy" in the tag cloud, and you lose the structured domain analytics.
- **Domains as a property of templates** — rejected because a single entry often spans multiple life areas. A template is chosen at write time; domains can be added or changed after the fact.

**Consequences:**
- The database has a many-to-many join table (`entry_domains`) and a separate `tags` table. Both are used for filtering but serve different purposes in the UI.
- The calendar view shows domain-colored dots per day, giving an at-a-glance view of life balance.
- Summary generation can run per-domain ("your fitness week") or across all domains ("your whole week"), and each can be further filtered through lenses. This is powerful but means the number of possible summaries is `domains × lenses × periods` — the UI needs to make this manageable, not overwhelming.
- Users need to understand the difference between domains and lenses. The onboarding flow should explain: "Domains are *what* — the parts of your life. Lenses are *how* — the way you examine them."
