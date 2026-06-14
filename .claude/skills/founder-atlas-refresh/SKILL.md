---
name: founder-atlas-refresh
description: >-
  Refresh the Orbital program dataset. Use when asked to update, refresh,
  re-verify, or add to the founder-program data (src/data/programs-data.json) —
  whether run interactively or from a scheduled routine. Gathers via web research,
  verifies, dedupes against existing entries, edits the JSON, and opens a DRAFT PR.
  Never pushes data straight to the live site.
---

# Orbital — data refresh

You are maintaining the data behind a public, auto-deploying map of founder programs.
The JSON file is the **single source of truth** and Vercel deploys `master` on push —
so a bad entry is live immediately. Your job is to gather and curate carefully, then
**open a draft PR for human review**. Do not push data to `master`.

This skill encodes the *steady-state refresh* process. Big discovery passes, taxonomy
changes, and judgment-heavy curation are done interactively (in Cowork), and any new
rules learned there should be folded back into this file.

## The dataset (one unified file)

There is **one** dataset:

- `src/data/programs-data.json` — **every** founder-support program in a single
  top-level `programs` array. Residencies, hacker houses, accelerators, fellowships,
  government grants, startup visas, co-founder communities — all live here together.

> **There is no residential vs traditional split.** The old two-file model
> (`startup-programs-data.json` / `traditional-programs-data.json`) and the
> `residential`/`traditional` dataset axis are **retired**. A program is no longer
> classified by *which file it goes in*; it is classified by its **`canonicalType`**
> plus the other canonical dimensions below. (`dataset` survives only as a derived
> back-compat value in the legacy `/api/programs.json` shim — never set it by hand,
> never use it to decide where a record goes.)

The "lives in a house / must relocate" quality that the old `residential` file tried to
capture is now expressed **on the record itself**: `format: "live-in"` (or
`"relocation"`) plus `housing` in `supportModes`. A live-in residency and a commute-in
accelerator are two `canonicalType` values in the same file, not two files.

## Step 1 — pick the `canonicalType`

The **first question** when adding (or re-checking) a program is: *what is its
`canonicalType`?* This is the canonical machine ID from
[`src/data/taxonomy.ts`](../../../src/data/taxonomy.ts) (`programType` dimension),
documented in [`docs/program-taxonomy.md`](../../../docs/program-taxonomy.md). The **8
MVP categories** are:

| `canonicalType` | Use it when… |
| --- | --- |
| `founder-residency` | Live-in / relocation cohort built around focus — you move into a house/campus for a fixed term (HF0, The Residency, Neo). |
| `hacker-house` | Shared house / coliving organized around a tech scene; the value is builder density, often pay-rent (AGI House, STAK, Foundry). |
| `accelerator` | Fixed-length cohort: small cheque + mentorship + demo day, usually for equity (Y Combinator, Techstars). |
| `pre-accelerator` | Earlier, lighter-touch program that preps idea / pre-product founders for a full accelerator or first raise. |
| `founder-fellowship` | Membership + capital that backs the person before (or independent of) an idea (South Park Commons, Afore FIR). |
| `government-grant` | Public, non-dilutive funding / grant-backed program — money without equity (Start-Up Chile, national innovation grants). |
| `startup-visa` | Visa, relocation, or soft-landing program that lets a founder build in a country (Estonia / France / UK startup visas, Hub71). |
| `cofounder-matching` | Talent-investor or online community whose core value is finding a co-founder, peers, or a first cheque (Entrepreneur First, Antler, On Deck). |

Future / non-MVP types are also representable (`incubator`, `startup-studio`,
`corporate-accelerator`, `university-program`, `tech-transfer`, `deep-tech-program`,
`startup-campus`, `venture-debt`, `pop-up-village`, `ecosystem-support`, `other`). Use
them when a program genuinely fits, but remember they are **not** part of the MVP set
(see `docs/mvp-data-scope.md`), so they will not be tagged `mvp: true`.

**How to choose:**

- **Live-in / relocation → `founder-residency`** (with `format: "live-in"` and `housing`
  in `supportModes`). Do **not** route it to a separate file — the file is the same.
- **Shared house, pay-rent, network-first → `hacker-house`** (`housing` in
  `supportModes`, usually `format: "live-in"`, `costFundingModel: "fee"`).
- **Cohort + cheque + demo day → `accelerator`**; an earlier, lighter prep program →
  `pre-accelerator`.
- **Backs the person pre-idea → `founder-fellowship`**; matches you to a co-founder or
  is an online founder community → `cofounder-matching`.
- **Non-dilutive public money → `government-grant`**; visa / soft-landing →
  `startup-visa`.
- **Hybrid programs** (e.g. a cohort accelerator with a relocation phase) get their
  *primary* `canonicalType`, with the nuance captured in `format` and `notes` — do not
  invent a new type. If the primary type is genuinely ambiguous, **flag it in the PR**
  rather than guessing.
- If nothing fits, use `other` and **flag it** so a human can extend the taxonomy.

## Entry schema

Each program is an object in the top-level `programs` array of
`src/data/programs-data.json`. Copy an existing entry as a template.

### Canonical fields (set these first)

```json
{
  "canonicalType": "founder-residency",
  "supportModes": ["housing", "structure", "community", "funding"],
  "format": "live-in"
}
```

- `canonicalType` — one canonical `programType` ID (see Step 1).
- `supportModes` — array of `supportMode` IDs describing what the program concretely
  provides: `funding`, `housing`, `workspace`, `mentorship`, `investor-access`,
  `demo-day`, `visa-support`, `community`, `co-founder-matching`, `structure` (MVP);
  `customers`, `compute-credits`, `lab-access`, `legal-admin` (future).
- `format` — one of `in-person` | `remote` | `hybrid` | `live-in` | `relocation`.
  `live-in` / `relocation` express the old "residential" quality.
- `intakeMethod`, `intakeFrequency`, `costFundingModel` — optional canonical IDs from
  the same taxonomy (`rolling` / `cohort-application` / …; `equity` /
  `equity-free-grant` / `stipend` / `fee` / `free` / `mixed` / …). Fill when verifiable.

### Identity + display fields

```json
{
  "name": "Program Name",
  "type": "Hacker House / Coliving",
  "city": "San Francisco",
  "country": "USA",
  "lat": 37.8065,
  "lng": -122.429,
  "focus": "AI, hardware, robotics",
  "operator": "Who runs it",
  "stage": "Pre-seed / very early",
  "status": "rolling",
  "status_detail": "Recruiting status + key terms (equity, $, cohort length).",
  "domain": "example.com",
  "url": "https://example.com/apply",
  "highlight": "One memorable line about the program"
}
```

> **`type` is now a human-readable label, not the category.** It still renders in the
> UI, but it no longer decides anything. The category is `canonicalType`. Keep `type`
> short and descriptive (e.g. `"Hacker House / Coliving"`, `"Pre-seed Accelerator"`)
> and let `canonicalType` carry the machine meaning.

`status` must be one of (see `meta.status_legend` in the JSON):
`rolling`, `open`, `closing-soon`, `opening-soon`, `running`, `closed`.

### Provenance (required on every add or change)

Whenever you add a record or change a fact, supply provenance:

- `sourceUrls`: array of URLs used to verify this entry (≥1, primary source preferred).
- `lastVerified`: ISO date you confirmed it (e.g. `"2026-06-12"`).
- `verificationStatus`: `verified` | `needs-review` | `unverified`.

### Other optional founder fields (fill when verifiable — never guess)

They show as **"Unknown"** in the product until populated, so only add a field when a
**primary source** states it.

- `stageFit`: array from `pre-idea, idea, pre-product, mvp, pre-seed, seed, series-a-plus, repeat-founder, student, researcher`
- `founderFit`: array from `first-time-founder, solo-founder, technical-builder, domain-expert, repeat-founder, student-founder, researcher, international-founder, relocating-founder, fundraising-soon, needs-focus, needs-community, needs-customers, needs-capital`
- `sectorFocus`: array of sector tags (e.g. `["AI","climate"]`)
- `applicationDeadline`, `nextCohortStart`: ISO dates
- `durationWeeksMin`, `durationWeeksMax`: numbers; `cohortSize`: free text
- `fundingAmount`, `equityTaken`, `cost`: free text (e.g. `"$250K"`, `"7%"`)
- `providesHousing` / `providesWorkspace` / `providesFunding` / `providesMentorship` /
  `providesInvestorAccess` / `providesDemoDay` / `providesVisaSupport`: `true` | `false` | `null`
- `applyUrl`: direct application URL (distinct from `url`)
- `mvp`: `true` only for a curated, in-scope record (MVP `canonicalType` **and** MVP
  ecosystem — see `docs/mvp-data-scope.md`); `ecosystem`: one controlled string when `mvp`.
- `tags`, `notes`: optional free-form

Coordinates: `lat`/`lng` are decimal degrees for the program's city/building. Use a
known landmark or the operator's stated location; do not invent precise rooftop
coordinates. A city-center coordinate is fine — the UI jitters overlapping pins.

## Process

1. **Read `src/data/programs-data.json`** and build a mental index of existing `name` +
   `domain` values. This is your dedup key.
2. **Research.** Check program websites and social handles first; corroborate with the
   source list below and fresh web search. Prefer primary sources (the program's own
   site / X) over aggregators.
3. **Refresh existing entries.** For each program, re-verify `status` / `status_detail`
   (cohorts open/close often) and fix anything stale. Touch only fields that changed,
   and bump `lastVerified` when you re-confirm.
4. **Add clearly-verified new programs**, using the schema — `canonicalType` first.
   - Skip anything you cannot corroborate on the program's own site or two independent
     sources.
   - De-dupe: do not add a program whose `name` or `domain` already exists.
5. **Flag, don't guess.** Anything uncertain — unverifiable existence, ambiguous
   `canonicalType`, missing coordinates, suspected duplicate — goes in the **PR body as
   a checklist**, not silently into the data. (Precedent: "Threshold (UK)" was kept out
   / clearly labelled because it had no verifiable public presence.)
6. **Validate** the JSON parses and the schema is intact (see Validation).
7. **Open a draft PR** (see Output).

## Scope guardrails (important for unattended runs)

- **PR-gated, never direct to `master`.** Always open a *draft* PR.
- **Refresh + verified additions only.** Do not restructure the taxonomy, rename
  fields, remove programs in bulk, or add new `canonicalType` IDs. Those are
  interactive decisions — surface them in the PR body instead.
- **When in doubt, flag it.** A short PR with a few solid updates and a list of "needs
  human review" items is the success case. A large diff full of low-confidence
  additions is a failure.
- **Cite sources** for every new program and every status change, in the PR body.

## Validation

Before opening the PR:

```bash
# The dataset must be valid JSON
python3 -c "import json; json.load(open('src/data/programs-data.json'))"

# Spot-check: every program has the required keys (incl. canonical + provenance)
python3 - <<'PY'
import json
req = {"name","type","canonicalType","supportModes","url","city","country",
       "lat","lng","status","sourceUrls","lastVerified","verificationStatus"}
progs = json.load(open("src/data/programs-data.json"))["programs"]
bad = [p.get("name","?") for p in progs if not req <= set(p)]
print("src/data/programs-data.json", len(progs), "programs",
      "— missing required keys:", bad or "none")
PY
```

Optionally update `meta.compiled` (the date) when you change data.

## Output: the draft PR

Commit to the working branch and open a **draft** PR. Body template:

```
## Orbital data refresh — <date>

### Updated (<n>)
- <Program> — <what changed> — <source URL>

### Added (<n>)
- <Program> (<canonicalType>) — <source URL>

### Needs human review
- [ ] <uncertain item + why>

Dataset remains the source of truth; merging triggers a Vercel deploy.
```

Keep the PR focused; if a change is large or judgment-heavy, describe it in "Needs
human review" rather than committing it.

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
</content>
</invoke>
