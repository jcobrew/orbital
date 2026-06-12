import { describe, it, expect } from 'vitest';
import {
  statusForWindow,
  statusFromWindows,
  statusFromLegacy,
  resolveApplicationStatus,
  computeStale,
  summarizeTrust,
  STALE_AFTER_DAYS,
} from '@/lib/applicationStatus';
import type { ProgramWindows } from '@/data/applicationWindows';
import type { ProgramProvenance } from '@/data/sources';

// Fixed reference "now" so date math is deterministic.
const NOW = new Date('2026-06-11T00:00:00Z');

describe('statusForWindow', () => {
  it('rolling → open', () => {
    expect(statusForWindow({ rolling: true }, NOW)).toBe('open');
  });

  it('current open window → open', () => {
    expect(statusForWindow({ opens: '2026-06-01', closes: '2026-07-01' }, NOW)).toBe('open');
  });

  it('future window → upcoming', () => {
    expect(statusForWindow({ opens: '2026-08-01', closes: '2026-09-01' }, NOW)).toBe('upcoming');
  });

  it('past window → closed', () => {
    expect(statusForWindow({ opens: '2026-01-01', closes: '2026-03-01' }, NOW)).toBe('closed');
  });

  it('no dates → unknown', () => {
    expect(statusForWindow({ cohortLabel: 'TBD' }, NOW)).toBe('unknown');
  });

  it('open with no close date → open', () => {
    expect(statusForWindow({ opens: '2026-05-01' }, NOW)).toBe('open');
  });

  it('boundary: exactly on open date → open', () => {
    expect(statusForWindow({ opens: '2026-06-11', closes: '2026-07-01' }, NOW)).toBe('open');
  });

  it('boundary: exactly on close date → open (not yet past)', () => {
    expect(statusForWindow({ opens: '2026-06-01', closes: '2026-06-11' }, NOW)).toBe('open');
  });
});

describe('statusFromWindows', () => {
  const mk = (windows: ProgramWindows['windows']): ProgramWindows => ({
    programSlug: 'x',
    windows,
  });

  it('undefined / empty → unknown', () => {
    expect(statusFromWindows(undefined, NOW)).toBe('unknown');
    expect(statusFromWindows(mk([]), NOW)).toBe('unknown');
  });

  it('picks open over upcoming and closed', () => {
    const w = mk([
      { opens: '2026-01-01', closes: '2026-02-01' }, // closed
      { opens: '2026-08-01', closes: '2026-09-01' }, // upcoming
      { rolling: true }, // open
    ]);
    expect(statusFromWindows(w, NOW)).toBe('open');
  });

  it('picks upcoming over closed', () => {
    const w = mk([
      { opens: '2026-01-01', closes: '2026-02-01' }, // closed
      { opens: '2026-08-01', closes: '2026-09-01' }, // upcoming
    ]);
    expect(statusFromWindows(w, NOW)).toBe('upcoming');
  });
});

describe('statusFromLegacy', () => {
  it('maps rolling/open/closing-soon → open', () => {
    expect(statusFromLegacy('rolling')).toBe('open');
    expect(statusFromLegacy('open')).toBe('open');
    expect(statusFromLegacy('closing-soon')).toBe('open');
  });
  it('maps opening-soon → upcoming', () => {
    expect(statusFromLegacy('opening-soon')).toBe('upcoming');
  });
  it('maps closed → closed', () => {
    expect(statusFromLegacy('closed')).toBe('closed');
  });
  it('running and unknown values → unknown', () => {
    expect(statusFromLegacy('running')).toBe('unknown');
    expect(statusFromLegacy('whatever')).toBe('unknown');
    expect(statusFromLegacy('')).toBe('unknown');
    expect(statusFromLegacy(undefined)).toBe('unknown');
  });
});

describe('resolveApplicationStatus precedence', () => {
  it('window overrides legacy status', () => {
    const windows: ProgramWindows = {
      programSlug: 'x',
      windows: [{ opens: '2026-08-01', closes: '2026-09-01' }], // upcoming
    };
    const r = resolveApplicationStatus({ legacyStatus: 'rolling', windows }, NOW);
    expect(r.status).toBe('upcoming');
    expect(r.source).toBe('window');
  });

  it('falls back to legacy when no windows', () => {
    const r = resolveApplicationStatus({ legacyStatus: 'opening-soon' }, NOW);
    expect(r.status).toBe('upcoming');
    expect(r.source).toBe('legacy');
  });

  it('no window and no legacy → unknown/none', () => {
    const r = resolveApplicationStatus({}, NOW);
    expect(r.status).toBe('unknown');
    expect(r.source).toBe('none');
  });
});

describe('computeStale', () => {
  it('recent date → not stale', () => {
    const info = computeStale('2026-06-01', NOW);
    expect(info.isStale).toBe(false);
    expect(info.ageDays).toBe(10);
    expect(info.unknown).toBe(false);
  });

  it('old date → stale', () => {
    const info = computeStale('2026-01-01', NOW);
    expect(info.isStale).toBe(true);
    expect(info.ageDays).toBeGreaterThan(STALE_AFTER_DAYS);
  });

  it('boundary: exactly threshold days → not stale', () => {
    const d = new Date(NOW.getTime() - STALE_AFTER_DAYS * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    expect(computeStale(iso, NOW).isStale).toBe(false);
  });

  it('missing/invalid date → unknown', () => {
    expect(computeStale(undefined, NOW).unknown).toBe(true);
    expect(computeStale('', NOW).unknown).toBe(true);
    expect(computeStale('not-a-date', NOW).unknown).toBe(true);
  });
});

describe('summarizeTrust', () => {
  it('no provenance → empty summary', () => {
    const s = summarizeTrust(undefined);
    expect(s.best).toBeUndefined();
    expect(s.realSourceCount).toBe(0);
    expect(s.sampleOnly).toBe(false);
  });

  it('picks strongest trust level and counts real sources', () => {
    const prov: ProgramProvenance = {
      programSlug: 'x',
      sources: [
        { url: 'a', title: 'A', kind: 'aggregator', trust: 'unverified' },
        { url: 'b', title: 'B', kind: 'official', trust: 'trusted' },
      ],
    };
    const s = summarizeTrust(prov);
    expect(s.best).toBe('trusted');
    expect(s.realSourceCount).toBe(2);
    expect(s.sampleOnly).toBe(false);
  });

  it('sample-only provenance → sampleOnly true', () => {
    const prov: ProgramProvenance = {
      programSlug: 'x',
      sources: [{ url: 'a', title: 'A', kind: 'sample', trust: 'sample' }],
    };
    const s = summarizeTrust(prov);
    expect(s.best).toBe('sample');
    expect(s.realSourceCount).toBe(0);
    expect(s.sampleOnly).toBe(true);
  });
});
