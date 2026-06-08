import type { APIRoute } from 'astro';
import {
  PROGRAMS,
  FACETS,
  API_SCHEMA,
  STATUS_LEGEND,
} from '../../data/programs';

// Canonical machine-readable endpoint (pre-rendered to a static file at build).
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  const body = {
    meta: {
      title: 'Founder LAB MAP — unified program API',
      tagline: 'Where founders find all kinds of living and building support programs.',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'Generated from the source datasets at build time. Recruiting status reflects ' +
        'best-available public info and changes frequently — confirm on each program site.',
      status_legend: STATUS_LEGEND,
      query_help:
        'The /dashboard page is filterable via URL query params: ' +
        '?dataset=all|residential|traditional&q=<text>&type=<type>&country=<country>&status=<status>&focus=<text>&sort=<field>',
    },
    schema: API_SCHEMA,
    count: PROGRAMS.length,
    facets: FACETS,
    programs: PROGRAMS,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
