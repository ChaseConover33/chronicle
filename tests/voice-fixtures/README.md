# Voice Preservation Fixtures

These fixtures test that AI cleanup (`POST /api/process/cleanup`) preserves the writer's voice — their word choices, stylistic quirks, lowercase proper nouns, shorthand, and self-addressing style. See ADR 5 in `docs/decisions.md`.

The runner calls the cleanup endpoint with each fixture's raw sections, then asserts:

- every `must_contain` string appears verbatim in the output, AND
- every `must_not_contain` string is absent from the output.

If the system prompt ever drifts toward "improving" the writing, these fixtures catch it immediately.

## Adding a new fixture

Drop a new `.json` file in this directory. Schema:

```jsonc
{
  "name": "A short title",
  "notes": "What this fixture is testing (the voice quirks that matter)",
  "sections": [
    { "heading": "What Happened", "rawText": "the raw text the user typed..." }
    // ...more sections if desired
  ],
  "must_contain": [
    "exact-case tokens or phrases that MUST appear in the cleanup output"
  ],
  "must_not_contain": [
    "strings the AI should never produce — typical 'improvements' like",
    "Let's instead of Lets, capitalizing proper nouns, expanding abbreviations"
  ]
}
```

The file name itself is free-form — use a date + short slug like `2026-05-03-morning-run.json`.

## Tips for good assertions

- `must_contain` should be **distinctive substrings**, not common words. `"connecting with god"` works; `"you"` doesn't.
- `must_not_contain` is where you encode the "improvements" the AI is tempted to make — elevated vocabulary, expanded shorthand, softened opinions, capitalized proper nouns. Include the capitalized/elevated forms of things you kept lowercase/casual.
- Use real writing. Synthetic examples won't surface the drift that real voice does.
- Start small (3-8 assertions per fixture). Too many and maintenance gets painful.

## Running

1. Start the dev server in one terminal: `npm run dev`
2. In another: `npm run voice:check`

The runner hits `http://localhost:3000/api/process/cleanup`, so Chronicle must be running. Each fixture costs one Claude API call (~$0.02 at current Opus 4.7 pricing); the prompt cache amortizes this across fixtures in a 5-minute window.

Exit code is 0 if all pass, 1 if any fail. Failure output shows which assertion broke and a 300-char excerpt of the cleanup output around it.
