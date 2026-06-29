# 0rbital

**Find your orbit. Launch what’s next.** 0rbital (pronounced Orbital) helps early-stage builders, founders, researchers, hackers, and creative technologists compare the places where people live, work, and build around serious peers.

The right environment changes your trajectory. Compare founder residencies, hacker houses, startup campuses, and co-living programs where builders gather momentum for their next launch. 0rbital is **not** a generic accelerator, grant, visa, or builder-environment database; it stays focused on builder environments.

**Repository:** https://github.com/jcobrew/orbital

## Views

Every page shares one header (`SiteNav`): **0rbital · a Globe / List view toggle · Countries · Saved · About**. The toggle carries active filter state across views; **About** opens the intro overlay (also a full page at `/about`).

- **Globe** (`/`) — the homepage: a 3D globe of every program. Small screens include an “enter the orbit” CTA into the full programs list.
- **Explore** (`/explore`) — the main discovery surface for builder environments: search + filters, a card list, and a program detail drawer with practical tradeoffs.
- **Find your orbit** (`/find-your-orbit`, compatible route: `/find-support`) — guided matching for stage, goals, location preferences, and constraints. Results are possible orbits, not definitive recommendations.
- **Saved** (`/saved`) — your shortlist. Save programs, compare tradeoffs, and track where you might apply next.
- **Submit** (`/submit`) — add a builder environment for review through a prefilled GitHub issue in `jcobrew/orbital`.
- **Countries** (`/countries`, `/country/<slug>`) — country ecosystem profiles for founders considering relocation.
- **Dashboard** (`/dashboard`) — data quality dashboard and agent/power-user surface: a server-rendered, URL-navigable sortable table with schema.org JSON-LD.

## For agents (machine-readable surface)

- **`/api/programs.json`** — stable unified dataset: all programs in one array, plus `meta`, `schema`, `count`, and `facets`.
- **`/api/countries.json`** — country ecosystem profiles, each with a `programCount` joined from the program data.
- **`/llms.txt`** — a plain-text index describing 0rbital, the schema, endpoints, and dashboard query-param grammar.
- **Dashboard / `/explore` query params**: `?q=<text>&model=<co-living|co-working|both>&country=<country>&status=<status>&sort=<field>&dir=-1`.

## Project layout

- `src/data/programs-data.json` — single source-of-truth program dataset.
- `src/data/taxonomy.ts` — canonical taxonomy (`canonicalType` + support-mode / stage / intake dimensions).
- `src/data/programs.ts` — loads the dataset into typed `Program[]` + `FACETS`.
- `src/data/countries-data.json` — country ecosystem profiles.
- `src/lib/` — shared status, filtering, matching, submit, and display helpers.
- `src/components/` — React + Astro components, including guided matching under `src/components/find-support/`.
- `src/islands/` — map and globe React islands.
- `src/pages/` — routes, API endpoints, and `llms.txt`.

Legacy `*-knowledge-base.md` research notes are preserved as historical landscape notes. The canonical product direction is 0rbital for builder environments.

## Updating the data

1. Edit `src/data/programs-data.json` (each entry needs `canonicalType`, `supportModes`, `name`, `lat`, `lng`, `status`, provenance, etc.; copy an existing entry as a template).
2. Commit and push. Vercel rebuilds; the API, llms.txt, dashboard, and maps all pick up the change automatically.

## Develop

Requires Node 20+ (see `.nvmrc` if present).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to dist/
npm test         # vitest
npx astro check  # type-check
```
