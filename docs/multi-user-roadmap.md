# Multi-User Roadmap (Phase 2)

This document captures the plan to evolve Chronicle from a strictly single-tenant journal into a multi-user app where friends can sign up and pay for their own AI usage. It is **not implemented**. Phase 1 (current/imminent) deploys Chronicle as a single-tenant app behind Clerk with only the owner able to sign in. Phase 2 unlocks friends.

## Why this is non-trivial

The current schema has zero user concept. Every domain table — `entries`, `goals`, `lenses`, `domains`, `tags`, `links`, `relations`, `lensReflections`, `lensPeriodReflections`, `goalProgress`, `entryDomains`, `entryGoals`, `templates` — is implicitly the owner's. (`userSettings` exists but is a single-row settings table, not a users table.) Multi-tenancy isn't a flag; it's a refactor across the whole data layer.

Three independent workstreams need to land before friends can sign up:

1. Schema migration: add `userId` to every domain table.
2. Query scoping: every Drizzle query in the codebase must filter by current user. A single missed filter is a cross-user data leak.
3. AI cost handling: friends generating cleanups, summaries, lens reflections, and goal evaluations against the owner's API keys.

## Phase 1 (deploy gate, current scope)

Single-tenant deploy, no schema changes:

- Clerk added with allowlist mode — only the owner's email can sign in. Friends literally cannot create an account.
- Cloudflare Tunnel exposes only `journal.chaseconover.com` → `chronicle:3000` on the homelab Pi. No other services on the host become public. See homelab repo for tunnel config.
- All existing data stays as-is. No migration. No `userId` columns.
- Existing AI keys remain owner-funded; cost is bounded by the owner's own usage.

Phase 1 is the prerequisite for Phase 2 — the deploy and auth pipeline gets validated under real daily use before multi-tenancy is layered on.

## Phase 2 — Schema migration

Add `userId TEXT NOT NULL` (Clerk user ID) to every table that contains user-owned data. New migration adds the column to existing rows by backfilling them all to the owner's Clerk ID.

Tables that need `userId`:

| Table | Notes |
|---|---|
| `entries` | Most-read table; needs an index on `(userId, date)` |
| `domains` | Per-user — Jane's "fitness" should not leak to John |
| `entryDomains` | Implicitly scoped via the entry, but adding `userId` directly avoids join-side leaks |
| `tags` | Per-user |
| `links` | Per-user (links between entries) |
| `relations` | Per-user |
| `lenses` | Per-user (each user's lens definitions are personal) |
| `lensReflections` | Per-user |
| `lensPeriodReflections` | Per-user |
| `goals` | Per-user |
| `entryGoals` | Per-user |
| `goalProgress` | Per-user |
| `templates` | Per-user templates (later: also support shared/system templates) |
| `userSettings` | Switch from single-row to one row per `userId`; primary key becomes `userId` |

Indexes: every table that's filtered by user should index `(userId, ...primary-sort-column)` — typically `(userId, date)` for entry-shaped tables.

## Phase 2 — Query scoping (the dangerous part)

Don't rely on grep + memory to remember "did I add the userId filter?" Build a structural guarantee.

**Pattern: per-request scoped DB handle.** In a request context (server action, route handler), derive `userId` from the Clerk session and create a `userScopedDb` wrapper that auto-injects `WHERE userId = ?` on every query. Direct `db` access from request handlers becomes forbidden by lint rule. The only escape hatch is admin/migration code that explicitly opts out.

Sketch:

```ts
// db/scoped.ts
export function userScopedDb(userId: string) {
  return {
    entries: {
      findMany: (args) => db.select().from(entries).where(and(eq(entries.userId, userId), args?.where)),
      // ... per-table wrappers
    },
    // ... per-table sub-objects
  };
}

// Used as:
const { userId } = auth();
const sdb = userScopedDb(userId);
const todays = await sdb.entries.findMany({ where: eq(entries.date, today) });
```

Audit rule: ESLint rule blocks direct `import { db } from "@/db"` outside `db/` and `scripts/`. Any query that needs cross-user reach is explicit and reviewable.

## Phase 2 — AI cost handling

Once friends use the app, every cleanup / summarize / lens-reflect / goal-evaluate hits the owner's Anthropic + OpenAI keys. This needs solving before friends are let in, not after.

Three viable models, in increasing complexity:

### Option A — BYO API keys (recommended for friends-scale)

Each user adds their own Anthropic / OpenAI key in settings. The app uses the per-user key for all model calls made on their behalf. Owner pays $0 for friends' usage.

- **Pros:** zero billing infrastructure, scales to any number of friends, friends understand exactly what they're paying for, lowest legal/financial complexity.
- **Cons:** friends need an Anthropic account (modest UX hit), no fallback if a friend's key runs out of credit, owner can't subsidize.
- **Implementation:** add `userId`-scoped `apiKeys` table with per-provider encrypted storage, route model calls through a per-request resolver that picks the user's key.

### Option B — Owner pays + flat monthly subscription via Stripe

Friends pay a flat fee (e.g. $5/mo) for an entry cap (e.g. 60 entry-cleanups/mo), pay-per-use after. Owner reconciles AI cost vs. revenue.

- **Pros:** smoother UX (no API key setup), clean billing.
- **Cons:** real product work — Stripe integration, usage metering, cap enforcement, dunning, refunds, chargeback handling. Owner takes margin risk.
- **Implementation:** Stripe Customer Portal for self-serve, `usage` table tracking tokens per user per day, hard cap enforcement before model calls.

### Option C — Hybrid

Owner pays for a free tier (e.g. 10 entries/mo), users upgrade by either adding their own key (free) or subscribing (paid). Combines the optionality of A with the smooth onboarding of B.

**Recommendation: start with A.** It's the lowest-effort path that satisfies "friends shouldn't cost me money," matches the friends-scale audience (~5–20 people), and doesn't lock out the option to add B later.

## Phase 2 — Rate limiting & abuse prevention

Even with BYO keys, the app's own resources (DB writes, server CPU, Cloudflare bandwidth) need protection:

- Per-user rate limit on entry creation (e.g. 100/day) — prevents one runaway script from filling the DB.
- Per-user rate limit on AI route invocations (e.g. 200/day) — prevents accidental cost runaway on shared keys.
- Cloudflare WAF rule: rate-limit by Clerk user ID where extractable, fall back to IP.

## Phase 2 — Sign-up flow

Clerk supports several modes:

- **Open signup** — anyone with an email can join. Fits "friends and friends-of-friends."
- **Allowlist** — owner approves emails. Fits tight friend circle, prevents random discovery from causing unwanted accounts.
- **Invitation-only** — owner generates invite codes, no public signup form. Strongest control.

Recommended for Phase 2 launch: **allowlist**. Default to deny, owner adds friend emails ahead of time. Easy to relax later.

## Migration plan (existing data → multi-user)

Single migration step:

1. Add `userId` columns (nullable initially).
2. Backfill all existing rows to the owner's Clerk user ID.
3. Add `NOT NULL` constraint.
4. Create indexes on `(userId, ...)` per table.
5. Deploy code changes that require `userId` on all writes.

The owner's existing entries / goals / lenses / etc. transparently become "the owner's data" in a multi-user world.

## Out of scope for Phase 2

These are deliberately deferred:

- Sharing entries between users (e.g. "Jane shares this entry with John").
- Shared lenses (system-provided lens templates anyone can clone).
- Group / family accounts.
- Export / takeout (per-user data export).
- Account deletion with data scrubbing (GDPR-style).

Each of those is its own scoped piece, layered on after Phase 2 ships.

## Estimated scope

Best guess for a focused weekend (~6–10 hours of real work):

- Schema migration + backfill: 1–2 hours.
- `userScopedDb` helper + ESLint rule + audit pass: 3–5 hours (this is the bulk).
- BYO API keys settings UI + per-request key resolver: 1–2 hours.
- Clerk allowlist config + sign-up page polish: ~30 min.
- Rate-limit middleware: ~30 min.

Risk areas (in priority order): the query audit (data-leak risk), per-user key encryption-at-rest, and rate-limit correctness under concurrent requests.
