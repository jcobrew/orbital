import type { APIRoute } from 'astro';
import { TAXONOMY } from '../../data/taxonomy';

// Stream 9 — Machine-readable schema of `FounderNeedsProfile` (ADDITIVE).
//
// Describes the guided-intake input the deterministic matching engine (Stream 5)
// consumes. Every field is OPTIONAL — the engine degrades gracefully — so this
// doubles as the contract an agent fills in to request matches. Enum-valued
// fields reference the canonical taxonomy so an agent can use one vocabulary
// across all surfaces.
//
// This export is a documented field map; the formal JSON Schema document is at
// /schemas/founder-needs.schema.json.
//
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  const stageIds = TAXONOMY.founderStage.map((e) => e.id);
  const supportModeIds = TAXONOMY.supportMode.map((e) => e.id);

  const fields = [
    {
      field: 'stage',
      type: 'enum',
      taxonomy: 'founderStage',
      enum: stageIds,
      required: false,
      meaning: 'Current founder stage (guided-intake Q1).',
    },
    {
      field: 'location',
      type: 'string',
      required: false,
      meaning: 'Where the founder is based today (country string, matched loosely).',
    },
    {
      field: 'willingToRelocate',
      type: 'boolean',
      required: false,
      meaning: 'Willing to physically relocate for a program (Q5).',
    },
    {
      field: 'preferredRegions',
      type: 'string[]',
      required: false,
      meaning: 'Preferred regions / ecosystems, matched against country, region and ecosystem (Q6).',
    },
    {
      field: 'sector',
      type: 'string',
      required: false,
      meaning: 'Sector / industry focus (e.g. "AI", "climate"), matched against sectorFocus + focus.',
    },
    {
      field: 'teamStatus',
      type: 'enum',
      enum: ['solo', 'team', 'seeking-cofounder'],
      required: false,
      meaning: 'Solo, in a team, or looking for a co-founder (Q2).',
    },
    {
      field: 'fundingNeed',
      type: 'boolean',
      required: false,
      meaning: 'Whether the founder needs funding / capital.',
    },
    {
      field: 'equityTolerance',
      type: 'enum',
      enum: ['equity-free-only', 'prefer-equity-free', 'open'],
      required: false,
      meaning:
        'Equity tolerance (Q8). "equity-free-only" disqualifies equity programs; ' +
        '"prefer-equity-free" is a soft signal.',
    },
    {
      field: 'supportNeeds',
      type: 'enum[]',
      taxonomy: 'supportMode',
      enum: supportModeIds,
      required: false,
      meaning: 'Concrete support modes the founder wants (Q3/Q4), as supportMode taxonomy IDs.',
    },
    {
      field: 'visaNeed',
      type: 'boolean',
      required: false,
      meaning: 'Whether the founder needs visa / relocation support to participate.',
    },
    {
      field: 'urgency',
      type: 'enum',
      enum: ['apply-now', 'three-months', 'this-year', 'exploring'],
      required: false,
      meaning:
        'How soon the founder wants to act (Q7). "apply-now" makes a closed/unknown status a hard ' +
        'blocker; "exploring" makes it only a caution.',
    },
  ];

  const body = {
    meta: {
      title: 'Orbital — founder-needs profile schema',
      tagline: 'The guided-intake input shape consumed by the deterministic matching engine.',
      compiled: new Date().toISOString().slice(0, 10),
      note:
        'ADDITIVE export. Every field is OPTIONAL; an absent field imposes no constraint and ' +
        'contributes no score. Enum fields use canonical taxonomy IDs (see /api/program-types.json). ' +
        'The formal JSON Schema is at /schemas/founder-needs.schema.json.',
      schemaRef: '/schemas/founder-needs.schema.json',
    },
    enums: {
      teamStatus: ['solo', 'team', 'seeking-cofounder'],
      equityTolerance: ['equity-free-only', 'prefer-equity-free', 'open'],
      urgency: ['apply-now', 'three-months', 'this-year', 'exploring'],
      founderStage: stageIds,
      supportMode: supportModeIds,
    },
    fields,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
