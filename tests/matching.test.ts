/**
 * Stream 5 — deterministic matching engine tests.
 *
 * Pure, deterministic coverage built on small in-memory fixtures (plus a smoke
 * pass over the real PROGRAMS). Covers: hard disqualifiers, ranking order,
 * explanation presence, and that closed / stale / unverified records are
 * penalized and surfaced as cautions (never silently recommended).
 */
import { describe, it, expect } from 'vitest';
import { PROGRAMS } from '@/data/programs';
import type { Program } from '@/data/programs';
import { matchPrograms, scoreProgram, WEIGHTS } from '@/lib/matching';
import type { FounderNeedsProfile } from '@/lib/matching';
import { triggersToNeeds, TRIGGERS } from '@/data/triggers';

// A fixed "today" so freshness is deterministic regardless of when tests run.
const NOW = new Date('2026-06-11T00:00:00Z');

/** Build a Program fixture with sensible defaults. */
function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    dataset: 'residential',
    name: 'Test Program',
    type: 'Accelerator',
    city: 'Helsinki',
    country: 'Finland',
    lat: 60,
    lng: 24,
    focus: 'AI',
    operator: 'Test Op',
    stage: 'Pre-seed',
    status: 'rolling',
    status_detail: '',
    domain: 'test.example',
    url: 'https://test.example/apply',
    lastVerified: '2026-06-01',
    verificationStatus: 'verified',
    ...overrides,
  };
}

describe('hard disqualifiers', () => {
  it('disqualifies when visa is needed but program offers no visa support', () => {
    const program = makeProgram({ type: 'Accelerator', providesVisaSupport: false });
    const profile: FounderNeedsProfile = { visaNeed: true };
    const m = scoreProgram(profile, program, { now: NOW });
    expect(m.disqualifiers.map((d) => d.code)).toContain('visa-not-offered');
    expect(m.score).toBe(0);
  });

  it('does NOT disqualify on visa when the program offers visa support', () => {
    const program = makeProgram({ type: 'Startup visa', providesVisaSupport: true });
    const m = scoreProgram({ visaNeed: true }, program, { now: NOW });
    expect(m.disqualifiers).toHaveLength(0);
    expect(m.reasons.map((r) => r.code)).toContain('visa-fit');
  });

  it('disqualifies relocation-required program when founder will not relocate', () => {
    const program = makeProgram({ format: 'live-in' });
    const m = scoreProgram({ willingToRelocate: false }, program, { now: NOW });
    expect(m.disqualifiers.map((d) => d.code)).toContain('relocation-required');
    expect(m.score).toBe(0);
  });

  it('disqualifies on stage mismatch', () => {
    const program = makeProgram({ stageFit: ['seed', 'series-a-plus'] });
    const m = scoreProgram({ stage: 'pre-idea' }, program, { now: NOW });
    expect(m.disqualifiers.map((d) => d.code)).toContain('stage-mismatch');
    expect(m.score).toBe(0);
  });

  it('does not disqualify on stage when the program declares no stages', () => {
    const program = makeProgram({ stageFit: undefined, stage: '' });
    const m = scoreProgram({ stage: 'pre-idea' }, program, { now: NOW });
    expect(m.disqualifiers).toHaveLength(0);
  });

  it('disqualifies an equity program for an equity-free-only founder', () => {
    const program = makeProgram({ type: 'Accelerator', costFundingModel: 'equity' });
    const m = scoreProgram({ equityTolerance: 'equity-free-only' }, program, { now: NOW });
    expect(m.disqualifiers.map((d) => d.code)).toContain('equity-required');
  });

  it('disqualifies a closed cohort when the founder wants to apply now', () => {
    const program = makeProgram({ status: 'closed' });
    const m = scoreProgram({ urgency: 'apply-now' }, program, { now: NOW });
    expect(m.disqualifiers.map((d) => d.code)).toContain('closed-but-urgent');
  });

  it('treats a closed cohort as a caution (not a disqualifier) when not urgent', () => {
    const program = makeProgram({ status: 'closed' });
    const m = scoreProgram({ urgency: 'exploring' }, program, { now: NOW });
    expect(m.disqualifiers).toHaveLength(0);
    expect(m.cautions.map((c) => c.code)).toContain('closed');
  });
});

describe('soft scoring + ranking order', () => {
  it('ranks a strong fit above a weak fit', () => {
    const strong = makeProgram({
      name: 'Strong Fit',
      stageFit: ['pre-seed'],
      providesFunding: true,
      providesMentorship: true,
      sectorFocus: ['AI'],
      mvp: true,
      country: 'Finland',
    });
    const weak = makeProgram({
      name: 'Weak Fit',
      type: 'Hacker house',
      stageFit: ['series-a-plus'],
      sectorFocus: ['climate'],
      country: 'USA',
      mvp: false,
    });
    const profile: FounderNeedsProfile = {
      stage: 'pre-seed',
      fundingNeed: true,
      sector: 'AI',
      preferredRegions: ['Finland'],
      supportNeeds: ['funding', 'mentorship'],
    };
    const ranked = matchPrograms(profile, [weak, strong], { now: NOW });
    expect(ranked[0].programName).toBe('Strong Fit');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('produces a stable, deterministic order across runs', () => {
    const profile: FounderNeedsProfile = { stage: 'seed', fundingNeed: true };
    const a = matchPrograms(profile, PROGRAMS, { now: NOW }).map((m) => m.programId);
    const b = matchPrograms(profile, PROGRAMS, { now: NOW }).map((m) => m.programId);
    expect(a).toEqual(b);
  });

  it('places disqualified programs last and excludes them when asked', () => {
    const good = makeProgram({ name: 'Good', providesVisaSupport: true });
    const bad = makeProgram({ name: 'Bad', providesVisaSupport: false });
    const profile: FounderNeedsProfile = { visaNeed: true };
    const ranked = matchPrograms(profile, [bad, good], { now: NOW });
    expect(ranked[ranked.length - 1].programName).toBe('Bad');

    const filtered = matchPrograms(profile, [bad, good], { now: NOW, excludeDisqualified: true });
    expect(filtered.map((m) => m.programName)).toEqual(['Good']);
  });

  it('clamps scores into the 0–100 range', () => {
    const program = makeProgram({
      stageFit: ['pre-seed'],
      providesFunding: true,
      providesMentorship: true,
      providesVisaSupport: true,
      sectorFocus: ['AI'],
      mvp: true,
      country: 'Finland',
    });
    const profile: FounderNeedsProfile = {
      stage: 'pre-seed',
      fundingNeed: true,
      visaNeed: true,
      sector: 'AI',
      preferredRegions: ['Finland'],
      supportNeeds: ['funding', 'mentorship', 'visa-support', 'investor-access', 'demo-day'],
    };
    const m = scoreProgram(profile, program, { now: NOW });
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThanOrEqual(100);
  });
});

describe('explanation presence', () => {
  it('every match carries a suggested next step', () => {
    const matches = matchPrograms({ stage: 'seed' }, PROGRAMS.slice(0, 25), { now: NOW });
    for (const m of matches) {
      expect(typeof m.suggestedNextStep).toBe('string');
      expect(m.suggestedNextStep.length).toBeGreaterThan(0);
    }
  });

  it('a positive match lists at least one reason with a stable code', () => {
    const program = makeProgram({ stageFit: ['seed'], providesFunding: true });
    const m = scoreProgram({ stage: 'seed', fundingNeed: true, supportNeeds: ['funding'] }, program, { now: NOW });
    expect(m.reasons.length).toBeGreaterThan(0);
    expect(m.reasons.every((r) => r.code && r.text)).toBe(true);
    expect(m.reasons.map((r) => r.code)).toContain('stage-fit');
  });

  it('disqualifier reasons always carry human-readable text', () => {
    const m = scoreProgram({ visaNeed: true }, makeProgram({ providesVisaSupport: false }), { now: NOW });
    expect(m.disqualifiers.every((d) => d.text.length > 0)).toBe(true);
  });
});

describe('freshness / closed / unverified are flagged and penalized', () => {
  it('flags a stale last-verified date as a caution', () => {
    const program = makeProgram({ lastVerified: '2023-01-01' });
    const m = scoreProgram({ stage: 'pre-seed' }, program, { now: NOW });
    expect(m.cautions.map((c) => c.code)).toContain('stale');
    expect(m.suggestedNextStep.toLowerCase()).toContain('verify');
  });

  it('flags a missing last-verified date as a caution', () => {
    const program = makeProgram({ lastVerified: undefined });
    const m = scoreProgram({ stage: 'pre-seed' }, program, { now: NOW });
    expect(m.cautions.map((c) => c.code)).toContain('stale');
  });

  it('flags unverified records and penalizes the score', () => {
    const fresh = makeProgram({ name: 'Fresh', verificationStatus: 'verified', providesFunding: true });
    const unver = makeProgram({ name: 'Unver', verificationStatus: 'unverified', providesFunding: true });
    const profile: FounderNeedsProfile = { fundingNeed: true, supportNeeds: ['funding'] };
    const freshScore = scoreProgram(profile, fresh, { now: NOW }).score;
    const unverMatch = scoreProgram(profile, unver, { now: NOW });
    expect(unverMatch.cautions.map((c) => c.code)).toContain('unverified');
    expect(unverMatch.score).toBeLessThan(freshScore);
  });

  it('a closed cohort lowers score versus an identical open one', () => {
    const open = makeProgram({ name: 'Open', status: 'rolling', providesFunding: true });
    const closed = makeProgram({ name: 'Closed', status: 'closed', providesFunding: true });
    const profile: FounderNeedsProfile = { fundingNeed: true, supportNeeds: ['funding'], urgency: 'exploring' };
    const openScore = scoreProgram(profile, open, { now: NOW }).score;
    const closedScore = scoreProgram(profile, closed, { now: NOW }).score;
    expect(closedScore).toBeLessThan(openScore);
  });
});

describe('weights + trigger integration', () => {
  it('exposes explicit numeric weights', () => {
    expect(typeof WEIGHTS.stageFit).toBe('number');
    expect(WEIGHTS.closedPenalty).toBeLessThan(0);
  });

  it('triggersToNeeds merges selected trigger needs into a profile', () => {
    const funding = TRIGGERS.find((t) => t.label === 'I need funding')!;
    const cofounder = TRIGGERS.find((t) => t.label === 'I need a cofounder or community')!;
    const needs = triggersToNeeds([funding, cofounder]);
    expect(needs.fundingNeed).toBe(true);
    expect(needs.teamStatus).toBe('seeking-cofounder');
    expect(needs.supportNeeds).toEqual(expect.arrayContaining(['funding', 'co-founder-matching']));
  });

  it('runs against the real PROGRAMS set without throwing and returns explained matches', () => {
    const matches = matchPrograms(
      { stage: 'pre-seed', fundingNeed: true, supportNeeds: ['funding'], preferredRegions: ['Finland'] },
      PROGRAMS,
      { now: NOW, limit: 10 },
    );
    expect(matches.length).toBe(10);
    expect(matches[0].score).toBeGreaterThanOrEqual(matches[9].score);
    for (const m of matches) {
      expect(m).toHaveProperty('programId');
      expect(Array.isArray(m.reasons)).toBe(true);
      expect(Array.isArray(m.cautions)).toBe(true);
      expect(Array.isArray(m.disqualifiers)).toBe(true);
    }
  });
});
