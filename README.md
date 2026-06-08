# Founder LAB MAP

**LAB = Living And Building.** Where founders find all kinds of living and building support programs
worldwide — residencies, hacker houses, startup campuses, accelerators and incubators. Think of it
as a "PhD portal" for the startup/building space: search programs the way an aspiring student
searches universities, programs and countries. Built with **Astro + Tailwind + React islands**,
output as a static site and deployed on Vercel.

**Live site:** https://founder-atlas.vercel.app/

## Views

- **Dashboard** (`/dashboard`) — an agent-friendly, fully URL-navigable directory: a semantic,
  server-rendered sortable table of every program with schema.org JSON-LD. Drive every filter by
  query param and share the resulting URL as a deep link (see below).
- **Map** (`/`) — the landing page. A 2D Leaflet map. Dense regions (SF Bay Area, NYC, London,
  Bangalore) get a zoomed-in "off-coast" callout so they stay legible at world zoom; the callout's
  pins are hidden on the main map until you zoom in.
- **Globe** (`/startup-programs-globe`) — a 3D globe view of the same data.

## For agents (machine-readable surface)

- **`/api/programs.json`** — the canonical unified dataset: all programs in one array (each tagged
  with `dataset`), plus `meta`, `schema`, `count` and `facets` (distinct types/countries/statuses
  with counts). Served with permissive CORS so agents can fetch it cross-origin. **Generated at
  build time** by `src/pages/api/programs.json.ts` from the two source datasets — do not hand-edit.
- **`/llms.txt`** — a plain-text index describing the project, the schema, the status enum, the
  endpoints, and the dashboard query-param grammar (`src/pages/llms.txt.ts`).
- **Dashboard query params** (compose with AND):
  `?dataset=all|residential|traditional&q=<text>&type=<type>&country=<country>&status=<status>&focus=<text>&sort=<field>`.
  Example: `/dashboard?dataset=all&country=USA&status=open`.

## Project layout

- `src/data/*.json` — the two source datasets (single source of truth).
- `src/data/programs.ts` — merges them into a typed `Program[]` + `FACETS` (replaces the old `build-api.js`).
- `src/lib/` — shared `status`, `filter` (`passes`/sort) and `logo` helpers used by every view.
- `src/components/` — React components (`Logo`, `StatusBadge`, `ProgramCard`, `ProgramsTable`, `FilterSidebar`).
- `src/islands/` — `MapView` (Leaflet) and `GlobeView` (globe.gl), rendered `client:only`.
- `src/stores/filters.ts` — nanostore that shares filter state across islands and syncs it to the URL.
- `src/pages/` — `index.astro` (map), `startup-programs-globe.astro`, `dashboard.astro`, and the
  `api/programs.json.ts` + `llms.txt.ts` endpoints.

The `*-knowledge-base.md` files are the human-readable research notes behind the data.

## Updating the data

1. Edit `src/data/startup-programs-data.json` or `src/data/traditional-programs-data.json` (each
   entry needs `name`, `lat`, `lng`, `status`, etc. — copy an existing entry as a template).
2. Commit and push. Vercel rebuilds; the API, llms.txt, dashboard and maps all pick up the change
   automatically — no separate generation step.

To add a new off-coast cluster callout, add an entry to the `CLUSTERS` array in
`src/islands/MapView.tsx` (a region needs at least 3 programs to appear).

## Develop

Requires Node 20+ (see `.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm run preview  # serve the built site
npx astro check  # type-check
```
