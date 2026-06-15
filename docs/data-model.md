# Orbital — Canonical Data Model

This document describes the canonical program schema: every field, its meaning, whether it
is **MVP-required** or **optional**, and whether it is a **legacy** or **canonical** field.
The schema lives in code at [`src/data/schema.ts`](../src/data/schema.ts); the `Program`
interface is in [`src/data/programs.ts`](../src/data/programs.ts). This doc explains both.

## One unified dataset

All programs live in **one** file, `src/data/programs-data.json`. The old `residential`
vs `traditional` two-dataset split is retired: a program is categorized by its
**`canonicalType`**, not by which file it lives in. The legacy `dataset` value survives
only as a **derived back-compat field** exposed by the legacy `/api/programs.json` shim —
it is not a real categorization axis and should never be hand-authored.

## Field roles

- The canonical fields (`canonicalType`, `supportModes`, `format`, `mvp`, `ecosystem`,
  and the optional intake/cost IDs) carry the **machine meaning** and drive
  filtering/matching and MVP scope.
- The legacy free-text fields (`type`, `stage`) remain as **human-readable display
  values** only. `type` is a label, not a category.
- Provenance (`sourceUrls`, `lastVerified`, `verificationStatus`) is required on curated
  records.

## Field kinds

- **legacy** — pre-existing field (free-text or core), kept working as a display value.
- **legacy-optional** — pre-existing optional founder-schema field.
- **canonical** — the machine-meaning fields (`canonicalType`, `supportModes`, …) that
  drive categorization, filtering, matching, and MVP scope.

## Requirement levels

- **mvp-required** — an MVP-ready *curated* record (Stream 3) should carry this field. This
  is a **data-quality contract**, not a TypeScript constraint: the type keeps every
  canonical field optional. Stream 3 / Stream 7 enforce it per record.
- **optional** — nice to have; absence renders as "Unknown".

### MVP-required fields

`name`, `type` (display label), `url`, `country`, `stage`, `status`, `sourceUrls`,
`lastVerified`, `verificationStatus`, `canonicalType`, `supportModes`.

(`dataset` is **not** a required field — it is a derived back-compat value only.)

(Mirrors the plan's "Required MVP program fields": name · type · URL · country/remote · stage
focus · support modes · application status · source URL · last verified date · verification
status. `city`, `applyUrl`, deadline/intake, cost/equity, eligibility are conditionally
required when applicable but typed optional.)

## Field reference

See `PROGRAM_SCHEMA` in [`src/data/schema.ts`](../src/data/schema.ts) for the authoritative,
machine-readable list (suitable to drive `public/schemas/program.schema.json` generation in
Stream 9). Summary of the groups:

| Group | Fields |
| --- | --- |
| Identity | `name`, `type` (legacy free-text **label**), `url`, `domain`, `operator`, `dataset` (derived back-compat only) |
| Location | `country`, `city`, `lat`, `lng`, `region` |
| Legacy descriptors | `focus`, `stage` (legacy free-text), `highlight`, `subtype`, `format`, `sectorFocus`, `stageFit`, `founderFit` |
| Application / cohort | `status`, `status_detail`, `applyUrl`, `applicationDeadline`, `nextCohortStart`, `durationWeeksMin/Max`, `cohortSize` |
| Cost / funding | `fundingAmount`, `equityTaken`, `cost` |
| `provides*` booleans | housing, workspace, funding, mentorship, investorAccess, demoDay, visaSupport |
| Provenance | `sourceUrls`, `lastVerified`, `verificationStatus`, `tags`, `notes` |
| **Canonical (Stream 2)** | `canonicalType`, `supportModes`, `intakeMethod`, `intakeFrequency`, `costFundingModel` |
| **MVP scope markers** | `mvp` (boolean), `ecosystem` (string) |

## Canonical fields (Stream 2)

| Field | Type | Constrained by | Meaning |
| --- | --- | --- | --- |
| `canonicalType` | enum | `programType` taxonomy | The program's canonical category (the primary classifier); set explicitly on curated records, derived from legacy `type` as a fallback. |
| `supportModes` | enum[] | `supportMode` taxonomy | What the program concretely provides. |
| `intakeMethod` | enum | `intakeMethod` taxonomy | How founders get in. |
| `intakeFrequency` | enum | `intakeFrequency` taxonomy | How often intake happens. |
| `costFundingModel` | enum | `costFundingModel` taxonomy | The equity / money axis. |
| `mvp` | boolean | — | Curated, launch-ready MVP record (set by Stream 3). |
| `ecosystem` | string | — | MVP ecosystem tag (set by Stream 3). |

## Normalization (legacy → canonical fallback)

Curated records carry `canonicalType` directly. For records that still have only a legacy
free-text `type`, [`src/lib/normalizeProgram.ts`](../src/lib/normalizeProgram.ts) exposes
pure helpers that **derive** the canonical values as a fallback:

```ts
normalizeProgram(program) => {
  canonicalType: ProgramTypeId,          // 'other' when unmappable
  canonicalStages: FounderStageId[],
  canonicalSupportModes: SupportModeId[],
  canonicalCostFundingModel?: CostFundingModelId,
  warnings: string[],                    // never thrown — emitted for unmapped values
}
```

It uses an exact lookup table for the known legacy strings plus keyword heuristics as a
fallback, so records that lack an explicit `canonicalType` still map without code changes.
Across the full record set there are **0 type warnings and 0 stage warnings**.

See [`program-taxonomy.md`](./program-taxonomy.md) for the taxonomy dimensions and MVP-vs-
future category breakdown.

## Country ecosystem profiles

Separate from the program schema, each **country profile** (one level up from individual
programs — "what is it like to build here") lives in
[`src/data/countries-data.json`](../src/data/countries-data.json) and is typed by
`CountryRecord` in [`src/data/countries.ts`](../src/data/countries.ts).

Orbital deliberately does **not** re-collect every ecosystem detail. Instead of the old
`visas[]` / `organizations[]` / `links[]` / `directories[]` arrays (now removed), each
country points OUT to at most **two** optional categorized links, both shaped as
`CountryGuideLink` (`{ label, url, description? }`):

| Field | Type | Meaning |
| --- | --- | --- |
| `slug` | string | URL-safe id, also the `/country/<slug>` route |
| `name` | string | Display name; MUST match the program datasets' `country` value so counts join |
| `region` | string | Coarse world region |
| `lat` / `lng` | number | Approximate centroid for map centering |
| `summary` | string | 1–2 sentence ecosystem overview |
| `highlights` | string[] | Short bullet facts (strengths, hubs, notable wins) |
| `business` | `CountryGuideLink?` | The national business/ecosystem portal that links out to the wider ecosystem |
| `relocation` | `CountryGuideLink?` | The official "how to move / get in" immigration site |
| `updatedAt` | string | ISO date the record was last verified |
| `source` | string | Where the record was curated from (free text) |

Either of `business` / `relocation` may be omitted when no canonical source exists — the UI
shows a graceful "Local guides coming soon." placeholder. Program counts are joined at build
time (`programCount`, `programsByDataset`) and are not stored in the JSON.
