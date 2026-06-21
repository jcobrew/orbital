---
name: update-programs
description: >-
  Update the Founder Atlas program datasets. Use when asked to update, refresh,
  re-verify, or add to the founder-program data (startup-programs-data.json /
  traditional-programs-data.json) — whether run interactively or from a scheduled
  routine. Gathers via web research, verifies, dedupes against existing entries,
  edits the JSON, and opens a DRAFT PR. Never pushes data straight to the live site.
---

# Founder Atlas — update programs

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

The dividing line is the **live-in test**: does the program require participants to
relocate and live/build together for a defined stretch? If yes → residential. If it's
desks, mentoring, and cheques with no live-in/relocation → traditional. Antler, YC,
a16z Speedrun, Sequoia Arc, Techstars, Betaworks, On Deck, Z Fellows, HAX, etc. are
**traditional**. When unsure which file an entry belongs in, flag it in the PR rather
than guessing.

### The two files are NOT maintained equally

Residential is the product; traditional is context and a funnel. Spend effort
accordingly:

- **`startup-programs-data.json` (residential) — actively curated.** This gets the
  full treatment every run: status re-verification, rolling re-checks, new-program
  discovery, hybrid hunting, geographic gap-filling. This is where the routine's
  budget goes.
- **`traditional-programs-data.json` (traditional) — lightly maintained reference
  layer.** It exists to (a) give the residential map a "compared to what?" contrast
  and (b) serve as the **funnel where future residencies first appear**. Only touch a
  traditional entry when something *material* changes (program shut down, moved,
  renamed). **Do not** spend the run re-verifying every accelerator's batch dates —
  that is the lowest-value, highest-volume work in the dataset.

Keep traditional *complete enough to be a credible baseline*, not *fresh to the day*.

### Hybrid programs (accelerator/matching → residency)

Some programs are an accelerator or cofounder-matching scheme that **culminates in a
relocation + co-living phase** — the live-in sprint is real and central, not a
side perk. These belong in the **residential** file, classified by their live-in
phase. Examples already in the data:

- **SILTA** — a Finnish accelerator that moves its cohort to a San Francisco founder
  house to live and build for ~12 weeks. `type: "Accelerator → Founder House"`.
- **The Bridge (by Entrepreneurs First)** — starts as cofounder matching, then the
  cohort lives and builds together in a Bay Area hacker house for 8 weeks.
  `type: "Cofounder Matching → Residency"`.

Rules for hybrids:

- **Classify by the live-in phase**, not the parent brand. Use an arrow `type` like
  `"Accelerator → Residency"` or `"Cofounder Matching → Residency"` so the hybrid
  model is visible at a glance.
- **Parent and hybrid can coexist in different files.** *Entrepreneurs First* (the
  global talent investor) lives in the **traditional** file; *The Bridge* (its live-in
  SF residency) lives in **residential**. They are distinct programs — keep them
  separate by giving each its own `domain` (e.g. `joinef.com` vs `join-thebridge.com`)
  so dedup (which keys on `name`/`domain`) does not collapse them or false-flag a dup.
- **The bar is a genuine, required relocation + co-living block.** A program that
  merely offers an optional trip, a demo-day visit, or remote mentoring is **not** a
  hybrid — it stays traditional. If the live-in phase is ambiguous or unconfirmed,
  flag it in the PR instead of filing it as residential.
- **Reclassification counts as a judgment call.** Moving a program across the boundary
  (as The Bridge was — EF's "The Bridge" was previously excluded as a pure accelerator
  before it launched as a live-in residency) must be noted in the PR body with the
  source that justifies the move. Routines should *propose* such moves, not make them
  silently.

## Entry schema

Each program is an object in the top-level `programs` array. Copy an existing entry
as a template. Required fields:

```json
{
  "name": "Program Name",
  "type": "Hacker House | Residency | Startup Campus + Fund | Accelerator | Accelerator → Residency | Cofounder Matching → Residency | ...",
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
4. **Re-verify `rolling` entries hardest.** `rolling` is the dominant value
   (~90 of 123 programs) and the lowest-information one — it's the default
   whenever no fixed window is known, so it's where the data silently drifts.
   Do **not** skim past it. For each `rolling` program, open its live apply/landing
   page and confirm it really is always-open:
   - If you find a discrete current cohort window → change to `open` (or
     `closing-soon` if the deadline is imminent, `running` if mid-cohort).
   - If applications are announced but not yet open → `opening-soon`.
   - If the program is full, paused, or the latest cohort has closed → `closed`.
   - If it genuinely accepts applications anytime → leave `rolling`, but note in
     the PR that it was re-confirmed (and against what source).
   - If the apply page is dead / domain parked / no live presence → do not silently
     keep `rolling`; flag it in "Needs human review" as possibly defunct.
   Treat a `rolling` tag as "unverified default until checked," not as settled.
   **Prioritize residential `rolling` entries.** Traditional ones are the reference
   layer — only re-check a traditional entry if you're already looking at it for
   another reason (see the maintenance tiers above).
5. **Run the promotion scan (traditional → residential).** The traditional file is
   the funnel where future residencies first appear. Quickly scan it for any program
   that has **added a required relocation + co-living phase** since it was last
   reviewed (the EF → The Bridge pattern). For any candidate:
   - Confirm the live-in phase is genuine and required (apply the hybrid bar, not an
     optional trip).
   - **Propose** the promotion in the PR — either add a residential hybrid entry with
     an arrow `type` and its own `domain` (parent stays in traditional), or flag it for
     review if co-living is unconfirmed. Do **not** move programs across the boundary
     silently. Current watchlist: *Entrepreneurs First* (main program now relocates the
     cohort to SF — promote only if that phase becomes confirmed co-living).
6. **Add clearly-verified new programs** to the correct file, using the schema.
   - Skip anything you cannot corroborate on the program's own site or two
     independent sources.
   - De-dupe: do not add a program whose `name` or `domain` already exists.
7. **Flag, don't guess.** Anything uncertain — unverifiable existence, ambiguous
   residential-vs-traditional classification, missing coordinates, suspected
   duplicate — goes in the **PR body as a checklist**, not silently into the data.
   (Precedent: "Threshold (UK)" was kept out / clearly labelled because it had no
   verifiable public presence.)
8. **Validate** the JSON parses and the schema is intact (see Validation).
9. **Open a draft PR** (see Output).

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

### Rolling re-verified (<n> checked, <m> changed)
- <Program> — re-confirmed rolling | changed to <status> — <source URL>

### Promotions traditional → residential (<n>)
- <Program> — added residential hybrid entry / flagged for review — <source URL>

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
