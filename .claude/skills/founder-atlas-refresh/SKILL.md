---
name: founder-atlas-refresh
description: >-
  Refresh the Founder Atlas program datasets. Use when asked to update, refresh,
  re-verify, or add to the founder-program data (startup-programs-data.json /
  traditional-programs-data.json) — whether run interactively or from a scheduled
  routine. Gathers via web research, verifies, dedupes against existing entries,
  edits the JSON, and opens a DRAFT PR. Never pushes data straight to the live site.
---

# Founder Atlas — data refresh

You are maintaining the data behind a public, auto-deploying map of founder programs.
The two JSON files are the **single source of truth** and Vercel deploys `master` on
push — so a bad entry is live immediately. Your job is to gather and curate carefully,
then **open a draft PR for human review**. Do not push data to `master`.

This skill encodes the *steady-state refresh* process. Big discovery passes,
taxonomy changes, and judgment-heavy curation are done interactively (in Cowork),
and any new rules learned there should be folded back into this file.

## The two datasets

- `startup-programs-data.json` — **residential** programs only: residencies, hacker
  houses, co-living, startup campuses, programs with a genuine **live-in or
  relocation** component.
- `traditional-programs-data.json` — traditional accelerators, incubators, talent
  investors **without** a live-in/relocation element.

The dividing line is real and load-bearing. Antler, EF, YC, a16z Speedrun, Sequoia
Arc, Techstars, Betaworks, On Deck, Z Fellows, HAX, etc. are **traditional** — never
put them in the residential file. When unsure which file an entry belongs in, flag it
in the PR rather than guessing.

## Entry schema

Each program is an object in the top-level `programs` array. Copy an existing entry
as a template. Required fields:

```json
{
  "name": "Program Name",
  "type": "Hacker House | Residency | Startup Campus + Fund | Accelerator | ...",
  "city": "San Francisco",
  "country": "USA",
  "lat": 37.8065,
  "lng": -122.429,
  "focus": "AI, hardware, robotics, ...",
  "operator": "Who runs it",
  "stage": "Pre-seed / very early",
  "status": "rolling",
  "status_detail": "Recruiting status + key terms (equity, $, cohort length).",
  "domain": "example.com",
  "url": "https://example.com/apply",
  "highlight": "One memorable line about the program"
}
```

`status` must be one of (see `meta.status_legend` in the JSON):
`rolling`, `open`, `closing-soon`, `opening-soon`, `running`, `closed`.

### Optional founder fields (fill when verifiable — never guess)

The UI and API also support these optional fields (added in the founder-first refactor). They show
as **"Unknown"** in the product until populated, so only add a field when a **primary source**
states it. Add `sourceUrls` + `lastVerified` whenever you fill any of them.

- `format`: one of `in-person` | `remote` | `hybrid` | `live-in`
- `stageFit`: array from `pre-idea, idea, pre-product, mvp, pre-seed, seed, series-a-plus, repeat-founder, student, researcher`
- `founderFit`: array from `first-time-founder, solo-founder, technical-builder, domain-expert, repeat-founder, student-founder, researcher, international-founder, relocating-founder, fundraising-soon, needs-focus, needs-community, needs-customers, needs-capital`
- `sectorFocus`: array of sector tags (e.g. `["AI","climate"]`)
- `applicationDeadline`, `nextCohortStart`: ISO dates
- `durationWeeksMin`, `durationWeeksMax`: numbers; `cohortSize`: free text
- `fundingAmount`, `equityTaken`, `cost`: free text (e.g. `"$250K"`, `"7%"`)
- `providesHousing` / `providesWorkspace` / `providesFunding` / `providesMentorship` /
  `providesInvestorAccess` / `providesDemoDay` / `providesVisaSupport`: `true` | `false` | `null` (unknown)
- `applyUrl`: direct application URL (distinct from `url`)
- `sourceUrls`: array of URLs used to verify this entry
- `lastVerified`: ISO date you confirmed the entry
- `verificationStatus`: `verified` | `needs-review` | `unverified`
- `tags`, `notes`: optional free-form

Coordinates: `lat`/`lng` are decimal degrees for the program's city/building. Use a
known landmark or the operator's stated location; do not invent precise rooftop
coordinates. A city-center coordinate is fine — the UI jitters overlapping pins.

## Process

1. **Read both JSON files** and build a mental index of existing `name` + `domain`
   values. This is your dedup key.
2. **Research.** Check program websites and social handles first; corroborate with
   the source list below and fresh web search. Prefer primary sources (the program's
   own site/X) over aggregators.
3. **Refresh existing entries.** For each program, re-verify `status` /
   `status_detail` (cohorts open/close often) and fix anything stale. Touch only
   fields that changed.
4. **Add clearly-verified new programs** to the correct file, using the schema.
   - Skip anything you cannot corroborate on the program's own site or two
     independent sources.
   - De-dupe: do not add a program whose `name` or `domain` already exists.
5. **Flag, don't guess.** Anything uncertain — unverifiable existence, ambiguous
   residential-vs-traditional classification, missing coordinates, suspected
   duplicate — goes in the **PR body as a checklist**, not silently into the data.
   (Precedent: "Threshold (UK)" was kept out / clearly labelled because it had no
   verifiable public presence.)
6. **Validate** the JSON parses and the schema is intact (see Validation).
7. **Open a draft PR** (see Output).

## Scope guardrails (important for unattended runs)

- **PR-gated, never direct to `master`.** Always open a *draft* PR.
- **Refresh + verified additions only.** Do not restructure the taxonomy, rename
  fields, remove programs in bulk, or change the residential/traditional boundary.
  Those are interactive decisions — surface them in the PR body instead.
- **When in doubt, flag it.** A short PR with a few solid updates and a list of
  "needs human review" items is the success case. A large diff full of
  low-confidence additions is a failure.
- **Cite sources** for every new program and every status change, in the PR body.

## Validation

Before opening the PR:

```bash
# Both files must be valid JSON
python3 -c "import json; json.load(open('startup-programs-data.json'))"
python3 -c "import json; json.load(open('traditional-programs-data.json'))"

# Spot-check: every program has the required keys
python3 - <<'PY'
import json
req = {"name","type","city","country","lat","lng","status","url"}
for f in ("startup-programs-data.json","traditional-programs-data.json"):
    progs = json.load(open(f))["programs"]
    bad = [p.get("name","?") for p in progs if not req <= set(p)]
    print(f, len(progs), "programs", "— missing fields:" , bad or "none")
PY
```

Optionally update `meta.compiled` (the date) when you change data.

## Output: the draft PR

Commit to the working branch and open a **draft** PR. Body template:

```
## Founder Atlas data refresh — <date>

### Updated (<n>)
- <Program> — <what changed> — <source URL>

### Added (<n>)
- <Program> (<file>) — <source URL>

### Needs human review
- [ ] <uncertain item + why>

Datasets remain the source of truth; merging triggers a Vercel deploy.
```

Keep the PR focused; if a change is large or judgment-heavy, describe it in
"Needs human review" rather than committing it.

## Trusted sources (starting set — extend as you learn)

- Program sites: f.inc, southparkcommons.com, hf0.com, agihouse.ai,
  livetheresidency.com, forgeresidency.com, arrayah.city, ns.com, thefoundery.in,
  londonfounderhouse.com, neo.com, buildclub.ai, edgeesmeralda.com
- Aggregators / news: cleverhack.com/2026-ai-startup-founder-resources, Sifted,
  TechCrunch, Bloomberg, SF Standard, Capital Brief, SmartCompany, Entrepreneur India
- The Residency publishes its full house network on its homes page — pull from there
  rather than memory, as it changes.

## Known watch-items (check each run)

- **Threshold (UK)** — was an unverified placeholder; de-flag only with a real source.
- **Forge Dubai**, **Arrayah Melbourne & Brisbane** — "opening-soon"; catch first cohorts.
