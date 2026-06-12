import type { APIRoute } from 'astro';
import { TAXONOMY, MVP_PROGRAM_TYPE_IDS } from '../../data/taxonomy';

// Stream 9 — Canonical taxonomy export (ADDITIVE).
//
// Publishes the full Founder Atlas taxonomy as machine-readable JSON: every
// dimension (programType, supportMode, founderStage, intakeMethod,
// intakeFrequency, costFundingModel) with its IDs, human labels, MVP flags and
// descriptions. The `programType` dimension is the headline; the others are
// included so agents can resolve every canonical ID returned by
// /api/programs.normalized.json and /api/founder-needs-schema.json.
//
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  const dimensions = Object.fromEntries(
    Object.entries(TAXONOMY).map(([dimension, entries]) => [
      dimension,
      {
        count: entries.length,
        mvpCount: entries.filter((e) => e.mvp).length,
        values: entries.map((e) => ({
          id: e.id,
          label: e.label,
          mvp: e.mvp,
          description: e.description ?? null,
        })),
      },
    ]),
  );

  const body = {
    meta: {
      title: 'Founder Atlas — canonical taxonomy',
      tagline:
        'The full program-type taxonomy plus the supporting dimensions, with MVP scope flags and labels.',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'ADDITIVE export. `mvp:true` marks the values in scope for the MVP (the 6–8 actively ' +
        'populated program categories and the dimensions the matching/intake flow reasons about). ' +
        'All values stay representable; nothing is removed.',
      dimensions: Object.keys(TAXONOMY),
      mvpProgramTypes: MVP_PROGRAM_TYPE_IDS,
    },
    // The headline dimension, surfaced at top level for convenience.
    programTypes: dimensions.programType.values,
    taxonomy: dimensions,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
