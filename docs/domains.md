# Life Domains

## Lenses vs Domains

Chronicle has two independent axes of organization:

- **Lenses** answer: *"How do I interpret this experience?"* — faith, therapy, stoic philosophy, career growth. They are analysis frames applied to entries after they're written.
- **Domains** answer: *"What part of my life is this about?"* — work, fitness, relationships, music, diet, finances. They are categories applied to entries at write time.

These are orthogonal. A single entry can belong to multiple domains and be analyzed through multiple lenses:

```
Entry: "Had a great jam session with Marcus after a tough day at work.
        Playing bass for two hours completely reset my headspace."

Domains: [music, work, relationships]

Faith lens:    "Music as a form of worship and restoration"
Career lens:   "Creative outlets as a coping mechanism for work stress"
Therapy lens:  "Healthy regulation strategy — physical + social + creative"
```

## Why Domains Exist

Without domains, everything is a flat timeline. Domains let you:

1. **Filter your journal by life area** — "Show me only my fitness entries for the last 3 months"
2. **Track progress within a specific domain** — "How has my music practice evolved this year?"
3. **See domain balance** — "I wrote about work 25 days this month and relationships 3 days. That ratio tells me something."
4. **Set domain-specific goals** — "Practice guitar 4 times per week" tied to the music domain
5. **Generate domain-specific summaries** — a monthly fitness summary that only looks at fitness-tagged entries

## Built-in Domains

These are the default domains available to all users. Users can add custom domains.

| Domain | Description | Example entries |
|--------|-------------|-----------------|
| **Work** | Professional life, career, job | Meetings, projects, wins, frustrations, learning |
| **Relationships** | Family, friends, romantic, social | Conversations, quality time, conflict, connection |
| **Health & Fitness** | Exercise, physical health, energy | Workouts, runs, how your body feels, injuries |
| **Diet & Nutrition** | Food, cooking, eating habits | What you ate, meal prep, cravings, experiments |
| **Finances** | Money, budgeting, investing | Spending decisions, savings milestones, financial stress |
| **Faith & Spirituality** | Prayer, worship, spiritual practice | Church, meditation, spiritual reading, moments of awe |
| **Music** | Playing, listening, creating music | Practice sessions, shows, new discoveries, songwriting |
| **Creative** | Art, writing, making things | Projects, inspiration, creative blocks, craft development |
| **Learning** | Education, reading, skill building | Books, courses, tutorials, new concepts |
| **Home & Environment** | Living space, homelab, projects | Home improvement, organization, the physical space you inhabit |
| **Hobbies** | Catch-all for leisure activities | Gaming, gardening, hiking, cooking, whatever you do for fun |
| **Personal Growth** | Self-improvement, habits, mindset | Reflections on character, habit tracking, mindset shifts |

## How Domains Are Applied

### At Write Time

When writing an entry, the user can tag it with one or more domains. The UI provides:

- A multi-select domain picker in the editor sidebar
- AI-suggested domains based on the entry content (after cleanup)
- The ability to add entries to domains retroactively

### In the Calendar View

The calendar can be filtered by domain. "Show me my music month" displays only days with music-tagged entries. Color coding per domain gives an at-a-glance view of how time is distributed.

### In Summaries

Domain-aware summaries are generated alongside the standard weekly/monthly summaries:

- **Standard summary:** "Here's your whole week across everything"
- **Domain summary:** "Here's your fitness week" / "Here's your work month"

Domain summaries are optional — the user chooses which domains get their own summary track. Not every domain needs a weekly summary. You might want weekly fitness summaries but only monthly finance summaries.

### With Goals

Goals can optionally be tied to a domain in addition to a lens:

- Goal: "Run a sub-25-minute 5K" → Domain: Health & Fitness, Lens: Health & Habits
- Goal: "Ship a side project" → Domain: Creative, Lens: Career
- Goal: "Read 24 books this year" → Domain: Learning, Lens: (any or none)

### With Lenses

Lenses can be applied to domain-filtered entries for focused analysis:

- "Analyze my work entries through the career lens" → career-specific growth tracking
- "Analyze my relationship entries through the therapeutic lens" → relational pattern detection
- "Analyze my music entries through the creative lens" → practice and inspiration patterns

## Custom Domains

Users can create custom domains for any life area not covered by the built-ins:

- **Parenting** — for tracking the journey of raising kids
- **Sobriety** — for recovery-focused journaling
- **Travel** — for documenting trips and adventures
- **Volunteering** — for service and community involvement
- **Side Business** — for entrepreneurial ventures separate from day-job work

Custom domains work identically to built-in domains — they're just a label with a name and optional color/icon.

## Domain Analytics

Over time, domain tagging enables quantitative self-reflection:

- **Domain distribution charts** — what percentage of your entries touch each domain
- **Domain trends over time** — are you writing more about work and less about relationships?
- **Domain co-occurrence** — which domains appear together? (music + relationships = jam sessions with friends)
- **Domain gaps** — periods where a domain drops off entirely (stopped writing about fitness for 3 months — what happened?)

These analytics aren't about judgment — they're about awareness. The data shows you where your attention actually goes, which may be different from where you think it goes.
