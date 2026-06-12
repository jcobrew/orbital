import { describe, it, expect } from 'vitest';
import {
  classifyFreshness,
  summarizeFreshness,
  daysBetween,
  parseDate,
} from '../scripts/check-program-freshness';
import { collectSourceUrls } from '../scripts/check-source-urls';
import type { Program } from '../src/data/programs';

const NOW = new Date('2026-06-12T00:00:00Z');

function prog(p: Partial<Program>): Program {
  return { name: 'x', dataset: 'residential', ...p } as Program;
}

describe('freshness detection', () => {
  it('parses dates and computes day spans', () => {
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('not-a-date')).toBeNull();
    expect(daysBetween(NOW, new Date('2026-06-02T00:00:00Z'))).toBe(10);
  });

  it('classifies missing, fresh, and stale records', () => {
    expect(classifyFreshness(prog({ lastVerified: undefined }), 180, NOW).state).toBe('missing-date');
    expect(classifyFreshness(prog({ lastVerified: 'banana' }), 180, NOW).state).toBe('invalid-date');
    expect(classifyFreshness(prog({ lastVerified: '2026-06-01' }), 180, NOW).state).toBe('fresh');
    expect(classifyFreshness(prog({ lastVerified: '2024-01-01' }), 180, NOW).state).toBe('stale');
  });

  it('summarizes counts across a dataset', () => {
    const summary = summarizeFreshness(
      [
        prog({ name: 'a', lastVerified: '2026-06-01' }),
        prog({ name: 'b', lastVerified: '2024-01-01' }),
        prog({ name: 'c', lastVerified: undefined }),
      ],
      180,
      NOW,
    );
    expect(summary.total).toBe(3);
    expect(summary.fresh).toBe(1);
    expect(summary.stale).toBe(1);
    expect(summary.missingDate).toBe(1);
  });
});

describe('source-url inventory', () => {
  it('separates programs with and without sources and de-dupes urls', () => {
    const { pairs, missingSourcePrograms } = collectSourceUrls([
      prog({ name: 'a', sourceUrls: ['https://x.com', 'https://x.com'] }),
      prog({ name: 'b', sourceUrls: [] }),
      prog({ name: 'c' }),
    ]);
    expect(pairs).toHaveLength(1); // duplicate collapsed
    expect(missingSourcePrograms).toEqual(['b', 'c']);
  });
});
