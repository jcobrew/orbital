import { describe, it, expect } from 'vitest';
import {
  validateProposal,
  hasUsableSource,
  touchedSensitiveFields,
  computeDiff,
  applyChanges,
  findTargetProgram,
  targetSlug,
  type ProposedProgramUpdate,
} from '../src/lib/reviewQueue';
import { buildPlan } from '../scripts/apply-updates';
import type { Program } from '../src/data/programs';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function baseProposal(over: Partial<ProposedProgramUpdate> = {}): ProposedProgramUpdate {
  return {
    schemaVersion: 1,
    id: 'test-1',
    target: { kind: 'update', name: 'Y Combinator' },
    changes: { notes: 'a harmless note' },
    sources: [],
    submitter: 'tester@example.com',
    submittedAt: '2026-06-12T00:00:00Z',
    status: 'pending',
    ...over,
  };
}

function prog(p: Partial<Program>): Program {
  return { name: 'x', dataset: 'traditional', type: 'Accelerator', ...p } as Program;
}

const PROGRAMS_FIXTURE: Program[] = [
  prog({ name: 'Y Combinator', status: 'open', status_detail: 'old detail' }),
  prog({ name: 'HF0 (Hacker Fellowship Zero)', dataset: 'residential', status: 'closed' }),
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validateProposal — shape', () => {
  it('accepts a well-formed non-sensitive proposal', () => {
    expect(validateProposal(baseProposal()).valid).toBe(true);
  });

  it('rejects an unsupported schemaVersion', () => {
    const r = validateProposal(baseProposal({ schemaVersion: 2 as 1 }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'unsupported-version')).toBe(true);
  });

  it('rejects an update proposal with no slug or name', () => {
    const r = validateProposal(baseProposal({ target: { kind: 'update' } }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.field === 'target')).toBe(true);
  });

  it('rejects a new proposal with no dataset or name', () => {
    const r = validateProposal(
      baseProposal({ target: { kind: 'new', dataset: undefined as unknown as 'residential' }, changes: {} }),
    );
    expect(r.valid).toBe(false);
  });

  it('rejects an empty changes object', () => {
    const r = validateProposal(baseProposal({ changes: {} }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'empty-changes')).toBe(true);
  });

  it('rejects a malformed source url', () => {
    const r = validateProposal(
      baseProposal({ changes: { focus: 'AI' }, sources: [{ url: 'not-a-url' }] }),
    );
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.field === 'sources')).toBe(true);
  });
});

describe('validateProposal — taxonomy', () => {
  it('rejects an invalid canonicalType', () => {
    const r = validateProposal(baseProposal({ changes: { canonicalType: 'not-a-type' } as never }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'invalid-taxonomy' && i.field === 'canonicalType')).toBe(true);
  });

  it('accepts a valid canonicalType', () => {
    const r = validateProposal(baseProposal({ changes: { canonicalType: 'accelerator' } as never }));
    expect(r.valid).toBe(true);
  });

  it('rejects an invalid supportModes id', () => {
    const r = validateProposal(baseProposal({ changes: { supportModes: ['funding', 'nope'] } as never }));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.field === 'supportModes')).toBe(true);
  });

  it('rejects an unparseable date and an invalid status', () => {
    const noDate = validateProposal(
      baseProposal({ changes: { nextCohortStart: 'someday' }, sources: [] }),
    );
    expect(noDate.valid).toBe(false);
    const badStatus = validateProposal(
      baseProposal({ changes: { status: 'totally-open' }, sources: [{ url: 'https://x.com' }] }),
    );
    expect(badStatus.valid).toBe(false);
    expect(badStatus.issues.some((i) => i.field === 'status')).toBe(true);
  });
});

describe('validateProposal — sensitive-field-source rule', () => {
  it('flags every sensitive field touched', () => {
    expect(touchedSensitiveFields({ applicationDeadline: '2026-01-01' })).toContain('applicationDeadline');
    expect(touchedSensitiveFields({ equityTaken: '7%' })).toContain('equityTaken');
    expect(touchedSensitiveFields({ country: 'Estonia' })).toContain('country');
    expect(touchedSensitiveFields({ notes: 'x' })).toHaveLength(0);
  });

  it('REJECTS a sensitive change with no source', () => {
    const r = validateProposal(
      baseProposal({ changes: { equityTaken: '5%', fundingAmount: '$150K' }, sources: [] }),
    );
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'missing-source')).toBe(true);
  });

  it('ACCEPTS the same sensitive change WITH a source', () => {
    const r = validateProposal(
      baseProposal({
        changes: { equityTaken: '5%' },
        sources: [{ url: 'https://example.com/deal' }],
      }),
    );
    expect(r.valid).toBe(true);
  });

  it('treats proposal-only "eligibility" as sensitive', () => {
    const noSrc = validateProposal(baseProposal({ changes: { eligibility: 'EU residents only' } }));
    expect(noSrc.valid).toBe(false);
    const withSrc = validateProposal(
      baseProposal({ changes: { eligibility: 'EU residents only' }, sources: [{ url: 'https://eu.example' }] }),
    );
    expect(withSrc.valid).toBe(true);
  });

  it('hasUsableSource ignores entries without a valid url', () => {
    expect(hasUsableSource(baseProposal({ sources: [{ url: '' }] }))).toBe(false);
    expect(hasUsableSource(baseProposal({ sources: [{ url: 'https://ok.com' }] }))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Diff / merge / matching
// ---------------------------------------------------------------------------

describe('diff + merge helpers', () => {
  it('targetSlug resolves slug from name', () => {
    expect(targetSlug(baseProposal({ target: { kind: 'update', name: 'Y Combinator' } }))).toBe('y-combinator');
    expect(targetSlug(baseProposal({ target: { kind: 'new', dataset: 'traditional' } }))).toBeUndefined();
  });

  it('findTargetProgram matches by slug', () => {
    const found = findTargetProgram(baseProposal({ target: { kind: 'update', name: 'Y Combinator' } }), PROGRAMS_FIXTURE);
    expect(found?.name).toBe('Y Combinator');
  });

  it('computeDiff returns only changed fields', () => {
    const existing = prog({ name: 'Y Combinator', status: 'open', status_detail: 'old detail' });
    const diff = computeDiff({ status_detail: 'new detail', status: 'open' }, existing);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toMatchObject({ field: 'status_detail', before: 'old detail', after: 'new detail' });
  });

  it('applyChanges is a non-destructive shallow merge', () => {
    const existing = prog({ name: 'YC', status: 'closed' });
    const merged = applyChanges({ status: 'open' }, existing);
    expect(merged.status).toBe('open');
    expect(merged.name).toBe('YC');
    expect(existing.status).toBe('closed'); // original untouched
  });
});

// ---------------------------------------------------------------------------
// buildPlan — approved-only application + dry-run safety
// ---------------------------------------------------------------------------

describe('buildPlan (apply-updates planning)', () => {
  it('plans an apply for a valid approved proposal with a real diff', () => {
    const plan = buildPlan(
      [
        {
          file: 'a.json',
          proposal: baseProposal({
            id: 'yc-detail',
            status: 'approved',
            changes: { status_detail: 'fresh detail' },
            sources: [{ url: 'https://ycombinator.com/deal' }],
          }),
        },
      ],
      PROGRAMS_FIXTURE,
    );
    expect(plan).toHaveLength(1);
    expect(plan[0].status).toBe('apply');
    expect(plan[0].action).toBe('updated');
    expect(plan[0].diff?.[0].field).toBe('status_detail');
  });

  it('skips a proposal whose status is not approved (defence in depth)', () => {
    const plan = buildPlan(
      [{ file: 'p.json', proposal: baseProposal({ status: 'pending', changes: { status_detail: 'x' } }) }],
      PROGRAMS_FIXTURE,
    );
    expect(plan[0].status).toBe('skip-not-approved');
  });

  it('skips an approved-but-invalid proposal (sensitive change, no source)', () => {
    const plan = buildPlan(
      [
        {
          file: 'bad.json',
          proposal: baseProposal({
            id: 'bad',
            status: 'approved',
            changes: { equityTaken: '5%' },
            sources: [],
          }),
        },
      ],
      PROGRAMS_FIXTURE,
    );
    expect(plan[0].status).toBe('skip-invalid');
    expect(plan[0].issues?.some((m) => /source/i.test(m))).toBe(true);
  });

  it('reports a no-op when the approved change matches current data', () => {
    const plan = buildPlan(
      [
        {
          file: 'noop.json',
          proposal: baseProposal({
            id: 'noop',
            status: 'approved',
            changes: { status: 'open' }, // already open, with a source so it validates
            sources: [{ url: 'https://x.com' }],
          }),
        },
      ],
      PROGRAMS_FIXTURE,
    );
    expect(plan[0].status).toBe('no-op');
  });

  it('plans a create for a new-program proposal', () => {
    const plan = buildPlan(
      [
        {
          file: 'new.json',
          proposal: baseProposal({
            id: 'new-prog',
            status: 'approved',
            target: { kind: 'new', dataset: 'traditional' },
            changes: { name: 'Brand New Accelerator', type: 'Accelerator' },
          }),
        },
      ],
      PROGRAMS_FIXTURE,
    );
    expect(plan[0].status).toBe('apply');
    expect(plan[0].action).toBe('created');
    expect(plan[0].dataset).toBe('traditional');
  });
});
