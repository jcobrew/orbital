// Stream 6 — Founder Discovery UI.
//
// Pure (no React, no DOM) helpers that bridge the guided-intake *answers* and the
// engine's `FounderNeedsProfile`, plus URL <-> answers serialization for shareable
// links. Keeping this logic here (not in the React island) means it is unit-testable
// and the page can stay deterministic.

import type {
  FounderNeedsProfile,
  Urgency,
  TeamStatus,
  EquityTolerance,
} from '../../lib/matching';
import type { FounderStageId, SupportModeId } from '../../data/taxonomy';

/**
 * The raw, UI-facing answers collected by the guided flow. Every field is optional
 * so a partially-completed flow still produces a (looser) profile — mirroring the
 * engine's graceful-degradation contract.
 */
export interface IntakeAnswers {
  /** Q1: current founder stage. */
  stage?: FounderStageId;
  /** Q2: solo / team / seeking co-founder. */
  teamStatus?: TeamStatus;
  /** Q3/Q4: concrete support modes wanted (taxonomy supportMode IDs). */
  supportNeeds?: SupportModeId[];
  /** Q5: willing to physically relocate? (undefined = no preference) */
  willingToRelocate?: boolean;
  /** Q6: preferred regions / ecosystems (region option IDs, see REGION_OPTIONS). */
  regions?: string[];
  /** Q7: urgency. */
  urgency?: Urgency;
  /** Q8: equity-free preference. */
  equityTolerance?: EquityTolerance;
}

/**
 * Region options the founder picks in Q6. Each maps to one or more substrings the
 * engine matches (case-insensitively) against a program's country / region /
 * `ecosystem` tag. The match strings cover the live ecosystem tags in the dataset
 * (finland-nordics, estonia, europe-wide, uk, us-global-remote) plus the obvious
 * country spellings, so the loose substring matcher in the engine lands hits.
 */
export const REGION_OPTIONS: { id: string; label: string; match: string[] }[] = [
  { id: 'finland-nordics', label: 'Finland & Nordics', match: ['finland-nordics', 'finland', 'sweden', 'norway', 'denmark', 'nordic'] },
  { id: 'estonia', label: 'Estonia & Baltics', match: ['estonia', 'baltic', 'latvia', 'lithuania'] },
  { id: 'europe-wide', label: 'Europe-wide', match: ['europe-wide', 'europe', 'germany', 'france', 'netherlands', 'spain', 'portugal'] },
  { id: 'uk', label: 'United Kingdom', match: ['uk', 'united kingdom', 'england', 'london', 'britain'] },
  { id: 'us-global-remote', label: 'US / global / remote', match: ['us-global-remote', 'united states', 'usa', 'remote', 'global'] },
];

const REGION_BY_ID = new Map(REGION_OPTIONS.map((r) => [r.id, r]));

/** Expand selected region option IDs into the substrings the engine matches on. */
export function regionsToMatchTerms(ids: string[] | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  const out: string[] = [];
  for (const id of ids) {
    const opt = REGION_BY_ID.get(id);
    if (opt) out.push(...opt.match);
  }
  return [...new Set(out)];
}

/**
 * Convert UI answers into the engine's `FounderNeedsProfile`.
 *
 * Notable derivations:
 *  - `fundingNeed` is inferred from whether "funding" is among the support needs.
 *  - `visaNeed` is inferred from whether "visa-support" is among the support needs.
 *    (These two are hard levers in the engine, so we surface them explicitly.)
 *  - `preferredRegions` are expanded to the engine's substring match terms.
 */
export function answersToProfile(a: IntakeAnswers): FounderNeedsProfile {
  const supportNeeds = a.supportNeeds && a.supportNeeds.length > 0 ? a.supportNeeds : undefined;
  const profile: FounderNeedsProfile = {};

  if (a.stage) profile.stage = a.stage;
  if (a.teamStatus) profile.teamStatus = a.teamStatus;
  if (supportNeeds) profile.supportNeeds = supportNeeds;
  if (typeof a.willingToRelocate === 'boolean') profile.willingToRelocate = a.willingToRelocate;

  const regionTerms = regionsToMatchTerms(a.regions);
  if (regionTerms.length > 0) profile.preferredRegions = regionTerms;

  if (a.urgency) profile.urgency = a.urgency;
  if (a.equityTolerance) profile.equityTolerance = a.equityTolerance;

  if (supportNeeds?.includes('funding')) profile.fundingNeed = true;
  if (supportNeeds?.includes('visa-support')) profile.visaNeed = true;

  return profile;
}

// ---------------------------------------------------------------------------
// URL <-> answers serialization (shareable deep links).
//
// Mirrors the explore/filters contract (`src/stores/filters.ts`): omit defaults,
// keep keys short + stable, store the raw region *option IDs* (not the expanded
// match terms) so the UI can re-select chips on load. Comma-joined for arrays.
// ---------------------------------------------------------------------------

const URGENCIES: Urgency[] = ['apply-now', 'three-months', 'this-year', 'exploring'];
const TEAM_STATUSES: TeamStatus[] = ['solo', 'team', 'seeking-cofounder'];
const EQUITY_TOLERANCES: EquityTolerance[] = ['equity-free-only', 'prefer-equity-free', 'open'];
const STAGE_IDS: FounderStageId[] = [
  'pre-idea', 'idea', 'pre-product', 'mvp', 'pre-seed', 'seed',
  'series-a-plus', 'repeat-founder', 'student', 'researcher', 'unknown',
];
const SUPPORT_IDS: SupportModeId[] = [
  'funding', 'housing', 'workspace', 'mentorship', 'investor-access', 'demo-day',
  'visa-support', 'community', 'co-founder-matching', 'customers', 'structure',
  'compute-credits', 'lab-access', 'legal-admin',
];

function csv(value: string | null): string[] {
  return (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

/** Parse a query string into intake answers (ignoring unknown / malformed values). */
export function answersFromQuery(search: string): IntakeAnswers {
  const u = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const a: IntakeAnswers = {};

  const stage = u.get('stage');
  if (stage && STAGE_IDS.includes(stage as FounderStageId)) a.stage = stage as FounderStageId;

  const team = u.get('team');
  if (team && TEAM_STATUSES.includes(team as TeamStatus)) a.teamStatus = team as TeamStatus;

  const needs = csv(u.get('needs')).filter((n): n is SupportModeId => SUPPORT_IDS.includes(n as SupportModeId));
  if (needs.length > 0) a.supportNeeds = needs;

  const relocate = u.get('relocate');
  if (relocate === 'yes') a.willingToRelocate = true;
  else if (relocate === 'no') a.willingToRelocate = false;

  const regions = csv(u.get('regions')).filter((r) => REGION_BY_ID.has(r));
  if (regions.length > 0) a.regions = regions;

  const urgency = u.get('urgency');
  if (urgency && URGENCIES.includes(urgency as Urgency)) a.urgency = urgency as Urgency;

  const equity = u.get('equity');
  if (equity && EQUITY_TOLERANCES.includes(equity as EquityTolerance)) a.equityTolerance = equity as EquityTolerance;

  return a;
}

/** Serialize intake answers into a query string (omitting empties), e.g. for shareable links. */
export function answersToQuery(a: IntakeAnswers): string {
  const u = new URLSearchParams();
  if (a.stage) u.set('stage', a.stage);
  if (a.teamStatus) u.set('team', a.teamStatus);
  if (a.supportNeeds && a.supportNeeds.length > 0) u.set('needs', a.supportNeeds.join(','));
  if (typeof a.willingToRelocate === 'boolean') u.set('relocate', a.willingToRelocate ? 'yes' : 'no');
  if (a.regions && a.regions.length > 0) u.set('regions', a.regions.join(','));
  if (a.urgency) u.set('urgency', a.urgency);
  if (a.equityTolerance) u.set('equity', a.equityTolerance);
  return u.toString();
}

/** True when the founder has answered at least one question (so we can run matching). */
export function hasAnyAnswer(a: IntakeAnswers): boolean {
  return Boolean(
    a.stage ||
      a.teamStatus ||
      (a.supportNeeds && a.supportNeeds.length > 0) ||
      typeof a.willingToRelocate === 'boolean' ||
      (a.regions && a.regions.length > 0) ||
      a.urgency ||
      a.equityTolerance,
  );
}
