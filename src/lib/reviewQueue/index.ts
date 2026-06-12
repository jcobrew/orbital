// Stream 8 — Review-queue public surface.
//
// Pure helpers for loading proposals from the on-disk queue, matching them to
// live program records, computing the field-level diff a proposal would make,
// and producing the merged record. None of these helpers write anything — the
// only writer is `scripts/apply-updates.ts`, and only under `--apply`.

import { programSlug, type Program } from '../../data/programs';
import type {
  ProposedProgramUpdate,
  ProposableProgramFields,
  FieldChange,
  TargetDataset,
} from './types';

export * from './types';
export {
  validateProposal,
  hasUsableSource,
  touchedSensitiveFields,
} from './validate';

/** Resolve the slug a proposal targets (for update proposals). */
export function targetSlug(proposal: ProposedProgramUpdate): string | undefined {
  if (proposal.target.kind !== 'update') return undefined;
  if (proposal.target.slug) return proposal.target.slug;
  if (proposal.target.name) return programSlug(proposal.target.name);
  return undefined;
}

/**
 * Find the live program a proposal targets. Returns undefined for `new`
 * proposals or when no existing record matches.
 */
export function findTargetProgram(
  proposal: ProposedProgramUpdate,
  programs: ReadonlyArray<Program>,
): Program | undefined {
  const slug = targetSlug(proposal);
  if (!slug) return undefined;
  return programs.find((p) => programSlug(p.name) === slug);
}

/** Shallow value-equality good enough for diffing JSON-serialisable fields. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => sameValue(v, b[i]));
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compute the field-level diff a proposal's `changes` would make against an
 * existing record (or against `{}` for a brand-new program). Only fields whose
 * value actually changes are returned.
 */
export function computeDiff(
  changes: ProposableProgramFields,
  existing: Partial<Program> | undefined,
): FieldChange[] {
  const base = (existing ?? {}) as Record<string, unknown>;
  const out: FieldChange[] = [];
  for (const [field, after] of Object.entries(changes)) {
    const before = base[field];
    if (!sameValue(before, after)) {
      out.push({ field, before, after });
    }
  }
  return out;
}

/**
 * Produce the merged record a proposal would yield. Non-destructive: returns a
 * fresh object, applying only the proposed fields on top of the existing one.
 */
export function applyChanges(
  changes: ProposableProgramFields,
  existing: Partial<Program> | undefined,
): Record<string, unknown> {
  return { ...(existing ?? {}), ...changes };
}

/** Which dataset file a proposal writes to. */
export function targetDataset(
  proposal: ProposedProgramUpdate,
  existing: Program | undefined,
): TargetDataset {
  if (proposal.target.kind === 'new') return proposal.target.dataset;
  return (existing?.dataset as TargetDataset) ?? 'traditional';
}
