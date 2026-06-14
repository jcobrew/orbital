import type { APIRoute } from 'astro';
import { PROGRAMS, programSlug } from '../../data/programs';
import { TAXONOMY } from '../../data/taxonomy';
import { normalizeProgram } from '../../lib/normalizeProgram';
import { windowsForSlug } from '../../data/applicationWindows';
import { provenanceForSlug } from '../../data/sources';
import {
  resolveApplicationStatus,
  computeStale,
  summarizeTrust,
  APPLICATION_STATUS_META,
} from '../../lib/applicationStatus';

// Stream 9 — Normalized, agent-oriented program export (ADDITIVE).
//
// This is a NEW endpoint and does not touch the stable `/api/programs.json`
// contract. Each record carries the canonical taxonomy IDs (type, support
// modes, stages, cost/funding model) derived non-destructively via
// `normalizeProgram`, plus a resolved application status (window-aware, Stream
// 4), a freshness summary from `lastVerified`, and a provenance/trust summary.
//
// CORS / content-type headers are applied by vercel.json on deploy.
export const GET: APIRoute = () => {
  // `new Date()` once so every record shares a consistent "now".
  const now = new Date();

  const programs = PROGRAMS.map((p) => {
    const slug = programSlug(p.name);
    const normalized = normalizeProgram(p);

    const windows = windowsForSlug(slug);
    const provenance = provenanceForSlug(slug);

    const resolvedStatus = resolveApplicationStatus(
      { legacyStatus: p.status, windows },
      now,
    );
    const stale = computeStale(p.lastVerified, now);
    const trust = summarizeTrust(provenance);

    return {
      // ---- Identity (links back to /api/programs.json by `name`/slug) ----
      slug,
      name: p.name,
      dataset: p.dataset,
      url: p.url,
      country: p.country,
      city: p.city || null,
      region: p.region ?? null,
      ecosystem: p.ecosystem ?? null,

      // ---- Canonical taxonomy (derived; legacy `type`/`stage` preserved) ----
      legacyType: p.type,
      canonicalType: normalized.canonicalType,
      canonicalStages: normalized.canonicalStages,
      supportModes: normalized.canonicalSupportModes,
      costFundingModel: normalized.canonicalCostFundingModel ?? null,

      // ---- Application status + freshness (Stream 4 helpers) ----
      applicationStatus: {
        status: resolvedStatus.status,
        source: resolvedStatus.source,
        label: APPLICATION_STATUS_META[resolvedStatus.status].label,
        legacyStatus: p.status,
        windows: windows?.windows ?? [],
      },
      freshness: {
        lastVerified: p.lastVerified ?? null,
        ageDays: stale.ageDays,
        isStale: stale.isStale,
        unknown: stale.unknown,
        verificationStatus: p.verificationStatus ?? null,
      },

      // ---- Provenance / trust (Stream 4) ----
      provenance: {
        bestTrust: trust.best ?? null,
        realSourceCount: trust.realSourceCount,
        sampleOnly: trust.sampleOnly,
        sources: provenance?.sources ?? [],
        legacySourceUrls: p.sourceUrls ?? [],
      },

      // ---- MVP scope marker ----
      mvp: p.mvp === true,
    };
  });

  const body = {
    meta: {
      title: 'Orbital — normalized program export',
      tagline:
        'Every program with canonical taxonomy IDs, resolved application status, freshness and provenance.',
      compiled: now.toISOString().slice(0, 10),
      note:
        'NORMALIZED + ADDITIVE export. The stable contract lives at /api/programs.json; ' +
        'this surface derives canonical fields non-destructively and may evolve. ' +
        'Application status is window-aware (Stream 4) and falls back to the legacy status field. ' +
        'Freshness/provenance reflect best-available public info — confirm on each program site.',
      schemaRef: '/schemas/program.schema.json',
      taxonomy: {
        programType: TAXONOMY.programType.map((e) => e.id),
        supportMode: TAXONOMY.supportMode.map((e) => e.id),
        founderStage: TAXONOMY.founderStage.map((e) => e.id),
        costFundingModel: TAXONOMY.costFundingModel.map((e) => e.id),
      },
      staleAfterDays: 90,
    },
    count: programs.length,
    mvpCount: programs.filter((p) => p.mvp).length,
    programs,
  };

  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
