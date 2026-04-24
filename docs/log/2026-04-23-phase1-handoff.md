# Session Handoff — 2026-04-23 (Phase 1 Build)

This continues the first session's handoff at `docs/log/2026-04-23-handoff.md`. That session built the documentation and scaffold; this session built the Phase 1 MVP end-to-end except for AI cleanup.

## What Was Built This Session

6 of 7 Phase 1 tasks are done. Each has its own commit on `main`.

| Task | Status | Commit |
|------|--------|--------|
| 1. Install deps + shadcn init | done | `Install Phase 1 dependencies + initialize shadcn/ui` |
| 2. Database layer | done | `Add database layer — Drizzle schema, migrations, and seed data` |
| 3. Seed built-in data | done | (same commit as task 2) |
| 4. `/write` page + `POST /api/entries` | done | `Build /write page + POST /api/entries` |
| 5. `/entry/[id]` view | done | `Build /entry/[id] view with markdown rendering` |
| 6. `/calendar` view | done | `Build /calendar view with day-level entry indicators` |
| 7. AI cleanup step | **not started** | — |

Verified end-to-end in the browser-free sense: `GET /`, `GET /write`, `GET /calendar`, `GET /entry/:id` all return 200; `POST /api/entries` persists a row; the calendar page renders the react-day-picker grid with dots on days-with-entries. Not yet verified in a real browser — worth 5 minutes at the start of the next session.

## What's Left for Phase 1

**Task 7: AI cleanup.** The design is the hard part, and it needs Chase's involvement:

1. **`ANTHROPIC_API_KEY`** — goes in `.env.local` (already gitignored). Without it, the endpoint compiles but can't be tested.
2. **A sample of Chase's real writing** — a paragraph or two in the shape of a journal entry. The system prompt for voice-preserving cleanup (Decision 5) is the hardest requirement in the whole project per the first handoff. Tuning it against synthetic examples is exactly the trap to avoid.

Suggested implementation shape (not locked in):

- `POST /api/process/cleanup` — body `{raw_text, template_sections}`, returns `{formatted_content}`. No DB writes; just a pure transformation.
- `PUT /api/entries/:id` — accepts `formatted_content` and updates the row. (Doesn't exist yet.)
- On `/entry/:id`, show a "Clean up with AI" button when `formatted_content` is null. Click → call cleanup → preview → Accept/Redo buttons → on Accept, PUT to the entries API and refresh. Raw text is always preserved in `raw_text`.
- System prompt draft: see `docs/decisions.md` Decision 5. First pass should be strict about what the AI can change (typos, paragraph breaks, light reordering) and what it absolutely cannot (vocabulary, sentence structure, inserted content). Test against Chase's sample. Iterate.

## Gotchas to Know

1. **`node_modules/.bin` symlinks broke during npm install.** Three of them (`next`, `tsc`, `eslint`) were copied as full files by npm instead of being symlinked, which made their `require("../server/require-hook")`-style relative lookups fail. I replaced them with real symlinks. If `npm install` ever runs again and re-copies those files, the fix is:
   ```
   cd node_modules/.bin
   rm -f next tsc eslint
   ln -s ../next/dist/bin/next next
   ln -s ../typescript/bin/tsc tsc
   ln -s ../eslint/bin/eslint.js eslint
   ```

2. **The `@tailwindcss/typography` plugin is not installed.** I used arbitrary-variant Tailwind classes (`[&_h1]:...`) on the entry view instead. Good enough for MVP, but if we want proper prose styling later, installing the plugin would let us just use `prose prose-neutral`.

3. **Dev server output is buffered or silent.** `npm run dev` runs fine but produces no visible output for several seconds. Don't assume a silent terminal means failure — `curl localhost:3000` is the ground truth.

4. **Markdown editor is deferred to Phase 2.** Plain textareas per template section in Phase 1. Documented in `docs/project-plan.md`'s Tech Stack and Phase 2 feature list.

## How to Resume

```
cd ~/Documents/Code/chronicle
npm run db:migrate   # idempotent
npm run dev          # start dev server
# open http://localhost:3000 in a browser, poke around
# then: read docs/log/2026-04-23-phase1-handoff.md (this file)
# then: ask Chase for ANTHROPIC_API_KEY + a writing sample, then build task 7
```

## Small Things Tried Along the Way

- Tried to make the `/fewer-permission-prompts` skill produce useful allowlist entries for `.claude/settings.json`. It didn't find any — the recurring commands in Chase's transcripts are either already auto-allowed (git log/status/diff, ls, grep) or genuinely destructive (git add/push, npm install, ssh, curl). Existing `settings.local.json` has 35 ad-hoc entries; didn't touch them.
- Wrapped the Select `onValueChange` with a non-null coalescing fn because shadcn's base-ui wrapper types `value` as `string | null`.
- shadcn's default Button in the `base-nova` preset uses `@base-ui/react` (not Radix Slot), so it has no `asChild` prop. Used the exported `buttonVariants()` as a className on `<Link>` instead.
