# Record schema — one object per program

Each program is one object in the `programs` array. Copy `example-record.json` as
a template. All enum values come from `TAXONOMY.md`.

## Required keys (validator errors if any is missing/empty)

| key | type | notes |
| --- | --- | --- |
| `name` | string | Official program name. Also the dedup key — no duplicates. |
| `type` | string | Short human label, e.g. `"Hacker House / Coliving"`. Display only; `canonicalType` carries meaning. |
| `canonicalType` | string | `founder-residency` or `hacker-house` (see scope). |
| `supportModes` | string[] | What it provides; should include `housing`. |
| `url` | string | Canonical site or apply URL (a real program URL, not an aggregator/search link). |
| `city` | string | City, or `"Remote"` / `"Global"`. |
| `country` | string | e.g. `"USA"`, `"Finland"`. |
| `lat` | number | Decimal degrees (city-center is fine). |
| `lng` | number | Decimal degrees. |
| `status` | string | One of the `status` enum. |
| `sourceUrls` | string[] | ≥1 URL used to verify the record; primary source preferred. |
| `lastVerified` | string | ISO date, e.g. `"2026-07-01"`. |
| `verificationStatus` | string | `verified` \| `needs-review` \| `unverified`. |

## Strongly recommended — the founder-facing UI fields

The site's program card + detail drawer render these. **Collect them** (validator
warns, doesn't error, when they're all missing):

- `format` (string enum) — living model badge.
- `providesHousing` (bool) — the defining co-living signal; set it.
- `providesWorkspace` (bool).
- `stageFit` (string[]), `founderFit` (string[]), `sectorFocus` (string[] e.g. `["AI","climate"]`).
- `durationWeeksMin` / `durationWeeksMax` (numbers), `cohortSize` (string).
- `cost` (string, e.g. `"$1,800/mo"`), `fundingAmount` (string), `equityTaken` (string).

## Other optional keys

`operator` (string), `focus` (string), `stage` (string), `status_detail` (string),
`domain` (string, host only), `highlight` (string), `applyUrl` (string),
`intakeMethod` / `intakeFrequency` / `costFundingModel` (enums),
`providesFunding` / `providesMentorship` / `providesInvestorAccess` /
`providesDemoDay` / `providesVisaSupport` (bool),
`nextCohortStart` (ISO date), `tags` (string[]), `notes` (string).
For roving/relocation programs: `originCity`/`originCountry`/`originLat`/`originLng`.

## Do NOT use

- `applicationDeadline` — retired from the UI; volatile. Put timing in `status_detail`.
- Any `canonicalType` / enum value not listed in `TAXONOMY.md`.
- Invented facts, or an aggregator/`google.com/search?...` link as `url`.
