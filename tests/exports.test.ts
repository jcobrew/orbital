/**
 * Stream 9 — Public API / static export tests.
 *
 * Two jobs:
 *   1. Assert the NEW agent-oriented exports are well-formed (canonical
 *      taxonomy, status/freshness/provenance, schemas).
 *   2. GUARD the legacy contracts: /api/programs.json and /api/countries.json
 *      must keep their documented top-level shape, byte-for-byte stable. An
 *      accidental change to those endpoints breaks this test.
 *
 * Endpoints export `GET` (an Astro APIRoute); we invoke them directly and parse
 * the JSON body — no build/server needed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { GET as programsGET } from '@/pages/api/programs.json';
import { GET as countriesGET } from '@/pages/api/countries.json';
import { GET as normalizedGET } from '@/pages/api/programs.normalized.json';
import { GET as mvpGET } from '@/pages/api/programs.mvp.json';
import { GET as typesGET } from '@/pages/api/program-types.json';
import { GET as needsGET } from '@/pages/api/founder-needs-schema.json';
import { GET as reportGET } from '@/pages/api/update-report.json';

import { PROGRAMS } from '@/data/programs';
import { PROGRAM_TYPE_IDS, SUPPORT_MODES, FOUNDER_STAGES } from '@/data/taxonomy';

// Minimal Astro APIContext stub — these handlers ignore it.
const ctx = {} as never;

async function bodyOf(handler: (c: never) => Response | Promise<Response>): Promise<unknown> {
  const res = await handler(ctx);
  expect(res).toBeInstanceOf(Response);
  expect(res.headers.get('Content-Type')).toContain('application/json');
  const text = await res.text();
  return JSON.parse(text);
}

describe('legacy contracts are stable', () => {
  it('/api/programs.json keeps its documented top-level shape', async () => {
    const body = (await bodyOf(programsGET)) as Record<string, unknown>;
    // Exact top-level keys — adding/removing one is a contract break.
    expect(Object.keys(body).sort()).toEqual(
      ['count', 'facets', 'meta', 'programs', 'schema'].sort(),
    );
    expect(body.count).toBe(PROGRAMS.length);
    expect(Array.isArray(body.programs)).toBe(true);
    expect((body.programs as unknown[]).length).toBe(PROGRAMS.length);

    const meta = body.meta as Record<string, unknown>;
    for (const k of ['title', 'tagline', 'compiled', 'note', 'status_legend', 'query_help']) {
      expect(meta, `meta.${k} missing`).toHaveProperty(k);
    }
    expect(body.facets).toHaveProperty('type');
    expect(body.facets).toHaveProperty('country');
    expect(body.facets).toHaveProperty('status');

    // Every program retains its core legacy fields untouched.
    const first = (body.programs as Record<string, unknown>[])[0];
    for (const k of ['name', 'type', 'dataset', 'city', 'country', 'lat', 'lng', 'status', 'url']) {
      expect(first, `program.${k} missing`).toHaveProperty(k);
    }
  });

  it('/api/countries.json keeps its documented top-level shape', async () => {
    const body = (await bodyOf(countriesGET)) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['count', 'countries', 'meta'].sort());
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.countries)).toBe(true);
    expect((body.countries as unknown[]).length).toBe(body.count);
  });
});

describe('/api/programs.normalized.json', () => {
  it('is well-formed and carries canonical + status + freshness + provenance', async () => {
    const body = (await bodyOf(normalizedGET)) as Record<string, unknown>;
    expect(body.count).toBe(PROGRAMS.length);
    const programs = body.programs as Record<string, unknown>[];
    expect(programs.length).toBe(PROGRAMS.length);

    for (const p of programs) {
      expect(typeof p.slug).toBe('string');
      expect(typeof p.name).toBe('string');
      // canonicalType must be a known taxonomy ID.
      expect(PROGRAM_TYPE_IDS).toContain(p.canonicalType);
      expect(Array.isArray(p.supportModes)).toBe(true);
      expect(Array.isArray(p.canonicalStages)).toBe(true);

      const status = p.applicationStatus as Record<string, unknown>;
      expect(['open', 'upcoming', 'closed', 'unknown']).toContain(status.status);
      expect(['window', 'legacy', 'none']).toContain(status.source);

      const freshness = p.freshness as Record<string, unknown>;
      expect(freshness).toHaveProperty('lastVerified');
      expect(freshness).toHaveProperty('isStale');

      const provenance = p.provenance as Record<string, unknown>;
      expect(provenance).toHaveProperty('realSourceCount');
      expect(Array.isArray(provenance.sources)).toBe(true);

      expect(typeof p.mvp).toBe('boolean');
    }
  });
});

describe('/api/programs.mvp.json', () => {
  it('contains only mvp:true records and counts them', async () => {
    const body = (await bodyOf(mvpGET)) as Record<string, unknown>;
    expect(body.totalPrograms).toBe(PROGRAMS.length);
    const programs = body.programs as Record<string, unknown>[];
    expect(body.count).toBe(programs.length);
    const expectedMvp = PROGRAMS.filter((p) => p.mvp === true).length;
    expect(programs.length).toBe(expectedMvp);
    for (const p of programs) expect(p.mvp).toBe(true);
  });
});

describe('/api/program-types.json', () => {
  it('publishes the full taxonomy with labels and mvp flags', async () => {
    const body = (await bodyOf(typesGET)) as Record<string, unknown>;
    const programTypes = body.programTypes as Record<string, unknown>[];
    expect(programTypes.length).toBe(PROGRAM_TYPE_IDS.length);
    for (const t of programTypes) {
      expect(PROGRAM_TYPE_IDS).toContain(t.id);
      expect(typeof t.label).toBe('string');
      expect(typeof t.mvp).toBe('boolean');
    }
    const taxonomy = body.taxonomy as Record<string, unknown>;
    for (const dim of ['programType', 'supportMode', 'founderStage', 'intakeMethod', 'intakeFrequency', 'costFundingModel']) {
      expect(taxonomy, `taxonomy.${dim} missing`).toHaveProperty(dim);
    }
  });
});

describe('/api/founder-needs-schema.json', () => {
  it('describes optional FounderNeedsProfile fields with canonical enums', async () => {
    const body = (await bodyOf(needsGET)) as Record<string, unknown>;
    const fields = body.fields as Record<string, unknown>[];
    const names = fields.map((f) => f.field);
    for (const expected of ['stage', 'supportNeeds', 'urgency', 'equityTolerance', 'teamStatus']) {
      expect(names).toContain(expected);
    }
    for (const f of fields) expect(f.required).toBe(false);
    const enums = body.enums as Record<string, unknown>;
    expect(enums.founderStage).toEqual(FOUNDER_STAGES.map((e) => e.id));
    expect(enums.supportMode).toEqual(SUPPORT_MODES.map((e) => e.id));
  });
});

describe('/api/update-report.json', () => {
  it('serves the offline update report (networkChecked:false)', async () => {
    const body = (await bodyOf(reportGET)) as Record<string, unknown>;
    const report = body.report as Record<string, unknown>;
    expect(report.networkChecked).toBe(false);
    const headline = report.headline as Record<string, unknown>;
    expect(headline.totalPrograms).toBe(PROGRAMS.length);
    for (const k of ['stale', 'missingVerificationDate', 'taggedMvp', 'notMvpReady']) {
      expect(headline, `headline.${k} missing`).toHaveProperty(k);
    }
  });
});

describe('JSON Schema documents', () => {
  const dir = resolve(__dirname, '../public/schemas');
  for (const file of ['program.schema.json', 'founder-needs.schema.json', 'program-update.schema.json']) {
    it(`${file} is valid JSON with $schema + $id`, () => {
      const doc = JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as Record<string, unknown>;
      expect(doc.$schema).toContain('json-schema.org');
      expect(typeof doc.$id).toBe('string');
      expect(doc).toHaveProperty('properties');
    });
  }

  it('program.schema.json enum for canonicalType matches the taxonomy', () => {
    const doc = JSON.parse(
      readFileSync(resolve(dir, 'program.schema.json'), 'utf8'),
    ) as { properties: { canonicalType: { enum: string[] } } };
    expect(doc.properties.canonicalType.enum.sort()).toEqual([...PROGRAM_TYPE_IDS].sort());
  });
});
