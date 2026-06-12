# Public API, static exports & agent surfaces (Stream 9)

Founder Atlas is a **static Astro site (no server adapter)**: every endpoint below is
pre-rendered to a static file at build time and served from `dist/`. CORS
(`Access-Control-Allow-Origin: *`) and content-type headers for `*.json` / `llms.txt` are
applied by `vercel.json` on deploy. No backend, no auth, no scraping required — agents,
users and tools consume structured data directly.

All endpoints are **additive**. The two legacy contracts are **stable** (byte-for-byte
unchanged); the new exports are richer and may evolve.

## Surfaces at a glance

| Surface | Path | Stability | Purpose |
| --- | --- | --- | --- |
| Unified programs | `/api/programs.json` | **Stable contract** | All programs, legacy shape (`meta`/`schema`/`count`/`facets`/`programs`). |
| Countries | `/api/countries.json` | **Stable contract** | Country ecosystem profiles. |
| `llms.txt` | `/llms.txt` | Owned by Stream 9 | Agent guide: MVP scope, freshness/provenance, directory of surfaces. |
| Normalized programs | `/api/programs.normalized.json` | Additive (may evolve) | Every program + canonical taxonomy + status/freshness/provenance. |
| Curated MVP programs | `/api/programs.mvp.json` | Additive (may evolve) | Only `mvp:true` curated, launch-ready records. |
| Program-type taxonomy | `/api/program-types.json` | Additive (may evolve) | Full canonical taxonomy with labels + MVP flags. |
| Founder-needs schema | `/api/founder-needs-schema.json` | Additive (may evolve) | `FounderNeedsProfile` field map for the matching engine. |
| Update report | `/api/update-report.json` | Additive (may evolve) | Offline freshness / source / MVP-readiness summary. |
| Program JSON Schema | `/schemas/program.schema.json` | Additive | JSON Schema (Draft 2020-12) for a program record. |
| Founder-needs JSON Schema | `/schemas/founder-needs.schema.json` | Additive | JSON Schema for `FounderNeedsProfile`. |
| Update-report JSON Schema | `/schemas/program-update.schema.json` | Additive | JSON Schema for the update report. |

## Stability guarantees

- **`/api/programs.json` and `/api/countries.json` are a stable public contract.** Their
  output shape will not change. New fields/records go to new endpoints, never into these.
  `tests/exports.test.ts` asserts their top-level shape so an accidental change breaks CI.
- **New exports are additive and may evolve.** They add fields over time; consumers should
  ignore unknown fields and treat absent optional fields as "no constraint / not provided".

## Endpoint details

### `/api/programs.normalized.json`
Per record: `slug`, identity (`name`, `dataset`, `url`, `country`, `city`, `region`,
`ecosystem`), the legacy `legacyType`, canonical `canonicalType` / `canonicalStages` /
`supportModes` / `costFundingModel` (derived non-destructively via
`src/lib/normalizeProgram.ts`), a window-aware `applicationStatus`
(`open|upcoming|closed|unknown` + `source` + legacy status + windows), a `freshness` block
(`lastVerified`, `ageDays`, `isStale`, `verificationStatus`), and a `provenance` block
(`bestTrust`, `realSourceCount`, `sampleOnly`, `sources`). `mvp` flags curated records.
Application-status and freshness/provenance use the Stream 4 helpers keyed by program slug.

### `/api/programs.mvp.json`
The same per-record shape, filtered to `mvp:true` records only — the curated, launch-ready
slice clearly distinguished from the full dataset. `count` is the curated count; `totalPrograms`
is the full dataset size. May be empty until Stream 3 tags records; an empty list is not an error.

### `/api/program-types.json`
The full canonical taxonomy from `src/data/taxonomy.ts`: `programTypes` at the top level plus a
`taxonomy` object covering every dimension (programType, supportMode, founderStage, intakeMethod,
intakeFrequency, costFundingModel), each with `count`, `mvpCount` and `values`
(`id`, `label`, `mvp`, `description`).

### `/api/founder-needs-schema.json`
A documented field map of `FounderNeedsProfile` (Stream 5). Every field is optional; enum fields
reference canonical taxonomy IDs. The formal JSON Schema is `/schemas/founder-needs.schema.json`.

### `/api/update-report.json`
Wraps Stream 7's `generateUpdateReport({ network: false })` — computed **offline** at build time
(`networkChecked: false`), report-only. URL-health counts are 0 / not-meaningful in the build
export; run `npm run report:update -- --check` locally for live probing.

## Regenerating / verifying

```sh
npm run build   # emits all endpoints under dist/ (incl. dist/api/*.json, dist/schemas/*.json)
npm test        # asserts new exports are well-formed and legacy shapes are intact
```
