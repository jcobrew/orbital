# Application Windows, Deadlines & Provenance (Stream 4)

> **Thesis:** *A program existing is not the same as applications being open.*
> This stream separates **stable program identity** (the `Program` record) from
> **changing application data** (when a founder can actually apply) and from
> **provenance** (who says so, and how much we trust it).

It is **fully additive and backward-compatible**. The `Program` type
(`src/data/programs.ts`) and the legacy recruiting-status model
(`src/lib/status.ts`) are **not** modified. Windows and sources are linked to
programs **externally**, keyed by program slug (`programSlug(name)`).

## Modules

| File | Contents |
| --- | --- |
| `src/data/applicationWindows.ts` | `ApplicationWindow`, `ProgramWindows`, `PROGRAM_WINDOWS` lookup (by slug), `windowsForSlug()`, sample windows. |
| `src/data/sources.ts` | `SourceRecord`, `SourceKind`, `TrustStatus`, `ProgramProvenance`, `PROGRAM_SOURCES` lookup (by slug), `provenanceForSlug()`, sample sources. Re-exports the existing `VerificationStatus`. |
| `src/lib/applicationStatus.ts` | Additive derivation helpers (no rewrite of `status.ts`). |
| `src/components/StatusBadge.tsx` | Existing `StatusBadge` (unchanged) + new `ApplicationStatusBadge` / `StaleBadge` exports. |
| `src/pages/programs/[slug].astro` | Additive rendering of window + provenance + stale badges. |

## Models

### `ApplicationWindow`
- `rolling?: boolean` — always-open intake (ignores `opens`/`closes`).
- `opens?` / `closes?` — ISO `YYYY-MM-DD` dates.
- `cohortLabel?`, `applyUrl?`, `notes?`.

### `SourceRecord`
- `url`, `title`, `publisher?`, `retrievedAt?` (ISO date).
- `kind: 'official' | 'official-social' | 'press' | 'aggregator' | 'community' | 'sample'`.
- `trust: TrustStatus` (`'trusted' | 'reported' | 'unverified' | 'sample'`).

`TrustStatus` describes how much we trust a **source**; the existing
`VerificationStatus` (`verified | needs-review | unverified`, reused from
`programs.ts`) describes whether a **record** was reviewed. They are
complementary, not duplicates.

## Application status (`open / upcoming / closed / unknown`)

`statusForWindow(window, now)`:
- `rolling` → **open**
- past `closes` → **closed**
- future `opens` → **upcoming**
- otherwise (within window, or open with no close) → **open**
- no usable dates → **unknown**

`statusFromWindows(programWindows, now)` reduces multiple windows by priority
**open > upcoming > closed > unknown** (most "act now" first).

## Precedence rule (windows vs legacy `status`)

`resolveApplicationStatus({ legacyStatus, windows }, now)`:

1. **Window wins.** If an `ApplicationWindow` exists, its computed status is
   authoritative for the founder-facing *application* status. Windows are
   time-aware and more specific. (`source: 'window'`)
2. **Legacy fallback.** With no window, the legacy free-text `status` is mapped
   to an application status (`rolling/open/closing-soon → open`,
   `opening-soon → upcoming`, `closed → closed`, `running`/unknown → `unknown`).
   The legacy `status` field is **read, never written** — it keeps rendering
   exactly as today everywhere it is already used. (`source: 'legacy'`)
3. **Unknown.** If neither is confident, status is `unknown` — shown honestly,
   never hidden. (`source: 'none'`)

The program page shows the existing legacy status badge **always**, and adds the
derived `ApplicationStatusBadge` **only when window data exists**, so
legacy-only programs are visually unchanged.

## Freshness / stale data

`computeStale(lastVerified, now, staleAfterDays = 90)` → `{ isStale, ageDays, unknown }`.
- No/invalid `lastVerified` → `unknown: true`.
- `ageDays > staleAfterDays` → `isStale: true`.

Rendered as a muted `StaleBadge` on the header and Sources section.

## Trust summary

`summarizeTrust(provenance)` → `{ best, realSourceCount, sampleOnly }`, picking
the strongest trust level (`trusted > reported > unverified > sample`) and
flagging records whose only sources are placeholders.

## How exports / UI should consume this

- **UI:** look up `windowsForSlug(slug)` and `provenanceForSlug(slug)`; call
  `resolveApplicationStatus` and `computeStale`; render badges additively.
- **Exports (Stream 9):** join by slug and emit derived application status,
  resolved-from source, window list, stale flag, and trust summary alongside the
  existing fields. Never overwrite the legacy `status` value.
- **Sample data is clearly marked** (`kind: 'sample'`, `trust: 'sample'`, and
  "(sample)" in labels/notes) and must be replaced with cited data before
  launch.

## Tests

`tests/applicationStatus.test.ts` covers open/upcoming/closed/unknown
computation (including boundaries), multi-window reduction, legacy mapping,
precedence, staleness, and trust summary.
