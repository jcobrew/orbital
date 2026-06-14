// Stream 5 — Founder Needs & Deterministic Matching Engine.
//
// Type definitions for the matching engine. These describe the *input*
// (`FounderNeedsProfile`) gathered by the guided-intake flow (plan §3) and the
// *output* (`ProgramMatch`) that the discovery UI (Stream 6) and agent surfaces
// (Stream 9) render. Everything here is plain data — no LLM, no I/O.

import type {
  CostFundingModelId,
  FounderStageId,
  SupportModeId,
} from '../../data/taxonomy';

/**
 * How soon the founder wants to act. Drives whether a closed / unknown-status
 * program is a hard blocker (apply-now) or merely a caution (exploring).
 */
export type Urgency = 'apply-now' | 'three-months' | 'this-year' | 'exploring';

/** Whether the founder is solo, in a team, or actively seeking a co-founder. */
export type TeamStatus = 'solo' | 'team' | 'seeking-cofounder';

/** How much equity dilution the founder will accept. */
export type EquityTolerance =
  | 'equity-free-only' // refuses to give equity → equity programs are disqualified
  | 'prefer-equity-free' // tolerates equity but prefers non-dilutive (soft signal)
  | 'open'; // no preference

/**
 * A founder's self-described situation. Every field is optional so the engine
 * degrades gracefully when the guided flow is partially completed — an absent
 * field simply imposes no constraint and contributes no score.
 */
export interface FounderNeedsProfile {
  /** Guided-intake Q1: current founder stage. */
  stage?: FounderStageId;
  /** Where the founder is based today (country string, matched loosely). */
  location?: string;
  /** Guided-intake Q5: willing to physically relocate for a program? */
  willingToRelocate?: boolean;
  /**
   * Guided-intake Q6: preferred regions / ecosystems. Matched against a
   * program's country, region, and `ecosystem` tag (case-insensitive substring).
   */
  preferredRegions?: string[];
  /** Sector / industry focus (e.g. "AI", "climate"), matched against sectorFocus + focus. */
  sector?: string;
  /** Guided-intake Q2: solo, in a team, or looking for a co-founder. */
  teamStatus?: TeamStatus;
  /** Does the founder need funding / capital? Drives funding-support fit. */
  fundingNeed?: boolean;
  /** Guided-intake Q8: equity tolerance. */
  equityTolerance?: EquityTolerance;
  /**
   * Guided-intake Q3/Q4: concrete support modes the founder wants
   * (taxonomy `supportMode` IDs, e.g. "funding", "community", "co-founder-matching").
   */
  supportNeeds?: SupportModeId[];
  /** Does the founder need visa / relocation support to participate? */
  visaNeed?: boolean;
  /** Guided-intake Q7: urgency. */
  urgency?: Urgency;
}

/** Category of an explanation line, so the UI can style each consistently. */
export type ReasonKind = 'positive' | 'caution' | 'disqualifier';

/** A single explanation line attached to a match. */
export interface MatchReason {
  kind: ReasonKind;
  /** Stable code so consumers can localize / test without string-matching prose. */
  code: string;
  /** Human-readable sentence. */
  text: string;
  /** Signed contribution to the soft score (0 for disqualifiers / pure flags). */
  weight: number;
}

/**
 * The result of scoring one program against a profile.
 *
 * `disqualifiers` is non-empty ⇒ the program is a hard mismatch and `score` is
 * forced to 0; consumers should not recommend it (but may still show *why*).
 */
export interface ProgramMatch {
  /** Stable program identifier (its slug). */
  programId: string;
  /** Program display name, for convenience in UIs/exports. */
  programName: string;
  /** Soft score in [0, 100]; 0 when disqualified. Higher = better fit. */
  score: number;
  /** Positive fit reasons (why this is a good match). */
  reasons: MatchReason[];
  /** Caution reasons (proceed, but be aware — stale data, closed cohort, …). */
  cautions: MatchReason[];
  /** Hard disqualifiers (why this should not be recommended). */
  disqualifiers: MatchReason[];
  /** A single actionable next step string. */
  suggestedNextStep: string;
}
