# Orbital — Repo Architecture & MVP Boundaries Map

> **Stream 1 deliverable.** Navigation reference for future agents — a map, not a spec. Verified
> against the actual source files on 2026-06-11. Do not edit source/schema/data without first reading
> the ownership rules in [§8 — Implementation boundaries](#8-suggested-implementation-boundaries).

---

## 1. Architecture Summary

| Dimension | Detail |
|---|---|
| **Framework** | Astro 5.18 (`astro ^5.18.2`), no server adapter → pure static output (`dist/`) |
| **React islands** | `@astrojs/react` 4.4.2 + React 19; islands use `client:load` or `client:only="react"` |
| **Styling** | Tailwind v4 (`tailwindcss ^4.3.0`) via `@tailwindcss/vite`; theme tokens in `src/styles/global.css` (`@theme {}` block + `:root` CSS vars); fonts: Space Grotesk / Inter / JetBrains Mono from Google Fonts |
| **State** | `nanostores` + `@nanostores/react`; shared cross-island filter state in `src/stores/filters.ts` |
| **Build system** | Vite (embedded in Astro), no custom Rollup config; `npm run build` → `astro build` |
| **Package manager** | npm (lockfile present, no workspaces) |
| **Deployment** | Vercel, fully static; `vercel.json` adds `cleanUrls: true` + CORS/content-type headers for `*.json` and `/llms.txt` |
| **Routing model** | File-based static routing; dynamic pages use `getStaticPaths()` + build-time data joins; no SSR, no edge functions |
| **TypeScript** | Strict (`astro/tsconfigs/strict`); path alias `@/*` → `src/*`; `jsxImportSource: react` |
| **Animation** | `motion ^12.40.0` (used in intro/boot overlays); `globe.gl ^2.46.1` (Three.js); `leaflet ^1.9.4` (2D map) |
| **No backend** | No DB, no auth, no server functions, no API proxies |

---

## 2. Key-File Map

### Pages (`src/pages/`)

| File | URL | Purpose |
|---|---|---|
| `src/pages/index.astro` | `/` | Globe entry (desktop); redirects mobile to `/explore` |
| `src/pages/explore.astro` | `/explore` | Filterable card list with `FounderTriggers` + `FilterSidebar` + `ExploreResults` |
| `src/pages/dashboard.astro` | `/dashboard` | Sortable table view; agent-friendly; schema.org `ItemList` JSON-LD |
| `src/pages/map.astro` | `/map` | 2D Leaflet map (`MapView` island, `client:only`) |
| `src/pages/about.astro` | `/about` | Program-type explainer; `ProgramTypeExplainer` + `FounderTriggers` |
| `src/pages/countries.astro` | `/countries` | Grid of country ecosystem cards; schema.org `ItemList` JSON-LD |
| `src/pages/submit.astro` | `/submit` | Submission form (`SubmitForm` island); no backend |
| `src/pages/saved.astro` | `/saved` | Locally stored shortlist (`SavedList` island) |
| `src/pages/country/[slug].astro` | `/country/<slug>` | Per-country profile; `getStaticPaths()` from `COUNTRIES`; schema.org `Country` JSON-LD |
| `src/pages/cities/[slug].astro` | `/cities/<slug>` | Per-city programs; `getStaticPaths()` from `CITIES` (derived from program data) |
| `src/pages/programs/[slug].astro` | `/programs/<slug>` | Per-program detail; `getStaticPaths()` from `PROGRAMS`; schema.org `EducationalOccupationalProgram` JSON-LD |

### Machine surfaces (`src/pages/`)

| File | URL | Purpose |
|---|---|---|
| `src/pages/api/programs.json.ts` | `/api/programs.json` | Full program catalog as JSON; includes `meta`, `schema`, `count`, `facets`, `programs[]` |
| `src/pages/api/countries.json.ts` | `/api/countries.json` | Country ecosystem profiles; `meta`, `count`, `countries[]` |
| `src/pages/llms.txt.ts` | `/llms.txt` | LLM/agent discovery guide: API pointers, schema docs, dashboard URL params, surface index |

### Data layer (`src/data/`)

| File | Purpose |
|---|---|
| `src/data/programs.ts` | Loads the unified dataset → `PROGRAMS[]`; exports `Program` interface, `ProgramFormat`/`StageFit`/`FounderFit`/`VerificationStatus` enums, `FACETS`, `TYPES`, `COUNTRIES`, `API_SCHEMA`, `STATUS_LEGEND`, `programSlug()` |
| `src/data/programs-data.json` | The single unified program dataset (123 programs across all `canonicalType`s — residencies, hacker houses, accelerators, fellowships, grants, visas, communities). Categorized by `canonicalType`, not by file. |
| `src/data/taxonomy.ts` | Canonical taxonomy: `programType` (`canonicalType`) + support-mode / founder-stage / intake / cost dimensions, with MVP flags |
| `src/data/countries.ts` | `CountryRecord`/`Country` interfaces; merges `countries-data.json` with program counts → `COUNTRIES[]`, `getCountry()`, `countrySlug()`, `hasCountryProfile()` |
| `src/data/countries-data.json` | 6 country ecosystem profiles (slug, name, region, summary, visas, organizations, links) |
| `src/data/cities.ts` | Derives city groupings from `PROGRAMS` → `CITIES[]`, `getCity()`, `citySlug()` (no separate JSON source) |
| `src/data/programTypes.ts` | `PROGRAM_TYPES[]` — editorial type explainers used on `/about` and intro overlay |
| `src/data/triggers.ts` | `TRIGGERS[]` — 7 founder-intent presets mapping to `Filters` objects (e.g. "I need funding" → `{ q: 'accelerator' }`) |
| `src/data/world-110m.geo.json` | GeoJSON world topology for the Globe.gl / Leaflet layers |

### Library (`src/lib/`)

| File | Purpose |
|---|---|
| `src/lib/filter.ts` | `Filters` interface, `EMPTY_FILTERS`, `passes()` predicate, `sortPrograms()`, `defaultSort()` |
| `src/lib/status.ts` | `StatusKey` type, `STATUS` map, `STATUS_ORDER`, `statusMeta()`, `shortStatusLabel()` |
| `src/lib/living.ts` | `LIVING_MODELS` map (labels/blurbs for each `ProgramFormat`), `livingModelLabel()`, `LIVING_MODEL_ORDER` |
| `src/lib/display.ts` | `displayVal()`, `displayBool()`, `displayDuration()`, `whatYouGet()`, `PROVIDES[]` — shared "show Unknown on missing data" formatting |
| `src/lib/submit.ts` | `SubmitFields`, `buildIssueBody()`, `buildIssueUrl()` — composes a prefilled GitHub issue URL |
| `src/lib/logo.ts` | `initials()`, `logoSources()`, `logoMarkupHTML()`, `installLogoFallback()` — favicon/logo helpers for cards + map markers |
| `src/lib/useTypewriter.ts` | React hook for typewriter text effect (used in `BootSequence`) |

### Stores (`src/stores/`)

| File | Purpose |
|---|---|
| `src/stores/filters.ts` | `$filters` nanostore; `filtersFromURL()`, `filtersToQuery()`, `initFiltersFromURL()`, `setFilters()`, `applyPreset()` — URL↔store sync |

### Components (`src/components/`)

| File | Purpose |
|---|---|
| `FilterSidebar.tsx` | React island: all filter controls (text search, Program Type / `canonicalType` filter, type-label/country/status dropdowns, format/stage/sector/housing filters); syncs with `$filters` store and URL. (The old residential/traditional dataset toggle is replaced by the Program Type filter.) |
| `ExploreResults.tsx` | React island: filtered card grid for `/explore`; subscribes to `$filters` |
| `ProgramsTable.tsx` | React island: sortable table for `/dashboard`; subscribes to `$filters` |
| `ProgramCard.tsx` | Shared card component; used by `ExploreResults` + `SavedList`; exports `applyHref()` helper |
| `ProgramDetailDrawer.tsx` | Slide-in detail panel (from the card list) |
| `FounderTriggers.tsx` | 7 preset buttons that call `applyPreset()` on the filters store |
| `StatusBadge.tsx` | Color-coded recruiting-status chip (uses `statusMeta()`) |
| `LivingModelBadge.tsx` | Living-model chip (uses `livingModelLabel()`) |
| `SubmitForm.tsx` | React island: program submission/update form; calls `buildIssueUrl()` to open GitHub |
| `SaveButton.tsx` | Bookmark toggle backed by `localStorage` |
| `SavedList.tsx` | React island: renders saved programs (keys from `localStorage`) |
| `SiteNav.tsx` | Shared navigation header (Globe / List / Countries / About) |
| `ProgramTypeExplainer.astro` | Astro component: editorial type explainer cards from `PROGRAM_TYPES` |
| `IntroOverlay.tsx` | First-visit intro modal (auto-opens once on `/` and `/explore`) |
| `BootSequence.tsx` | Typewriter boot animation component |
| `Logo.tsx` | React favicon/logo component with self-hosted `/logos` → DuckDuckGo → Google → initials fallback chain (logos collected by `scripts/fetch-logos.ts`) |

### Islands (`src/islands/`)

| File | Purpose |
|---|---|
| `src/islands/GlobeView.tsx` | `client:only` React island: Globe.gl 3D globe; includes program markers, city minimap overlays, status legend panel |
| `src/islands/MapView.tsx` | `client:only` React island: Leaflet 2D map |

### Layout + styles

| File | Purpose |
|---|---|
| `src/layouts/Base.astro` | Single shared HTML shell; imports `global.css`; mounts `IntroOverlay`; accepts `fullscreen` prop |
| `src/styles/global.css` | Tailwind v4 entry + `@theme {}` design tokens + `:root` CSS vars; fonts declared here |

---

## 3. Current Data Model

### `Program` interface (`src/data/programs.ts`)

**Core fields** (always present in the JSON, rendered everywhere):

```
name, type (display label), canonicalType, supportModes, city, country, lat, lng,
focus, operator, stage, status, status_detail, domain, url, highlight?
```

(`dataset` is no longer a stored core field; it is a derived back-compat value exposed only by the legacy `/api/programs.json` shim. `canonicalType` is the category.)

**Founder schema fields** (all optional; `undefined`/`null` or absent until verified and filled):

```
subtype, region, format (ProgramFormat), stageFit (StageFit[]),
founderFit (FounderFit[]), sectorFocus (string[]),
applicationDeadline, nextCohortStart,
durationWeeksMin, durationWeeksMax, cohortSize,
fundingAmount, equityTaken, cost,
providesHousing, providesWorkspace, providesFunding,
providesMentorship, providesInvestorAccess, providesDemoDay, providesVisaSupport,
applyUrl, sourceUrls (string[]), lastVerified, verificationStatus (VerificationStatus),
tags (string[]), notes
```

### Enums

| Enum | Values |
|---|---|
| `ProgramFormat` | `in-person`, `remote`, `hybrid`, `live-in`, `relocation`, `unknown` |
| `StageFit` | `pre-idea`, `idea`, `pre-product`, `mvp`, `pre-seed`, `seed`, `series-a-plus`, `repeat-founder`, `student`, `researcher`, `unknown` |
| `FounderFit` | `first-time-founder`, `solo-founder`, `technical-builder`, `domain-expert`, `repeat-founder`, `student-founder`, `researcher`, `international-founder`, `relocating-founder`, `fundraising-soon`, `needs-focus`, `needs-community`, `needs-customers`, `needs-capital` |
| `VerificationStatus` | `verified`, `needs-review`, `unverified` |
| `StatusKey` (in `src/lib/status.ts`) | `rolling`, `open`, `closing-soon`, `opening-soon`, `running`, `closed` |

### Dataset load

`src/data/programs.ts` loads the single `src/data/programs-data.json` into `PROGRAMS[]`. There is no build script — it is an import-time ES module load. All pages and API endpoints import `PROGRAMS` directly from this file.

```
programs-data.json → 123 records → PROGRAMS[]
```

The old `residential` vs `traditional` two-file split is retired. A program is categorized by its **`canonicalType`** (from `src/data/taxonomy.ts`), not by which file it lives in. A `dataset` value survives only as a derived back-compat field in the legacy `/api/programs.json` shim.

### `canonicalType` is the category; `type` is a label

Categorization is driven by **`canonicalType`** — a canonical machine ID from `src/data/taxonomy.ts` (the 8 MVP types plus future ones). The legacy `type` field is free-text (many near-duplicate strings like `"Hacker House"`, `"Hacker House / Residency"`, `"Accelerator"`, `"AI Accelerator"`) and is now a **human-readable label only** — it no longer drives MVP scope or typed filtering. Where a record lacks an explicit `canonicalType`, `src/lib/normalizeProgram.ts` derives one from the legacy `type` as a fallback (defaulting to `other`).

---

## 4. Route Map

### Human pages

| URL | Template | Slug source |
|---|---|---|
| `/` | `src/pages/index.astro` | — |
| `/explore` | `src/pages/explore.astro` | — |
| `/dashboard` | `src/pages/dashboard.astro` | — |
| `/map` | `src/pages/map.astro` | — |
| `/about` | `src/pages/about.astro` | — |
| `/countries` | `src/pages/countries.astro` | — |
| `/submit` | `src/pages/submit.astro` | — |
| `/saved` | `src/pages/saved.astro` | — |
| `/country/<slug>` | `src/pages/country/[slug].astro` | `src/data/countries.ts` → `COUNTRIES[].slug` (from `countries-data.json`) |
| `/cities/<slug>` | `src/pages/cities/[slug].astro` | `src/data/cities.ts` → `CITIES[].slug` (derived from program `city` names) |
| `/programs/<slug>` | `src/pages/programs/[slug].astro` | `programSlug(program.name)` → lowercase, non-alphanumerics → hyphens |

### Machine surfaces

| URL | File | Shape |
|---|---|---|
| `/api/programs.json` | `src/pages/api/programs.json.ts` | `{ meta, schema, count, facets: { dataset, type, country, status }, programs[] }` |
| `/api/countries.json` | `src/pages/api/countries.json.ts` | `{ meta, count, countries[] }` |
| `/llms.txt` | `src/pages/llms.txt.ts` | Plain text: LLM/agent discovery guide, schema docs, URL param reference |

All machine surfaces are pre-rendered to static files at build time. CORS is applied in `vercel.json`, not at runtime.

### URL query-param filter contract

Both `/explore` and `/dashboard` accept the same query params (parsed by `filtersFromURL()` in `src/stores/filters.ts`). All params are optional and compose with AND:

| Param | Values | Description |
|---|---|---|
| `canonicalType` | any `programType` ID | Filter by canonical Program Type (e.g. `accelerator`, `hacker-house`); replaces the old `dataset` toggle |
| `q` | free text | Substring match over `name + city + country + focus + operator + type` |
| `type` | exact string | Exact match against the free-text `type` **label** (display value, see §3 caveat) |
| `country` | exact string | Exact match against `program.country` |
| `status` | `rolling` \| `open` \| `closing-soon` \| `opening-soon` \| `running` \| `closed` | Exact match |
| `focus` | free text | Substring match within `program.focus` |
| `format` | `in-person` \| `remote` \| `hybrid` \| `live-in` \| `relocation` | Match `program.format` |
| `stage` | any `StageFit` value | Checks membership in `program.stageFit[]` |
| `sector` | free text | Case-insensitive membership in `program.sectorFocus[]` |
| `housing` | `yes` \| `no` | Match `program.providesHousing === true/false` |
| `sort` | any `keyof Program` | Sort column (dashboard only; `status` uses `STATUS_ORDER`, others lexicographic) |

Filter state is reflected back to the URL via `history.replaceState`, making every filter state a shareable deep link.

---

## 5. Current Filter / Search Behavior

### `passes()` predicate (`src/lib/filter.ts`)

All conditions are AND-composed. An empty/default filter value is a no-op:

1. **Text search (`q`):** case-insensitive substring against concatenated `name + city + country + focus + operator + type`
2. **Program Type:** exact equality to `program.canonicalType` (canonical category; replaces the old dataset match)
3. **Type label:** exact equality to the free-text `type` label (display value — see §3)
4. **Country:** exact equality to `program.country`
5. **Status:** exact equality to `program.status`
6. **Focus:** case-insensitive substring within `program.focus`
7. **Format:** exact equality to `program.format`
8. **Stage:** membership in `program.stageFit[]`
9. **Sector:** case-insensitive membership in `program.sectorFocus[]`
10. **Housing:** `program.providesHousing === true` (yes) or `=== false` (no)

Filters 7–10 no-op on most records today because those optional fields are largely unfilled. The `FilterSidebar` hides filter controls that have no available values in the current dataset slice, preventing dead dropdowns.

### `sortPrograms()` (`src/lib/filter.ts`)

Default sort: `status` ascending using `STATUS_ORDER` (`running` → `open` → `closing-soon` → `opening-soon` → `rolling` → `closed`), then name as tiebreaker. All other fields sort lexicographically. Used as `defaultSort()` on country/city pages and in URL-driven sorts.

### `TRIGGERS` presets (`src/data/triggers.ts`)

7 founder-intent buttons. Each maps to a `Partial<Filters>` that replaces the current filter state (via `applyPreset()`). Current presets:

| Label | Filter preset |
|---|---|
| I need funding | `{ q: 'accelerator' }` |
| I need a place to live & build | `{ format: 'live-in' }` |
| I need deep focus | `{ q: 'residency' }` |
| I need a cofounder or community | `{ q: 'hacker house' }` |
| I need to go from idea to MVP | `{ q: 'incubator' }` |
| I'm very early (pre-idea) | `{ q: 'fellowship' }` |
| I need to move to a startup hub | `{ format: 'relocation' }` |

These are keyword presets, not scored matches. Stream 5 will replace the matching engine; Stream 2 + the `triggers.ts` ownership note says to evolve presets alongside structured matching while keeping them working.

### Cross-island state (`src/stores/filters.ts`)

`$filters` (nanostore atom) is the single shared filter state. `FilterSidebar`, `ExploreResults`, and `ProgramsTable` all subscribe via `useStore($filters)`. `initFiltersFromURL()` is idempotent (guarded by an `initialized` flag) — safe to call from multiple islands. `setFilters()` merges a partial update and pushes the new query string with `history.replaceState`.

---

## 6. Submission Flow

```
User on /submit
  → renders src/pages/submit.astro
      → mounts <SubmitForm client:load />   (src/components/SubmitForm.tsx)
          → on submit: calls buildIssueUrl(fields)  (src/lib/submit.ts)
              → builds https://github.com/jcobrew/founder-atlas/issues/new
                  ?title=[New program] <name>
                  &body=<prefilled markdown>
                  &labels=program-submission | data-update
          → window.open() → opens the prefilled GitHub issue for the user to review and submit
```

**No backend.** The form composes and opens a GitHub issue URL in the user's browser. The maintainer reviews the issue and, if valid, runs the `founder-atlas-refresh` skill to create a draft PR updating the data JSON files.

`buildIssueBody()` includes: program name, type, website URL, apply URL, city, country, living model, stage fit, sector, application status, deadline, funding, equity, housing, duration, source URL. Sensitive note at the bottom: "Submitted via the Orbital /submit form. Please verify against primary sources before merging."

**Program update flow:** on program detail pages (`/programs/<slug>`), a "Report update" link pre-fills `/submit?program=<name>&mode=update`, setting `mode: 'update'` which prepends `[Update]` to the issue title and changes the label to `data-update`.

---

## 7. Risk List & "Do-Not-Break" Stable Surfaces

### Do-not-break (stable surfaces)

These are depended upon by external consumers (agents, tools, crawlers, bookmarks) and must not change shape:

| Surface | What must not change |
|---|---|
| `GET /api/programs.json` | Top-level keys: `meta`, `schema`, `count`, `facets`, `programs`; all `Program` core fields in each record; `facets.{dataset, type, country, status}` structure (the `dataset` facet stays for legacy back-compat, populated from the derived value) |
| `GET /api/countries.json` | Top-level keys: `meta`, `count`, `countries`; `CountryRecord` shape + `programCount` |
| `GET /llms.txt` | Plain text at `/llms.txt`; URL param documentation section; the API endpoint references |
| `/dashboard` URL params | All 10 filter params + `sort` must keep working; deep links must stay valid |
| `/explore` URL params | Same as dashboard minus `sort` |
| `/programs/<slug>` routing | Slug algorithm (`programSlug()`) must not change; existing slugs must not break |
| `/country/<slug>` routing | Country slugs from `countries-data.json` must not change |
| `PROGRAMS[]` export from `src/data/programs.ts` | Shape and record ordering; all pages import this (the legacy `dataset` value is derived for back-compat only) |
| Globe, map, list, program pages | Visual rendering; no functional regressions |

### Risk list

| Risk | Where | Mitigation |
|---|---|---|
| Filtering relies on `canonicalType`, not free-text `type` | `src/data/programs.ts`, `src/data/programs-data.json` | Keep `canonicalType` populated; `type` is a display label and can vary freely |
| Slug collision if two programs produce the same `programSlug()` | `programSlug()` in `programs.ts` | Never change the slug algorithm; check for collisions before adding records |
| `PROGRAMS[]` order change breaks facet counts or display ordering | `src/data/programs-data.json` | Append new records only; do not reorder the existing array |
| Editing `src/lib/filter.ts` breaks all filter surfaces simultaneously | `passes()`, `sortPrograms()` | Prefer additive modules; do not modify `passes()` without testing all views |
| Adding required fields to `Program` breaks build for records that lack them | `src/data/programs.ts` | All new fields must be optional (`?`); Stream 2 owns the only additive schema edits |
| Island state desync if `initFiltersFromURL()` runs before `window` exists | `src/stores/filters.ts` | Keep the guard; do not SSR the filters store |
| Tailwind v4 `@theme` conflicts if a new stream adds a second CSS entry | `src/styles/global.css` | Single CSS entry; extend tokens additively in the same file |
| `vercel.json` CORS rules missed for new API endpoints | `vercel.json` | Stream 9 must add new routes to the `vercel.json` headers block |

---

## 8. Suggested Implementation Boundaries

These boundaries follow the file-ownership rules in `docs/mvp-implementation-plan.md` §9. They are designed to minimize merge conflicts across parallel streams.

### Safe to ADD new files to (without touching existing files)

| Location | Safe for |
|---|---|
| `src/data/taxonomy.ts` (new) | Stream 2 — canonical type/support-mode/stage/intake IDs |
| `src/data/schema.ts` (new) | Stream 2 — extended schema types |
| `src/lib/normalizeProgram.ts` (new) | Stream 2 — legacy→canonical mapping |
| `src/lib/matching/` (new dir) | Stream 5 — `FounderNeedsProfile`, `ProgramMatch`, scorer |
| `src/data/applicationWindows.ts` (new) | Stream 4 — `ApplicationWindow` model |
| `src/data/sources.ts` (new) | Stream 4 — `SourceRecord`, `TrustStatus` |
| `src/pages/find-support.astro` (new) | Stream 6 — guided discovery page |
| `src/components/find-support/` (new dir) | Stream 6 — intake question components |
| `src/pages/api/programs.normalized.json.ts` (new) | Stream 9 — normalized export |
| `src/pages/api/programs.mvp.json.ts` (new) | Stream 9 — MVP-curated export |
| `src/pages/api/program-types.json.ts` (new) | Stream 9 — canonical type catalog |
| `src/pages/api/founder-needs-schema.json.ts` (new) | Stream 9 — founder needs schema |
| `src/pages/api/update-report.json.ts` (new) | Stream 9 — freshness report |
| `public/schemas/` (new dir) | Stream 9 — JSON Schema files |
| `scripts/` (new dir) | Stream 7 — freshness/readiness/URL-check scripts |
| `data/review-queue/` (new dir) | Stream 8 — pending/approved/rejected proposals |
| `docs/` | Stream 1 owns this; Stream 10 can add further docs |
| `tests/` (new dir) | Stream 10 |
| `examples/` (new dir) | Stream 10 |
| `.github/workflows/` (new dir) | Stream 10 |
| `vitest.config.ts` (new) | Stream 10 |

### Modify with care (shared, edit-additively only)

| File | Owned by | Rule for others |
|---|---|---|
| `src/data/programs.ts` | **Stream 2** | Others import only; never destructively change existing exports |
| `src/data/programs-data.json` | **Stream 3** | The single unified dataset; others read only; content edits require the `founder-atlas-refresh` skill draft-PR flow |
| `src/stores/filters.ts` | Stream 5 / Stream 6 can extend | Keep existing filter keys; add new ones additively |
| `src/lib/filter.ts` | Stream 5 | Keep `passes()` / `sortPrograms()` / `defaultSort()` signatures stable |
| `src/data/triggers.ts` | Stream 5 | Evolve presets alongside matching; keep existing presets working |
| `src/lib/status.ts` | Stream 4 | Add helpers; do not rename `StatusKey` values |
| `src/pages/llms.txt.ts` | **Stream 9** | Only Stream 9 makes content changes |
| `package.json` | All (append-only `scripts`) | Streams 7 + 10 coordinate; never remove existing scripts |
| `vercel.json` | Stream 9 | Add new route patterns to `headers`; do not change existing patterns |

### Do NOT modify

| File | Reason |
|---|---|
| `src/pages/api/programs.json.ts` | Stable external API; Stream 9 adds new endpoints alongside it |
| `src/pages/api/countries.json.ts` | Stable external API |
| `src/layouts/Base.astro` | Shared HTML shell; changes affect every page |
| `src/styles/global.css` | Global design tokens; changes affect entire visual surface |
| Existing islands: `GlobeView.tsx`, `MapView.tsx` | Do not modify; Stream 6 adds new components |
| Existing UI components: `ProgramCard.tsx`, `StatusBadge.tsx`, etc. | Stream 6 imports read-only; do not edit |
| `astro.config.mjs`, `tsconfig.json` | Build config; changes require cross-stream sign-off |

### Dependency order reminder

```
Stream 1 (this doc, done) → Stream 2 (taxonomy/schema) → then parallel:
  Stream 3 (data scope, needs S2 canonical type IDs)
  Stream 4 (windows/provenance, needs S2 schema basics)
  Stream 5 (matching engine, can mock S2/S4)
  Stream 7 (freshness scripts, parallel with S2)
Stream 5 → Stream 6 (discovery UI, can start on mocked output)
Stream 9 (exports, follows S2 normalized schema)
Stream 8 (review queue, needs S2 schema basics)
Stream 10 (tests/docs, starts early, tracks all)
```

---

*Generated by Stream 1 agent on 2026-06-11. Update this doc when architecture changes materially — but keep it a navigation map, not a spec.*
