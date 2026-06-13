import type { APIRoute } from 'astro';
import { COUNTRIES } from '../../data/countries';

// Machine-readable country ecosystem profiles (pre-rendered at build).
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  const body = {
    meta: {
      title: 'Orbital — country startup-ecosystem profiles',
      tagline:
        'National startup ecosystems for founders considering relocation: visas, key organizations and links.',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'Each country links back to its programs in /api/programs.json by the shared `name` field. ' +
        'Visa rules and links change frequently — confirm on the official source.',
    },
    count: COUNTRIES.length,
    countries: COUNTRIES,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
