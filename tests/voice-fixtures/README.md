# Voice Preservation Fixtures

These fixtures test that braindump cleanup (`POST /api/process/cleanup`) preserves the writer's voice — their word choices, stylistic quirks, lowercase proper nouns, shorthand, and self-addressing style — AND tags each entry with the right domains. See ADR 5 in `docs/decisions.md`.

The runner posts each fixture's `raw_text` and `available_domains` to the endpoint, then asserts:

- every `must_contain` string appears verbatim in the formatted output
- every `must_not_contain` string is absent from the formatted output
- every `must_contain_domains` ID appears in `suggested_domain_ids`
- every `must_not_contain_domains` ID does NOT appear

If the system prompt ever drifts toward "improving" the writing, or the domain inference goes off the rails, these fixtures catch it immediately.

## Adding a new fixture

Drop a new `.json` file in this directory. Schema:

```jsonc
{
  "name": "A short title",
  "notes": "What this fixture is testing (the voice quirks + domain expectations)",
  "raw_text": "the full unstructured braindump as one blob...",
  "available_domains": [
    { "id": "work",          "name": "Work" },
    { "id": "fitness",       "name": "Health & Fitness" },
    { "id": "faith",         "name": "Faith & Spirituality" },
    { "id": "finances",      "name": "Finances" },
    { "id": "relationships", "name": "Relationships" }
    // ...whatever subset is plausible for this fixture
  ],
  "must_contain": [
    "exact-case tokens or phrases that MUST appear in the cleanup output"
  ],
  "must_not_contain": [
    "strings the AI should never produce — typical 'improvements' like",
    "Let's instead of Lets, capitalizing proper nouns, expanding abbreviations"
  ],
  "must_contain_domains": ["work", "faith"],
  "must_not_contain_domains": ["fitness"]
}
```

The fixture's `available_domains` IDs are the universe Claude is told to pick from for this test — they don't need to match any seeded DB IDs. The runner forwards them verbatim. Choose stable, readable slugs.

The file name itself is free-form — use a date + short slug like `2026-05-03-morning-run.json`.

## Tips for good assertions

- `must_contain` should be **distinctive substrings**, not common words. `"connecting with god"` works; `"you"` doesn't.
- `must_not_contain` is where you encode the "improvements" the AI is tempted to make — elevated vocabulary, expanded shorthand, softened opinions, capitalized proper nouns. Include the capitalized/elevated forms of things you kept lowercase/casual.
- `must_contain_domains` should require **inference**, not keyword matching. "I ran 5 miles" → `fitness` is a good test; "I went to the gym for fitness" is not (too easy).
- Use real writing. Synthetic examples won't surface the drift that real voice does.
- Start small (3-8 assertions per fixture). Too many and maintenance gets painful.

## Running

1. Start the dev server in one terminal: `npm run dev`
2. In another: `npm run voice:check`

The runner hits `http://localhost:3000/api/process/cleanup`, so Chronicle must be running. Each fixture costs one Claude API call (~$0.005 at current Sonnet 4.6 pricing); the prompt cache amortizes this across fixtures in a 5-minute window.

Exit code is 0 if all pass, 1 if any fail. Failure output shows which assertion broke and a 300-char excerpt of the cleanup output around it.
