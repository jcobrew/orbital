import { describe, it, expect } from 'vitest';
import {
  answersToProfile,
  answersFromQuery,
  answersToQuery,
  regionsToMatchTerms,
  hasAnyAnswer,
  type IntakeAnswers,
} from '@/components/find-support/profile';

describe('answersToProfile', () => {
  it('maps core answers through to the engine profile', () => {
    const a: IntakeAnswers = {
      stage: 'mvp',
      teamStatus: 'seeking-cofounder',
      supportNeeds: ['funding', 'mentorship'],
      willingToRelocate: true,
      regions: ['uk'],
      urgency: 'apply-now',
      equityTolerance: 'prefer-equity-free',
    };
    const p = answersToProfile(a);
    expect(p.stage).toBe('mvp');
    expect(p.teamStatus).toBe('seeking-cofounder');
    expect(p.supportNeeds).toEqual(['funding', 'mentorship']);
    expect(p.willingToRelocate).toBe(true);
    expect(p.urgency).toBe('apply-now');
    expect(p.equityTolerance).toBe('prefer-equity-free');
    expect(p.preferredRegions).toContain('uk');
  });

  it('infers fundingNeed and visaNeed from support needs', () => {
    const p = answersToProfile({ supportNeeds: ['funding', 'visa-support'] });
    expect(p.fundingNeed).toBe(true);
    expect(p.visaNeed).toBe(true);
  });

  it('does NOT set fundingNeed/visaNeed when not requested', () => {
    const p = answersToProfile({ supportNeeds: ['mentorship'] });
    expect(p.fundingNeed).toBeUndefined();
    expect(p.visaNeed).toBeUndefined();
  });

  it('omits empty / absent fields (graceful degradation)', () => {
    const p = answersToProfile({});
    expect(Object.keys(p)).toHaveLength(0);
  });

  it('preserves willingToRelocate === false', () => {
    const p = answersToProfile({ willingToRelocate: false });
    expect(p.willingToRelocate).toBe(false);
  });
});

describe('regionsToMatchTerms', () => {
  it('expands an option id into engine match substrings including the ecosystem tag', () => {
    const terms = regionsToMatchTerms(['finland-nordics']);
    expect(terms).toContain('finland-nordics');
    expect(terms).toContain('finland');
  });

  it('dedupes across multiple options', () => {
    const terms = regionsToMatchTerms(['uk', 'uk']);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('ignores unknown ids and empty input', () => {
    expect(regionsToMatchTerms(['nope'])).toEqual([]);
    expect(regionsToMatchTerms(undefined)).toEqual([]);
  });
});

describe('URL round-trip', () => {
  it('serializes and parses back to the same answers', () => {
    const a: IntakeAnswers = {
      stage: 'seed',
      teamStatus: 'solo',
      supportNeeds: ['community', 'workspace'],
      willingToRelocate: false,
      regions: ['estonia', 'uk'],
      urgency: 'exploring',
      equityTolerance: 'equity-free-only',
    };
    const qs = answersToQuery(a);
    expect(answersFromQuery(qs)).toEqual(a);
  });

  it('omits empty answers from the query string', () => {
    expect(answersToQuery({})).toBe('');
  });

  it('drops malformed / unknown values on parse', () => {
    const a = answersFromQuery('?stage=banana&team=solo&needs=funding,bogus&regions=mars,uk&urgency=soon');
    expect(a.stage).toBeUndefined();
    expect(a.teamStatus).toBe('solo');
    expect(a.supportNeeds).toEqual(['funding']);
    expect(a.regions).toEqual(['uk']);
    expect(a.urgency).toBeUndefined();
  });

  it('parses relocate yes/no into booleans', () => {
    expect(answersFromQuery('?relocate=yes').willingToRelocate).toBe(true);
    expect(answersFromQuery('?relocate=no').willingToRelocate).toBe(false);
    expect(answersFromQuery('?relocate=maybe').willingToRelocate).toBeUndefined();
  });
});

describe('hasAnyAnswer', () => {
  it('false for empty answers', () => {
    expect(hasAnyAnswer({})).toBe(false);
  });
  it('true once any field is set', () => {
    expect(hasAnyAnswer({ stage: 'idea' })).toBe(true);
    expect(hasAnyAnswer({ willingToRelocate: false })).toBe(true);
    expect(hasAnyAnswer({ supportNeeds: [] })).toBe(false);
    expect(hasAnyAnswer({ supportNeeds: ['funding'] })).toBe(true);
  });
});
