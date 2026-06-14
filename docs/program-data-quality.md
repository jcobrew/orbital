# Orbital — Program Data Quality Standard

This document is the **data-quality contract** for MVP program records: the required-vs-optional
field checklist, the quality standards every record must meet, and the **per-record
MVP-readiness criteria**. The readiness criteria here are the precise specification that
Stream 7's `scripts/check-mvp-readiness.ts` implements — this document defines the checks; it
does **not** include the script.

It is the companion to [`mvp-data-scope.md`](./mvp-data-scope.md) (which records are in scope)
and builds on [`data-model.md`](./data-model.md) (the full field schema) and the
`founder-atlas-refresh` skill (the editing/verification workflow).

> **Principle.** Smaller dataset, higher trust. Every MVP record must be *verifiable* (cites a
> source), *fresh* (carries a last-verified date), and *honest* (shows "unknown" rather than
> guessing). A record may exist without applications being open — never conflate the two.

---

## 1. Scope of this standard

This standard applies to records tagged **`mvp: true`** (see
[`mvp-data-scope.md`](./mvp-data-scope.md)). Untagged (future / out-of-scope) records still
render and are welcome in the datasets, but are **not** held to the MVP-readiness bar and are
**not** counted toward launch-readiness.

All fields below already exist on the `Program` interface in
[`src/data/programs.ts`](../src/data/programs.ts); this standard says **which** are required for
an MVP record and **how** they must be filled. It adds no new fields.

---

## 2. Required vs optional MVP fields

### 2.1 Always-required (every record, MVP or not — existing dataset invariant)

These are the base keys the dataset and the `founder-atlas-refresh` skill already require:

`name` · `canonicalType` · `supportModes` · `type` (display label) · `city` · `country` ·
`lat` · `lng` · `status` · `url`

### 2.2 Required for an MVP-ready record

In addition to §2.1, a record tagged `mvp: true` is **MVP-ready** only when it carries the
following. This is the field checklist from the implementation plan, mapped to concrete keys:

| Requirement | Field(s) on `Program` | Rule |
| --- | --- | --- |
| **Name** | `name` | Non-empty. |
| **Program Type** | `canonicalType` → must be an **MVP canonical type** | `canonicalType` is one of the 8 MVP IDs (set explicitly, or derived from the legacy `type` label as a fallback). |
| **URL** | `url` | Non-empty, looks like an absolute `http(s)://` URL. |
| **Location / remote** | `country` + (`city` **or** `format`) | Physical programs need a `city`; fully remote/online programs may omit `city` but must declare `format: "remote"`. |
| **Stage focus** | `stageFit` (preferred) **or** non-empty `stage` text | At least one stage signal so matching can reason about fit. |
| **Support modes** | `supportModes` (preferred) **or** any `providesX` boolean set, **or** a type that implies modes | At least one concrete support signal present or derivable via the normalizer. |
| **Application status** | `status` (must be a legal enum value) | One of `rolling, open, closing-soon, opening-soon, running, closed`. "Unknown" is acceptable only as an explicit absence — see §3.3. |
| **Source URL** | `sourceUrls` | Non-empty array; at least one absolute URL used to verify the record. |
| **Last verified date** | `lastVerified` | Present, ISO `YYYY-MM-DD`, and not implausibly old (see §4 freshness). |
| **Eligibility notes (if applicable)** | `notes` / `founderFit` | Required only when the program has material eligibility constraints (e.g. women-only, students-only, nationality/visa, sector-restricted). When such a constraint exists and is unstated, the record is **not** ready. |
| **In MVP scope** | `mvp` + `ecosystem` | `mvp === true` and `ecosystem` is one of the 5 controlled values. |

### 2.3 Optional (fill when verifiable — never guess)

`highlight` · `subtype` · `region` · `applyUrl` · `applicationDeadline` · `nextCohortStart` ·
`durationWeeksMin` / `durationWeeksMax` · `cohortSize` · `fundingAmount` · `equityTaken` ·
`cost` · `sectorFocus` · `tags` · the optional canonical fields (`intakeMethod`,
`intakeFrequency`, `costFundingModel`) · `verificationStatus`. (`canonicalType` and
`supportModes` are **required** — see §2.1 — not optional.)

Also optional / explicitly out of MVP standard: acceptance rate, notable alumni, discovery
channels, long ecosystem analysis, full sector taxonomy, historical cohorts, deep alumni
metadata. (Plan §3: smaller dataset, higher trust.)

---

## 3. Data-quality standards

### 3.1 Verifiability

- Every MVP record must cite at least one **primary source** in `sourceUrls` (the program's own
  site or official X/social). Aggregators may corroborate but should not be the sole source.
- Never invent values. If a field cannot be confirmed from a source, leave it absent (the UI and
  API render it as "Unknown").

### 3.2 Honesty about unknowns

- Absence is honest; a guess is not. Optional fields are left out when unverified.
- A program **existing** is not the same as **applications being open**. `status` describes
  recruiting state; do not set it to `open` to make a record look active.

### 3.3 "Unknown" application status

The plan requires "application status **or** 'unknown'". The dataset `status` enum has no
literal `unknown`. The convention:

- Use the closest legal enum value when known (`rolling`, `open`, `closing-soon`,
  `opening-soon`, `running`, `closed`).
- When recruiting state is genuinely unknown, prefer `closed` **with** a `status_detail` noting
  uncertainty, or leave application-window detail absent and rely on `status_detail`. The
  readiness check treats a present, legal `status` as satisfying the requirement; it never
  fabricates an open window.

### 3.4 Consistency & shape

- The dataset file (`src/data/programs-data.json`) must stay **valid JSON** and keep a consistent
  record shape and order. Tagging is **additive** (`mvp`, `ecosystem`).
- `country` strings must match the controlled country→ecosystem map in
  [`mvp-data-scope.md`](./mvp-data-scope.md) for an MVP record to be taggable.
- `lat`/`lng` are decimal degrees for the program's city/building; city-center is acceptable.
- `ecosystem`, when present, must be exactly one of:
  `finland-nordics`, `estonia`, `europe-wide`, `uk`, `us-global-remote`.

### 3.5 Correct `canonicalType`

Every program lives in the one unified `src/data/programs-data.json` and must carry a correct
**`canonicalType`** (per the `founder-atlas-refresh` skill). Live-in / relocation programs are
`founder-residency` (or `hacker-house`) with `format: "live-in"` + `housing` in `supportModes` —
there is no separate residential file. A wrong or missing `canonicalType` is a quality defect
even if all other fields are present. (`type` is a display label only and does not need to match
any controlled vocabulary.)

---

## 4. Freshness standard

- `lastVerified` must be an ISO date.
- A record is **fresh** if verified within **180 days**; **aging** between 180 and 365 days;
  **stale** if older than **365 days** or missing `lastVerified`.
- An MVP-ready record must be **fresh or aging** (not stale). Stale MVP records should be
  re-verified or flagged, never silently presented as current.
- Records with imminent or past `applicationDeadline` / `nextCohortStart` relative to "today"
  should be re-checked; a past deadline with `status: open` is a freshness contradiction.

---

## 5. Per-record MVP-readiness criteria (spec for `check-mvp-readiness.ts`)

This is the precise specification Stream 7's `scripts/check-mvp-readiness.ts` must implement.
The script is **report-only** (never edits data, never fails a build by default) and should run
each record through the normalizer (`normalizeProgram`) to derive canonical fields.

For each record, evaluate the following. **Scope** checks decide whether the record is even an
MVP record; **readiness** checks decide whether an MVP record is launch-ready; **advisory**
checks are warnings that do not by themselves fail readiness.

### 5.1 Scope checks (is this an MVP record?)

| ID | Check | Pass condition |
| --- | --- | --- |
| `SCOPE_MVP_FLAG` | MVP-tagged | `mvp === true`. |
| `SCOPE_ECOSYSTEM` | Valid ecosystem | `ecosystem` ∈ {`finland-nordics`, `estonia`, `europe-wide`, `uk`, `us-global-remote`}. |
| `SCOPE_TYPE` | MVP canonical type | `canonicalProgramType(type)` is matched **and** `isMvpProgramType(id)` is true. |
| `SCOPE_REGION_MATCH` | Country ⇒ ecosystem | The record's `country` maps to the tagged `ecosystem` per the §2 map (consistency guard). |

A record failing any scope check is reported as **out of MVP scope** (not an error if it is
simply untagged; an error only if it is `mvp: true` but inconsistent — e.g. tagged but a
non-MVP type, or a bad/empty `ecosystem`).

### 5.2 Readiness checks (is this MVP record launch-ready?)

Applied to records that pass §5.1. **All must pass** for the record to be `ready`.

| ID | Check | Pass condition |
| --- | --- | --- |
| `REQ_NAME` | Name present | non-empty `name`. |
| `REQ_URL` | URL present & well-formed | non-empty `url` matching `^https?://`. |
| `REQ_LOCATION` | Location resolvable | `country` non-empty **and** (`city` non-empty **or** `format === 'remote'`). |
| `REQ_STAGE` | Stage focus present | `stageFit` non-empty **or** `stage` text non-empty. |
| `REQ_SUPPORT_MODES` | Support modes resolvable | `supportModes` non-empty, **or** any `providesX === true`, **or** `normalizeProgram` derives ≥1 support mode. |
| `REQ_STATUS` | Application status legal | `status` ∈ the 6-value enum. |
| `REQ_SOURCE` | Source cited | `sourceUrls` is a non-empty array with ≥1 `^https?://` entry. |
| `REQ_VERIFIED_DATE` | Last-verified present & valid | `lastVerified` is a valid ISO `YYYY-MM-DD`. |
| `REQ_FRESH` | Not stale | `lastVerified` within 365 days of run date. |
| `REQ_ELIGIBILITY` | Eligibility noted when applicable | If the record signals a material constraint (women-only / students-only / nationality / sector-locked, detectable from `type`/`focus`/`founderFit`/`tags`), then `notes` or `founderFit` documents it. Otherwise auto-pass. |

### 5.3 Advisory checks (warnings, do not block readiness)

| ID | Check |
| --- | --- |
| `ADV_AGING` | `lastVerified` between 180 and 365 days old. |
| `ADV_VERIFICATION_STATUS` | `verificationStatus` is absent or not `verified`. |
| `ADV_DEADLINE_PAST` | `applicationDeadline` / `nextCohortStart` is in the past relative to run date. |
| `ADV_STATUS_CONTRADICTION` | `status: open` with a past `applicationDeadline`. |
| `ADV_NORMALIZER_WARNINGS` | `normalizeProgram` emitted any warnings for this record. |

### 5.4 Scope-cap checks (dataset-level, enforce MVP caps)

Run once over the whole tagged set, not per record:

| ID | Check | Condition |
| --- | --- | --- |
| `CAP_RECORD_COUNT` | Total `mvp: true` records within the curated band | warn if `< 100`, error if `> 200`. |
| `CAP_ECOSYSTEM_COUNT` | Distinct `ecosystem` values | within 3–5. |
| `CAP_TYPE_COUNT` | Distinct MVP canonical types in tagged set | within 6–8 (8 allowed). |

### 5.5 Report shape (suggested)

The script should emit, per record: `name`, `mvp`/`ecosystem`, canonical type, `ready` (bool),
the list of failed `REQ_*` / inconsistent `SCOPE_*` IDs, and any `ADV_*` warnings — plus a
dataset-level summary (total tagged, ready count, per-ecosystem and per-type breakdown, and any
`CAP_*` violations). It must exit 0 by default (report-only); a `--strict` flag may exit non-zero
on readiness failures for opt-in CI use.

---

## 6. Current state (informational)

At the time of tagging, **67 of 123** records are `mvp: true`. Of those, only the **7** records
that already carry `sourceUrls` + `lastVerified` would pass `REQ_SOURCE` + `REQ_VERIFIED_DATE`
today; the remainder are **in scope but not yet launch-ready** and need verification passes via
the `founder-atlas-refresh` skill before launch. Closing that gap — adding sources and verified
dates to the tagged records, and adding the missing `startup-visa` / `government-grant` records
and European depth — is the data work between now and the first MVP milestone (see
[`mvp-data-scope.md`](./mvp-data-scope.md) §5).
