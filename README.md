# Founder LAB MAP

**LAB = Living And Building.** Where founders find all kinds of living and building support programs
worldwide — residencies, hacker houses, startup campuses, accelerators and incubators. Think of it
as a "PhD portal" for the startup/building space: search programs the way an aspiring student
searches universities, programs and countries. Built as static files (HTML + JSON), deployed on Vercel.

**Live site:** _(add your Vercel URL here once deployed)_

## Views

- **Dashboard** (`dashboard.html`, served at `/dashboard`) — an agent-friendly, fully
  URL-navigable directory: a semantic, sortable table of every program with schema.org JSON-LD.
  Drive every filter by query param and share the resulting URL as a deep link (see below).
- **Map** (`index.html`) — the landing page (served at `/`). A 2D Leaflet map. Dense regions
  (SF Bay Area, NYC, London, Bangalore) get a zoomed-in "off-coast" callout so they stay legible at
  world zoom; the callout's pins are hidden on the main map until you zoom in.
- **Globe** (`startup-programs-globe.html`) — a 3D globe view of the same data.

## For agents (machine-readable surface)

- **`/api/programs.json`** — the canonical unified dataset: all programs in one array (each tagged
  with `dataset`), plus `meta`, `schema`, `count` and `facets` (distinct types/countries/statuses
  with counts). Served with permissive CORS so agents can fetch it cross-origin. **Generated** by
  `build-api.js` from the two source files — do not hand-edit.
- **`/llms.txt`** — a plain-text index describing the project, the schema, the status enum, the
  endpoints, and the dashboard query-param grammar.
- **Dashboard query params** (compose with AND):
  `?dataset=all|residential|traditional&q=<text>&type=<type>&country=<country>&status=<status>&focus=<text>&sort=<field>`.
  Example: `/dashboard?dataset=all&country=USA&status=open`.

## Data

Two JSON files are the single source of truth — both views fetch them at runtime:

- `startup-programs-data.json` — residential programs (residencies, hacker houses, co-living, campuses)
- `traditional-programs-data.json` — traditional accelerators, incubators, talent investors

The `*-knowledge-base.md` files are the human-readable research notes behind the data.

## Updating

1. Edit the JSON file(s) to add/change programs (each entry needs `name`, `lat`, `lng`, `status`,
   etc. — copy an existing entry as a template).
2. Regenerate the agent API: `node build-api.js` (rewrites `api/programs.json`).
3. Commit and push. Vercel auto-deploys the new version.

To add a new off-coast cluster callout, add an entry to the `CLUSTERS` array in
`index.html` (a region needs at least 3 programs in the active dataset to appear).

## Local preview

The pages fetch JSON, so they must be served over HTTP (not opened as `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```
