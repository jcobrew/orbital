// Stream 5 — public API for the deterministic founder-needs matching engine.
//
// Consumers (Stream 6 UI, Stream 9 exports) should import from this module only.
// Everything is pure and deterministic: no LLM, no network, no global state.

import type { Program } from '../../data/programs';
import { scoreProgram, type ScoreOptions } from './score';
import type { FounderNeedsProfile, ProgramMatch } from './types';

export type {
  FounderNeedsProfile,
  ProgramMatch,
  MatchReason,
  ReasonKind,
  Urgency,
  TeamStatus,
  EquityTolerance,
} from './types';
export { scoreProgram } from './score';
export type { ScoreOptions } from './score';
export { WEIGHTS, STALE_DAYS, MAX_POSITIVE_SCORE } from './explain';

export interface MatchOptions extends ScoreOptions {
  /**
   * When true, disqualified programs are dropped from the result entirely.
   * When false (default), they are returned at the end (score 0) so the UI can
   * still explain *why* they were excluded.
   */
  excludeDisqualified?: boolean;
  /** Cap the number of returned matches (after ranking). */
  limit?: number;
}

/**
 * Score every program against the profile and return them ranked best-first.
 *
 * Deterministic ordering: by score desc, then disqualified-last, then by name
 * (so ties are stable and reproducible).
 */
export function matchPrograms(
  profile: FounderNeedsProfile,
  programs: Program[],
  options: MatchOptions = {},
): ProgramMatch[] {
  let matches = programs.map((p) => scoreProgram(profile, p, options));

  if (options.excludeDisqualified) {
    matches = matches.filter((m) => m.disqualifiers.length === 0);
  }

  matches.sort((a, b) => {
    const aDq = a.disqualifiers.length > 0 ? 1 : 0;
    const bDq = b.disqualifiers.length > 0 ? 1 : 0;
    if (aDq !== bDq) return aDq - bDq; // non-disqualified first
    if (b.score !== a.score) return b.score - a.score; // higher score first
    return a.programName.localeCompare(b.programName); // stable tiebreak
  });

  if (typeof options.limit === 'number') {
    matches = matches.slice(0, Math.max(0, options.limit));
  }

  return matches;
}
