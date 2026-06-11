/**
 * Smoke tests for the data layer.
 *
 * Verifies that PROGRAMS and FACETS load correctly and have the expected shape.
 * This gives future streams a test harness to extend without touching
 * source/schema/data files.
 */
import { describe, it, expect } from 'vitest';
import { PROGRAMS, FACETS } from '@/data/programs';

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
});

describe('FACETS', () => {
  it('has the expected top-level keys', () => {
    const expectedKeys = ['dataset', 'type', 'country', 'status'];
    for (const key of expectedKeys) {
      expect(FACETS, `FACETS missing key: ${key}`).toHaveProperty(key);
    }
  });

  it('facet values are non-empty objects', () => {
    for (const [key, value] of Object.entries(FACETS)) {
      expect(typeof value, `FACETS.${key} is not an object`).toBe('object');
      expect(Object.keys(value).length, `FACETS.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('dataset facet contains residential and traditional', () => {
    expect(FACETS.dataset).toHaveProperty('residential');
    expect(FACETS.dataset).toHaveProperty('traditional');
  });
});
