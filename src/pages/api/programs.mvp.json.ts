import type { APIRoute } from 'astro';
import { PROGRAMS, programSlug } from '../../data/programs';
import { normalizeProgram } from '../../lib/normalizeProgram';
import { windowsForSlug } from '../../data/applicationWindows';
import { provenanceForSlug } from '../../data/sources';
import {
  resolveApplicationStatus,
  computeStale,
  summarizeTrust,
  APPLICATION_STATUS_META,
} from '../../lib/applicationStatus';
import { MVP_PROGRAM_TYPE_IDS } from '../../data/taxonomy';

// Stream 9 — Curated MVP-only export (ADDITIVE).
//
// Only records tagged `mvp:true` (curated, launch-ready, high-trust). This is
// clearly distinguished from the full dataset: the full set lives at
// /api/programs.json (stable) and /api/programs.normalized.json (all records,
// normalized). Agents that only want the launch-ready, vetted slice consume
// this one.
//
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  const now = new Date();

  const mvpPrograms = PROGRAMS.filter((p) => p.mvp === true).map((p) => {
    const slug = programSlug(p.name);
    const normalized = normalizeProgram(p);
    const windows = windowsForSlug(slug);
    const provenance = provenanceForSlug(slug);
    const resolvedStatus = resolveApplicationStatus({ legacyStatus: p.status, windows }, now);
    const stale = computeStale(p.lastVerified, now);
    const trust = summarizeTrust(provenance);

    return {
      slug,
      name: p.name,
      dataset: p.dataset,
      url: p.url,
      country: p.country,
      city: p.city || null,
      ecosystem: p.ecosystem ?? null,
      legacyType: p.type,
      canonicalType: normalized.canonicalType,
      canonicalStages: normalized.canonicalStages,
      supportModes: normalized.canonicalSupportModes,
      costFundingModel: normalized.canonicalCostFundingModel ?? null,
      applicationStatus: {
        status: resolvedStatus.status,
        source: resolvedStatus.source,
        label: APPLICATION_STATUS_META[resolvedStatus.status].label,
        windows: windows?.windows ?? [],
      },
      freshness: {
        lastVerified: p.lastVerified ?? null,
        ageDays: stale.ageDays,
        isStale: stale.isStale,
        unknown: stale.unknown,
        verificationStatus: p.verificationStatus ?? null,
      },
      provenance: {
        bestTrust: trust.best ?? null,
        realSourceCount: trust.realSourceCount,
        sampleOnly: trust.sampleOnly,
        sources: provenance?.sources ?? [],
      },
      mvp: true as const,
    };
  });

  const body = {
    meta: {
      title: 'Orbital — curated MVP program export',
      tagline:
        'Only curated, launch-ready (mvp:true) co-living programs. The vetted slice of the map.',
      compiled: now.toISOString().slice(0, 10),
      scope:
        'MVP = 100–200 high-trust, curated records across the MVP ecosystems and the 6–8 ' +
        'actively-populated program categories. Records NOT tagged mvp:true are intentionally ' +
        'excluded here; find the full dataset at /api/programs.normalized.json or /api/programs.json.',
      mvpProgramTypes: MVP_PROGRAM_TYPE_IDS,
      schemaRef: '/schemas/program.schema.json',
      note:
        'ADDITIVE export. mvpCount may be 0 until Stream 3 tags curated records; ' +
        'consumers should treat an empty list as "no curated records yet", not an error.',
    },
    count: mvpPrograms.length,
    totalPrograms: PROGRAMS.length,
    programs: mvpPrograms,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
