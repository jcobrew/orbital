import { describe, it, expect } from 'vitest';
import { applyUrgency } from '@/lib/applyUrgency';

// Fixed "now" so window date math is deterministic. Chosen so the sample
// startup-wise-guys window (closes 2026-07-15) is open and closing within 30d.
const NOW = new Date('2026-06-24T00:00:00Z');

describe('applyUrgency — window-backed programs (sample data)', () => {
  it('flags a currently-open window closing within 30 days as urgent', () => {
    // startup-wise-guys: opens 2026-05-01, closes 2026-07-15 → 21 days out.
    const u = applyUrgency('startup-wise-guys', 'open', NOW);
    expect(u).toEqual({ label: 'Closes in 21 days', tone: 'urgent' });
  });

  it('shows "Applications open" for a rolling window with no deadline', () => {
    const u = applyUrgency('y-combinator', 'rolling', NOW);
    expect(u).toEqual({ label: 'Applications open', tone: 'open' });
  });

  it('returns null for an upcoming (not-yet-open) window', () => {
    // south-park-commons opens 2026-08-01 (future) → nothing to act on yet.
    expect(applyUrgency('south-park-commons', undefined, NOW)).toBeNull();
  });

  it('returns null for a closed window', () => {
    // founders-inc-f-inc closed 2026-03-31 → no discouraging cue near Apply.
    expect(applyUrgency('founders-inc-f-inc', undefined, NOW)).toBeNull();
  });
});

describe('applyUrgency — legacy-status fallback (no window data)', () => {
  it('maps closing-soon to an urgent "Closing soon"', () => {
    expect(applyUrgency('no-window-slug', 'closing-soon', NOW)).toEqual({
      label: 'Closing soon',
      tone: 'urgent',
    });
  });

  it('maps opening-soon to "Opening soon"', () => {
    expect(applyUrgency('no-window-slug', 'opening-soon', NOW)).toEqual({
      label: 'Opening soon',
      tone: 'upcoming',
    });
  });

  it('maps open/rolling to "Applications open"', () => {
    expect(applyUrgency('no-window-slug', 'open', NOW)?.label).toBe('Applications open');
    expect(applyUrgency('no-window-slug', 'rolling', NOW)?.label).toBe('Applications open');
  });

  it('shows nothing for closed/running/unknown', () => {
    expect(applyUrgency('no-window-slug', 'closed', NOW)).toBeNull();
    expect(applyUrgency('no-window-slug', 'running', NOW)).toBeNull();
    expect(applyUrgency('no-window-slug', undefined, NOW)).toBeNull();
  });
});
