# Founder Atlas — Program Taxonomy

This document describes the **canonical taxonomy** for founder-support programs and which
parts are **in MVP scope** vs. **future**. The taxonomy lives in code at
[`src/data/taxonomy.ts`](../src/data/taxonomy.ts) and is the single source of truth; this
doc explains it.

> **Why a canonical taxonomy?** The legacy `type` field on `Program` is free-text (~67
> distinct strings across the two datasets). Free-text cannot reliably mark a record as
> "MVP" vs "future" or drive deterministic matching. The canonical taxonomy gives stable
> machine IDs while the free-text fields keep rendering exactly as before.

## How it relates to the existing data

- The taxonomy is **additive and non-destructive**. Legacy fields (`type`, `stage`,
  `format`, …) are untouched and remain the rendered/display values.
- Canonical IDs are **derived** from the legacy text by
  [`src/lib/normalizeProgram.ts`](../src/lib/normalizeProgram.ts), or set explicitly on the
  optional canonical fields added to `Program` (`canonicalType`, `supportModes`,
  `intakeMethod`, `intakeFrequency`, `costFundingModel`).
- Every taxonomy entry is `{ id, label, mvp, description? }`. `mvp: true` marks values in
  scope for the MVP; everything else is representable but `mvp: false`.

## Dimensions

### 1. `programType` — full landscape taxonomy

The MVP actively populates **8 categories** (`mvp: true`). The rest are representable so the
schema is future-ready, but are not populated for launch.

**MVP categories (mvp: true):**

| ID | Label |
| --- | --- |
| `founder-residency` | Founder residency (live-in / relocation cohort) |
| `hacker-house` | Hacker / founder house (coliving, builder density) |
| `accelerator` | Accelerator (cohort + cheque + demo day) |
| `pre-accelerator` | Pre-accelerator (idea/pre-product prep) |
| `founder-fellowship` | Founder fellowship (back the person, pre-idea) |
| `government-grant` | Government grant / non-dilutive |
| `startup-visa` | Startup visa / soft-landing |
| `cofounder-matching` | Co-founder matching / online founder community |

**Future categories (mvp: false):** `incubator`, `startup-studio`, `corporate-accelerator`,
`university-program`, `tech-transfer`, `deep-tech-program`, `startup-campus`, `venture-debt`,
`pop-up-village`, `ecosystem-support`, `other` (fallback for unmappable legacy types).

### 2. `supportMode` — what a program concretely provides

`funding`, `housing`, `workspace`, `mentorship`, `investor-access`, `demo-day`,
`visa-support`, `community`, `co-founder-matching`, `structure` (MVP); `customers`,
`compute-credits`, `lab-access`, `legal-admin` (future). These mirror the existing
`providesX` booleans on `Program` plus a few that matter for matching.

### 3. `founderStage` — aligned with the existing `StageFit` union

IDs are kept identical to `StageFit` (`pre-idea`, `idea`, `pre-product`, `mvp`, `pre-seed`,
`seed`, `series-a-plus`, `repeat-founder`, `student`, `researcher`, `unknown`) so the two
interoperate. `series-a-plus` and `researcher` are `mvp: false`.

### 4. `intakeMethod` — how you get in

`rolling`, `cohort-application`, `open-call`, `invitation`, `unknown` (MVP); `membership`
(future).

### 5. `intakeFrequency` — how often intake happens

`rolling`, `annual`, `biannual`, `quarterly`, `ad-hoc`, `unknown` (all MVP).

### 6. `costFundingModel` — the equity / money axis

`equity`, `equity-free-grant`, `stipend`, `fee`, `free`, `mixed`, `unknown` (MVP);
`venture-debt` (future).

## Helpers exported from `taxonomy.ts`

- `isMvpProgramType(id)` — is a program-type ID one of the 8 MVP categories?
- `isProgramTypeId(id)` — is it any known canonical program type?
- `PROGRAM_TYPE_IDS`, `MVP_PROGRAM_TYPE_IDS` — all vs MVP-only ID arrays.
- `labelFor(dimension, id)` — human label lookup with raw-id fallback.
- `TAXONOMY` — all dimensions keyed by name, for generic tooling / export generation.

## Legacy → canonical mapping

The mapping rules (exact lookup table + keyword heuristics) live in
[`src/lib/normalizeProgram.ts`](../src/lib/normalizeProgram.ts). Across the current 123
records, **all 123 legacy `type` values and all 123 `stage` values map without warnings**;
the normalizer emits a non-fatal warning (never throws) for any value it cannot confidently
map, defaulting `canonicalType` to `other`.

See [`data-model.md`](./data-model.md) for the full field-level schema and the
MVP-required vs optional contract.
