# Founder Atlas — Canonical Data Model

This document describes the canonical program schema: every field, its meaning, whether it
is **MVP-required** or **optional**, and whether it is a **legacy** or **canonical** field.
The schema lives in code at [`src/data/schema.ts`](../src/data/schema.ts); the `Program`
interface is in [`src/data/programs.ts`](../src/data/programs.ts). This doc explains both.

## Backward-compatibility contract

Stream 2 is **additive only**:

- No existing field on `Program` was deleted or renamed.
- All new canonical fields are **optional** on `Program`, so the site still builds
  (`astro build` passes) and all existing data still renders.
- Canonical values are **derived, never written over** the legacy free-text fields. `type`,
  `stage`, and `format` remain the rendered/display values.
- No JSON data records were migrated or modified.

## Field kinds

- **legacy** — pre-existing field (free-text or core), kept working forever.
- **legacy-optional** — pre-existing optional founder-schema field.
- **canonical** — new in Stream 2; always optional on `Program`.

## Requirement levels

- **mvp-required** — an MVP-ready *curated* record (Stream 3) should carry this field. This
  is a **data-quality contract**, not a TypeScript constraint: the type keeps every
  canonical field optional. Stream 3 / Stream 7 enforce it per record.
- **optional** — nice to have; absence renders as "Unknown".

### MVP-required fields

`name`, `type`, `url`, `dataset`, `country`, `stage`, `status`, `sourceUrls`,
`lastVerified`, `verificationStatus`, `canonicalType`, `supportModes`.

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
| Identity | `name`, `type` (legacy free-text), `url`, `domain`, `operator`, `dataset` |
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
| `canonicalType` | enum | `programType` taxonomy | Canonical program type derived from legacy `type`. |
| `supportModes` | enum[] | `supportMode` taxonomy | What the program concretely provides. |
| `intakeMethod` | enum | `intakeMethod` taxonomy | How founders get in. |
| `intakeFrequency` | enum | `intakeFrequency` taxonomy | How often intake happens. |
| `costFundingModel` | enum | `costFundingModel` taxonomy | The equity / money axis. |
| `mvp` | boolean | — | Curated, launch-ready MVP record (set by Stream 3). |
| `ecosystem` | string | — | MVP ecosystem tag (set by Stream 3). |

## Normalization (legacy → canonical)

[`src/lib/normalizeProgram.ts`](../src/lib/normalizeProgram.ts) exposes pure,
non-destructive helpers:

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
fallback, so new/edited records still map without code changes. Across the current 123
records there are **0 type warnings and 0 stage warnings**.

See [`program-taxonomy.md`](./program-taxonomy.md) for the taxonomy dimensions and MVP-vs-
future category breakdown.
