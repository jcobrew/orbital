# Update Pipeline — Freshness & Reporting (Stream 7)

A set of **report-only**, **safe-by-default** scripts that surface data-quality and
freshness gaps in the Founder Atlas program datasets. They are deliberately
*read-only*: nothing here ever edits the JSON data, opens a PR, or publishes
anything. Network access is **opt-in**. Every script always exits `0` so it can
run in CI without ever failing a build.

> Design principle (from the MVP plan): *maintainability without pretending
> automation is solved.* These scripts produce reports a human (or the
> `founder-atlas-refresh` skill) acts on — they never auto-apply changes.

## Scripts

| Script | npm script | What it reports | Network |
| --- | --- | --- | --- |
| `scripts/check-program-freshness.ts` | `npm run freshness` | Stale records (by `lastVerified` age) + records missing a verification date | none |
| `scripts/check-source-urls.ts` | `npm run check:urls` | Inventory of `sourceUrls`; optional reachability probe | **opt-in** (`--check`) |
| `scripts/check-mvp-readiness.ts` | `npm run check:mvp` | Per-record MVP-readiness vs the required-field spec + MVP scope-cap warnings | none |
| `scripts/generate-update-report.ts` | `npm run report:update` | Aggregates all three into one report (text or JSON) | opt-in (`--check`) |

All scripts run via [`tsx`](https://github.com/privatenumber/tsx) (added as a
devDependency) and import `PROGRAMS` directly from `src/data/programs.ts`, so the
report always reflects the live typed dataset.

## Common flags

- `--json` — machine-readable output (the `report:update` JSON shape is what
  Stream 9's `/api/update-report.json` export can serve).
- `--days=N` — staleness threshold for freshness (default **180**).
- `--mvp-only` — restrict readiness to records tagged `mvp: true`.
- `--check` / `--network` — **opt-in** URL probing (off by default; offline-safe).
- `--timeout=MS` — per-request timeout when probing URLs (default 8000).
- `--out=FILE` — (`report:update` only) write the report to a file instead of stdout.

## Examples

```bash
# Offline freshness report (default 180-day threshold)
npm run freshness

# Tighter staleness window
npm run freshness -- --days=90

# Source-URL inventory only (no network)
npm run check:urls
# Opt in to probing URLs over the network
npm run check:urls -- --check

# MVP-readiness over the whole dataset / only tagged records
npm run check:mvp
npm run check:mvp -- --mvp-only

# Full aggregate report, offline, human-readable
npm run report:update
# Machine-readable, with network URL checks, written to a file
npm run report:update -- --check --json --out=update-report.json
```

## What each report flags

- **Freshness:** `stale` (verified longer ago than the threshold), `missing-date`
  (no `lastVerified`), `invalid-date` (unparseable).
- **Source URLs:** programs with no `sourceUrls`; and — with `--check` —
  `ok` / `broken` / `unreachable` per URL. Offline or DNS failures degrade to
  `unreachable`, never an error.
- **MVP-readiness:** records missing any MVP-required field
  (`name`, `type`, `url`, `country`-or-remote, `stage`, `status`, `sourceUrls`,
  `lastVerified`, `verificationStatus`, derivable `canonicalType`/`supportModes`);
  plus scope-cap warnings (100–200 records, 3–5 ecosystems, 6–8 types). These
  criteria track Stream 3's `docs/program-data-quality.md`.

## Safety posture

- **No mutations.** Scripts only read `PROGRAMS`; they never write to the JSON
  datasets. (`report:update --out` writes only the report file you name.)
- **Offline-safe.** No network unless you pass `--check`; any network failure is
  caught and reported as `unreachable`/`skipped`.
- **Never fails a build.** Every script exits `0` regardless of findings.

## Future (not implemented here)

A scheduled GitHub Action / cron could run `npm run report:update -- --check --json`
and post the report (or open an issue) — but **applying** any change stays manual
via the review-queue (Stream 8) and `founder-atlas-refresh` draft-PR flow. No
auto-scrape, no auto-publish.
