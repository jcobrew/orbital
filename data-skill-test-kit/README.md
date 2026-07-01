# 0rbital data-skill test kit

A **self-contained** harness for testing whether an external agent can generate
importable 0rbital co-living program data — no repo checkout required. Use it to
stress-test the `founder-atlas-refresh` skill against different agents and feed
what you learn back into the skill.

## What's in here

| File | Purpose |
| --- | --- |
| `PROMPT.md` | The task to give the agent under test — a standalone adaptation of the `founder-atlas-refresh` skill (emit JSON, no repo/PR). |
| `TAXONOMY.md` | The exact controlled vocabularies (canonicalType, supportModes, format, status, …) the output must use. |
| `SCHEMA.md` | Required vs recommended vs optional keys, and the target JSON shape. |
| `example-record.json` | One fully-populated, in-scope record to copy as a template (passes the validator). |
| `output-template.json` | Empty `{ "programs": [], "_notes": [] }` skeleton for the agent to fill. |
| `validate.py` | The scorer. No dependencies (stdlib only). Enforces required keys, enums, co-living scope, provenance, dedup; reports UI-field coverage. |

## How to run a test

1. Give the agent under test **`PROMPT.md` + `TAXONOMY.md` + `SCHEMA.md` +
   `example-record.json`**. Ask it to produce `output.json` (shape:
   `{ "programs": [...], "_notes": [...] }`).
2. Score it:
   ```bash
   python3 validate.py output.json
   ```
   - Exit `0` / `RESULT: PASS` → structurally importable.
   - Exit `1` / `RESULT: FAIL` → per-record ERRORs listed; agent (or you) fixes and re-runs.
3. Read the WARNINGs and the **UI-field coverage** line — a record can pass while
   still being all "Unknown". High coverage from sourced facts is the real goal.
4. Human-check the passing records: real programs? in scope (a selective founder
   cohort that lives together)? facts actually on the cited `sourceUrls`?

## Importing into the live repo

`output.json` is intentionally **not** auto-imported (nothing hits the live site
unreviewed). To import: strip `_notes`, and merge the objects in `programs` into
the top-level `programs` array of `src/data/programs-data.json`, then let the
normal review + draft-PR flow run. Validate in-repo with:
```bash
npm test && npm run build && npx astro check
```

## Using results to improve the skill

The kit is deliberately a **frozen snapshot** of the skill's rules. When a test
reveals a systematic miss — agents inventing enum values, adding out-of-scope
programs, leaving UI fields blank, guessing unsourced facts — fix it in **both**
places so they stay in sync:
- the real skill: `.claude/skills/founder-atlas-refresh/SKILL.md`
- this kit: `PROMPT.md` / `TAXONOMY.md` / `SCHEMA.md`, and add a rule to
  `validate.py` if the miss is mechanically checkable.

If you change the canonical vocabularies in `src/data/taxonomy.ts`, re-sync the
enum sets at the top of `validate.py` and `TAXONOMY.md`.
