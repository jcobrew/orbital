import type { APIRoute } from 'astro';
import {
  PROGRAMS,
  FACETS,
  API_SCHEMA,
  STATUS_LEGEND,
} from '../../data/programs';

// Canonical machine-readable endpoint (pre-rendered to a static file at build).
// CORS / content-type headers are applied by vercel.json on deploy.
//
// Back-compat: this legacy endpoint keeps the derived `dataset` field on every
// program AND a `facets.dataset` count, even though `dataset` is no longer a
// stored source field (it is derived from canonicalType/format). The primary
// categorical axis is `canonicalType` (also exposed via `facets.canonicalType`).
export const GET: APIRoute = () => {
  // Derived legacy facets, kept for back-compat with the documented shape:
  //   - `dataset` (residential | traditional), derived from canonicalType/format
  //   - `type` (free-text human label counts)
  const datasetFacet: Record<string, number> = {};
  const typeFacet: Record<string, number> = {};
  for (const p of PROGRAMS) {
    datasetFacet[p.dataset] = (datasetFacet[p.dataset] ?? 0) + 1;
    if (p.type) typeFacet[p.type] = (typeFacet[p.type] ?? 0) + 1;
  }

  const body = {
    meta: {
      title: 'Founder Atlas — unified program API',
      tagline: 'The best places for founders to relocate and build, and the startup support waiting there.',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'Generated from the source dataset at build time. Recruiting status reflects ' +
        'best-available public info and changes frequently — confirm on each program site.',
      status_legend: STATUS_LEGEND,
      query_help:
        'The /dashboard page is filterable via URL query params: ' +
        '?type=<canonicalType>&q=<text>&country=<country>&status=<status>&focus=<text>&sort=<field>',
    },
    schema: API_SCHEMA,
    count: PROGRAMS.length,
    // `dataset` + `type` retained (deprecated, derived) for back-compat;
    // `canonicalType` is the new primary axis. `country`/`status` unchanged.
    facets: { dataset: datasetFacet, type: typeFacet, ...FACETS },
    programs: PROGRAMS,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
