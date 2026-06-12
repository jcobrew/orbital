// Stream 5 — explanation strings + weight constants for the matching engine.
//
// All scoring weights live here as a single explicit, documented table (mirrored
// in `docs/founder-matching.md`). Nothing in this module is fuzzy or learned —
// every number is a hand-set constant so a reviewer can audit exactly why a
// program scored the way it did. `score.ts` consumes `WEIGHTS` and these
// builders; it never invents weights of its own.

import type { MatchReason } from './types';

/**
 * Explicit soft-scoring weights. Positive numbers reward fit; negative numbers
 * penalize. The raw weighted sum is later normalized to a 0–100 score against
 * `MAX_POSITIVE_SCORE` (the sum of all positive weights a program could earn).
 *
 * Keep this object the SINGLE source of truth — `docs/founder-matching.md`
 * documents the same values; tests assert against them.
 */
export const WEIGHTS = {
  /** Each founder-requested support mode the program actually provides. */
  supportModeOverlap: 12,
  /** Program's stage focus includes the founder's stage. */
  stageFit: 14,
  /** Program is in / near one of the founder's preferred regions. */
  regionFit: 10,
  /** Founder needs funding and the program provides it. */
  fundingFit: 8,
  /** Equity preference satisfied (equity-free founder → non-dilutive program). */
  equityFit: 6,
  /** Sector overlap between founder and program. */
  sectorFit: 6,
  /** Team-status fit (e.g. seeking-cofounder → co-founder-matching program). */
  teamFit: 6,
  /** Visa need satisfied by a program that offers visa/relocation support. */
  visaFit: 8,
  /** Curated, launch-ready MVP record — a trust/quality bias. */
  mvpBias: 5,
  /** Program is verified (provenance quality bias). */
  verifiedBias: 3,

  // ---- Soft penalties (negative) ----
  /** Program's recruiting status is closed (caution, not a hard block unless urgent). */
  closedPenalty: -10,
  /** Last-verified date is stale (> STALE_DAYS old) or missing. */
  stalePenalty: -6,
  /** Program is unverified / needs-review. */
  unverifiedPenalty: -8,
} as const;

export type WeightKey = keyof typeof WEIGHTS;

/** Records older than this many days are treated as stale. */
export const STALE_DAYS = 365;

/**
 * Sum of every positive weight a program could earn. Used to normalize the raw
 * weighted score into a 0–100 range. Support-mode overlap can be earned multiple
 * times, so we count it once for normalization (a program that hits every other
 * positive lever plus at least one support mode already lands near the top).
 */
export const MAX_POSITIVE_SCORE =
  WEIGHTS.supportModeOverlap +
  WEIGHTS.stageFit +
  WEIGHTS.regionFit +
  WEIGHTS.fundingFit +
  WEIGHTS.equityFit +
  WEIGHTS.sectorFit +
  WEIGHTS.teamFit +
  WEIGHTS.visaFit +
  WEIGHTS.mvpBias +
  WEIGHTS.verifiedBias;

// ---------------------------------------------------------------------------
// Reason builders. Each returns a fully-formed MatchReason so prose lives in one
// place and tests can assert on stable `code`s rather than fragile strings.
// ---------------------------------------------------------------------------

export function positive(code: string, text: string, weight: number): MatchReason {
  return { kind: 'positive', code, text, weight };
}

export function caution(code: string, text: string, weight: number): MatchReason {
  return { kind: 'caution', code, text, weight };
}

export function disqualifier(code: string, text: string): MatchReason {
  return { kind: 'disqualifier', code, text, weight: 0 };
}
