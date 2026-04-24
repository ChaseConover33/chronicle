# Templates

## What Is a Template?

A template defines the structure of a journal entry — which sections appear, what prompts guide the user's writing, and how the AI organizes the result. Templates are about **capture**, not analysis. They shape what you write, not how it's interpreted (that's what [lenses](lenses.md) do).

## How Templates Work

When a user starts a new entry, they pick a template (or use their default). The template determines:

1. **Which sections appear** in the editor — each section has a heading and a writing prompt
2. **Which sections are required vs optional** — required sections have prompts that encourage writing; optional sections can be skipped
3. **How the AI cleans up the entry** — the template tells the AI what sections to organize the raw text into

The user writes freely in each section. When they click "Clean up," the AI organizes their writing within the template's structure while preserving their voice.

## Core Sections

These sections are available across all templates. Each template chooses which ones to include.

| Section | Purpose | Prompt |
|---------|---------|--------|
| **Summary** | AI-generated 2-3 sentence overview | *(generated, not written by user)* |
| **What Happened** | Main narrative of the day | "What did you do today? What happened?" |
| **What I Learned** | Key lesson or insight | "What's one thing you know now that you didn't this morning?" |
| **Gratitude** | What you're thankful for | "What are you grateful for today?" |
| **Spiritual Reflection** | Faith / meaning / the sacred | "Where did you notice something bigger than yourself?" |
| **Emotional Check-in** | How you felt and why | "What emotions were strongest today? What triggered them?" |
| **Career & Professional** | Work wins, challenges, growth | "What did you accomplish or struggle with professionally?" |
| **Relationships** | People and connection | "Who did you connect with? Any tension or closeness worth noting?" |
| **Health & Body** | Physical state, exercise, energy | "How did your body feel today? Did you move, rest, fuel well?" |
| **Creative Work** | Making things | "What did you create or work on creatively?" |
| **What I Read & Explored** | Links, articles, books, media | "Anything you read, watched, or interacted with that stuck with you?" |
| **Free Write** | Unstructured space | "Anything else on your mind." |

## Built-in Templates

### Daily Journal (Default)

The general-purpose template. Good for anyone starting out.

**Required sections:**
- What Happened
- What I Learned
- Gratitude

**Optional sections:**
- Spiritual Reflection
- Emotional Check-in
- What I Read & Explored
- Free Write

**AI-generated:**
- Summary (created during cleanup)

---

### Faith-Centered Daily

For users whose primary frame is spiritual reflection.

**Required sections:**
- What Happened
- Spiritual Reflection
- Gratitude

**Optional sections:**
- What I Learned
- Emotional Check-in
- Relationships
- What I Read & Explored

**AI-generated:**
- Summary

---

### Career & Growth

For users focused on professional development.

**Required sections:**
- What Happened
- Career & Professional
- What I Learned

**Optional sections:**
- Emotional Check-in
- Relationships
- What I Read & Explored
- Free Write

**AI-generated:**
- Summary

---

### Therapeutic Reflection

For users using journaling as part of mental health practice.

**Required sections:**
- What Happened
- Emotional Check-in
- Gratitude

**Optional sections:**
- Relationships
- Health & Body
- What I Learned
- Free Write

**AI-generated:**
- Summary

---

### Holistic

Everything. For users who want the fullest possible capture.

**Required sections:**
- What Happened
- What I Learned
- Gratitude

**Optional sections:**
- Spiritual Reflection
- Emotional Check-in
- Career & Professional
- Relationships
- Health & Body
- Creative Work
- What I Read & Explored
- Free Write

**AI-generated:**
- Summary

---

### Retrospective

For writing about the past — a chapter of your life, a defining moment, a period of change.

**Required sections:**
- What Was Happening (replaces "What Happened" — past tense, broader scope)
- What I Didn't See at the Time
- What I See Now

**Optional sections:**
- What I Learned
- Gratitude (in hindsight)
- Spiritual Reflection (looking back)
- Relationships
- Free Write

**AI-generated:**
- Summary

---

### Minimal

For days when you don't have much to say but want to maintain the habit.

**Required sections:**
- What Happened (short — even a sentence counts)
- Gratitude (one thing)

**Optional sections:**
- Free Write

**AI-generated:**
- Summary

## Custom Templates

Users can create their own templates by:

1. Choosing a name
2. Selecting which core sections to include (required vs optional)
3. Optionally customizing the writing prompts for each section
4. Optionally adding entirely new sections with custom headings and prompts

Custom sections follow the same structure as core sections — a heading, a writing prompt, and a flag for required vs optional.

## Template and Lens Independence

Templates and lenses are independent systems:

- **Templates** shape what you write (capture layer)
- **Lenses** shape how your writing is analyzed (analysis layer)

Any template works with any lens. A user with the Career & Growth template and a Faith lens will get faith-based analysis of their career-focused entries — the AI will look for spiritual themes in professional experiences. This is intentional. Life doesn't separate neatly into categories, and the most interesting insights often come from examining one domain through another's frame.

## Entry Format After Cleanup

When the AI processes a raw entry, the result is a markdown document with frontmatter:

```markdown
---
date: 2026-04-23
type: daily
status: draft
template: daily-journal
tags: []
links: []
related: []
---

## Summary

A brief AI-generated overview of the day.

## What Happened

The user's words, organized into coherent paragraphs. The AI may
reorder for clarity but does not add content or change the voice.

## What I Learned

The key insight, distilled from what the user wrote.

## Gratitude

What the user is grateful for, in their own words.

## What I Read & Explored

- [Article Title](https://...) — why it mattered
```

The frontmatter fields (`tags`, `links`, `related`) start empty and get populated either by the user or by AI suggestions during the save process.
