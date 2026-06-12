import type { APIRoute } from 'astro';
import { generateUpdateReport } from '../../../scripts/generate-update-report';

// Stream 9 — Update report export (ADDITIVE).
//
// Served from Stream 7's `generateUpdateReport()` generator, OFFLINE
// (`network:false`) so the build never makes network calls. The report is
// report-only — it summarizes freshness, source-URL inventory and MVP-readiness
// across the dataset and never modifies data. The `brokenOrUnreachableUrls`
// headline is computed only when network checking is on; here it is an offline
// inventory, so consumers should treat URL-health counts as 0 / not-checked.
//
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = async () => {
  const report = await generateUpdateReport({ network: false });

  const body = {
    meta: {
      title: 'Founder Atlas — data update report',
      tagline: 'Freshness, source inventory and MVP-readiness across the dataset (offline-computed).',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'ADDITIVE export, generated offline at build time (no network probing — networkChecked:false). ' +
        'Report-only: no data is modified. The schema is at /schemas/program-update.schema.json. ' +
        'Run `npm run report:update -- --check` locally for live URL-health probing.',
      schemaRef: '/schemas/program-update.schema.json',
    },
    report,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
