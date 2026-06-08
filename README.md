# Founder Atlas

A living, interactive map of founder programs worldwide — residencies, hacker houses, startup
campuses, accelerators and incubators. Built as static files (HTML + JSON), deployed on Vercel.

**Live site:** https://founder-atlas.vercel.app/

## Views

- **Map** (`index.html`) — the landing page (served at `/`). A 2D Leaflet map. Dense regions
  (SF Bay Area, NYC, London, Bangalore) get a zoomed-in "off-coast" callout so they stay legible at
  world zoom; the callout's pins are hidden on the main map until you zoom in.
- **Globe** (`startup-programs-globe.html`) — a 3D globe view of the same data.

## Data

Two JSON files are the single source of truth — both views fetch them at runtime:

- `startup-programs-data.json` — residential programs (residencies, hacker houses, co-living, campuses)
- `traditional-programs-data.json` — traditional accelerators, incubators, talent investors

The `*-knowledge-base.md` files are the human-readable research notes behind the data.

## Updating

1. Edit the JSON file(s) to add/change programs (each entry needs `name`, `lat`, `lng`, `status`,
   etc. — copy an existing entry as a template).
2. Commit and push. Vercel auto-deploys the new version.

To add a new off-coast cluster callout, add an entry to the `CLUSTERS` array in
`index.html` (a region needs at least 3 programs in the active dataset to appear).

## Local preview

The pages fetch JSON, so they must be served over HTTP (not opened as `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```
