/**
 * Smoke tests for the data layer.
 *
 * Verifies that PROGRAMS and FACETS load correctly and have the expected shape.
 * This gives future streams a test harness to extend without touching
 * source/schema/data files.
 */
import { describe, it, expect } from 'vitest';
import { PROGRAMS, FACETS, deriveDataset } from '@/data/programs';
import { isProgramTypeId } from '@/data/taxonomy';

describe('PROGRAMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PROGRAMS)).toBe(true);
    expect(PROGRAMS.length).toBeGreaterThan(0);
  });

  it('every program has required fields: name, type, country, status', () => {
    for (const program of PROGRAMS) {
      expect(typeof program.name, `name missing on: ${program.name ?? '(unnamed)'}`).toBe('string');
      expect(program.name.trim().length, `name is empty`).toBeGreaterThan(0);

      expect(typeof program.type, `type missing on: ${program.name}`).toBe('string');
      expect(program.type.trim().length, `type is empty on: ${program.name}`).toBeGreaterThan(0);

      expect(typeof program.country, `country missing on: ${program.name}`).toBe('string');
      expect(program.country.trim().length, `country is empty on: ${program.name}`).toBeGreaterThan(0);

      expect(typeof program.status, `status missing on: ${program.name}`).toBe('string');
      expect(program.status.trim().length, `status is empty on: ${program.name}`).toBeGreaterThan(0);
    }
  });

  it('every program has a valid canonicalType (the primary categorical axis)', () => {
    for (const program of PROGRAMS) {
      expect(
        typeof program.canonicalType === 'string' && isProgramTypeId(program.canonicalType),
        `canonicalType invalid/missing on: ${program.name} (got ${JSON.stringify(program.canonicalType)})`,
      ).toBe(true);
    }
  });

  it('no program resolves canonicalType to the "other" fallback', () => {
    const others = PROGRAMS.filter((p) => p.canonicalType === 'other').map((p) => p.name);
    expect(others, `programs with canonicalType "other": ${others.join(', ')}`).toHaveLength(0);
  });

  it('every program is co-living (residential) — the dataset is co-living-only', () => {
    // The source JSON is now co-living-only, so every shipped record must be a
    // founder-residency / hacker-house / live-in cohort, i.e. `dataset: residential`.
    for (const p of PROGRAMS) {
      expect(p.dataset, `${p.name} should be residential`).toBe('residential');
      expect(deriveDataset(p), `${p.name} derivation mismatch`).toBe(p.dataset);
      const isCoLiving =
        p.canonicalType === 'founder-residency' || p.canonicalType === 'hacker-house' || p.format === 'live-in';
      expect(isCoLiving, `${p.name} is not a co-living record`).toBe(true);
    }
  });
});

describe('FACETS', () => {
  it('uses canonicalType as the primary facet (legacy dataset/type facets removed)', () => {
    expect(FACETS, 'canonicalType facet missing').toHaveProperty('canonicalType');
    expect(FACETS, 'legacy dataset facet should be gone').not.toHaveProperty('dataset');
    expect(FACETS, 'legacy type facet should be gone').not.toHaveProperty('type');
    expect(FACETS).toHaveProperty('country');
    expect(FACETS).toHaveProperty('status');
  });

  it('facet values are non-empty objects', () => {
    for (const [key, value] of Object.entries(FACETS)) {
      expect(typeof value, `FACETS.${key} is not an object`).toBe('object');
      expect(Object.keys(value).length, `FACETS.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('canonicalType facet keys are all valid taxonomy IDs', () => {
    for (const id of Object.keys(FACETS.canonicalType)) {
      expect(isProgramTypeId(id), `invalid canonicalType facet key: ${id}`).toBe(true);
    }
  });
});
