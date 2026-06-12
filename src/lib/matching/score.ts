// Stream 5 — deterministic scorer.
//
// Pure functions only. Given a `FounderNeedsProfile` and a `Program`, derive
// canonical fields (via Stream 2's normalizeProgram), apply HARD disqualifiers,
// then accumulate SOFT weighted reasons into a 0–100 score. No LLM, no I/O, no
// randomness — the same inputs always produce the same output.

import type { Program } from '../../data/programs';
import type { SupportModeId } from '../../data/taxonomy';
import { labelFor } from '../../data/taxonomy';
import { normalizeProgram } from '../normalizeProgram';
import { programSlug } from '../../data/programs';
import {
  WEIGHTS,
  STALE_DAYS,
  MAX_POSITIVE_SCORE,
  positive,
  caution,
  disqualifier,
} from './explain';
import type { FounderNeedsProfile, MatchReason, ProgramMatch } from './types';

/** Closed-ish recruiting statuses (see src/lib/status.ts STATUS keys). */
const CLOSED_STATUSES = new Set(['closed']);

/** Inject "today" for deterministic testing of freshness. Defaults to now. */
export interface ScoreOptions {
  now?: Date;
}

function lc(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase();
}

/** Canonical support modes for a program (explicit field wins, else derived). */
function programSupportModes(p: Program): SupportModeId[] {
  if (p.supportModes && p.supportModes.length > 0) return p.supportModes;
  return normalizeProgram(p).canonicalSupportModes;
}

/** Canonical founder stages a program serves (explicit stageFit ∪ derived). */
function programStages(p: Program): string[] {
  const explicit = (p.stageFit ?? []).map(String);
  const derived = normalizeProgram(p).canonicalStages.map(String);
  return [...new Set([...explicit, ...derived])];
}

/** Canonical cost/funding model for a program (explicit field wins, else derived). */
function programCostModel(p: Program): string | undefined {
  if (p.costFundingModel) return p.costFundingModel;
  return normalizeProgram(p).canonicalCostFundingModel;
}

/** Does the program provide a given support mode? */
function provides(p: Program, mode: SupportModeId): boolean {
  return programSupportModes(p).includes(mode);
}

/** Loose region match: profile region appears in country/region/ecosystem text. */
function matchesRegion(p: Program, regions: string[]): boolean {
  const hay = [lc(p.country), lc(p.region), lc(p.ecosystem)].join(' ');
  return regions.some((r) => {
    const needle = lc(r);
    return needle.length > 0 && hay.includes(needle);
  });
}

/** Loose sector match against sectorFocus[] and the free-text focus field. */
function matchesSector(p: Program, sector: string): boolean {
  const needle = lc(sector);
  if (!needle) return false;
  const tags = (p.sectorFocus ?? []).map(lc);
  if (tags.some((t) => t.includes(needle) || needle.includes(t))) return true;
  return lc(p.focus).includes(needle);
}

/** Is this program physically anchored (live-in / relocation) → relocation required? */
function requiresRelocation(p: Program): boolean {
  const fmt = lc(p.format);
  return fmt === 'live-in' || fmt === 'relocation';
}

/** Whether the program could plausibly be in the founder's current location. */
function isInLocation(p: Program, location: string): boolean {
  const needle = lc(location);
  if (!needle) return false;
  return [lc(p.country), lc(p.city), lc(p.region)].some((h) => h.includes(needle) || needle.includes(h));
}

/** Days between two dates (a - b), floored. */
function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

/**
 * Score one program against a profile. Returns a fully-explained ProgramMatch.
 * `disqualifiers` non-empty ⇒ score forced to 0.
 */
export function scoreProgram(
  profile: FounderNeedsProfile,
  program: Program,
  options: ScoreOptions = {},
): ProgramMatch {
  const now = options.now ?? new Date();
  const reasons: MatchReason[] = [];
  const cautions: MatchReason[] = [];
  const disqualifiers: MatchReason[] = [];

  // ---------------------------------------------------------------------
  // HARD DISQUALIFIERS — any one of these makes the program unrecommendable.
  // ---------------------------------------------------------------------

  // 1. Visa needed but the program offers no visa/relocation support.
  if (profile.visaNeed && !provides(program, 'visa-support')) {
    disqualifiers.push(
      disqualifier(
        'visa-not-offered',
        'You need visa / relocation support, but this program does not offer it.',
      ),
    );
  }

  // 2. Relocation required by the program but the founder is unwilling.
  if (profile.willingToRelocate === false && requiresRelocation(program)) {
    disqualifiers.push(
      disqualifier(
        'relocation-required',
        'This program requires relocating (live-in / relocation), but you indicated you cannot relocate.',
      ),
    );
  }

  // 3. Stage mismatch — the program serves explicit stages and none overlaps the
  //    founder's stage. Only fires when the program actually declares stages and
  //    the founder declared a concrete (non-unknown) stage.
  if (profile.stage && profile.stage !== 'unknown') {
    const stages = programStages(program);
    if (stages.length > 0 && !stages.includes(profile.stage)) {
      disqualifiers.push(
        disqualifier(
          'stage-mismatch',
          `This program targets ${stages.map((s) => labelFor('founderStage', s)).join(', ')}, not your stage (${labelFor('founderStage', profile.stage)}).`,
        ),
      );
    }
  }

  // 4. Equity-free-only founder but the program is an equity program.
  if (profile.equityTolerance === 'equity-free-only') {
    const cost = programCostModel(program);
    if (cost === 'equity') {
      disqualifiers.push(
        disqualifier(
          'equity-required',
          'You want equity-free options only, but this program invests in exchange for equity.',
        ),
      );
    }
  }

  // 5. Urgency apply-now but the program's cohort is closed → hard block (you
  //    cannot act now). For less urgent founders this is only a caution (below).
  const isClosed = CLOSED_STATUSES.has(lc(program.status));
  if (profile.urgency === 'apply-now' && isClosed) {
    disqualifiers.push(
      disqualifier(
        'closed-but-urgent',
        'This cohort is closed and you want to apply now — you cannot apply at the moment.',
      ),
    );
  }

  // ---------------------------------------------------------------------
  // SOFT SIGNALS — accumulate weighted positive reasons + caution penalties.
  // ---------------------------------------------------------------------

  // Support-mode overlap (repeatable: one reason per matched mode).
  if (profile.supportNeeds && profile.supportNeeds.length > 0) {
    const provided = programSupportModes(program);
    for (const need of profile.supportNeeds) {
      if (provided.includes(need)) {
        reasons.push(
          positive(
            `support:${need}`,
            `Provides ${labelFor('supportMode', need).toLowerCase()}, which you said you need.`,
            WEIGHTS.supportModeOverlap,
          ),
        );
      }
    }
  }

  // Stage fit.
  if (profile.stage && profile.stage !== 'unknown') {
    const stages = programStages(program);
    if (stages.includes(profile.stage)) {
      reasons.push(
        positive(
          'stage-fit',
          `Targets your stage (${labelFor('founderStage', profile.stage)}).`,
          WEIGHTS.stageFit,
        ),
      );
    }
  }

  // Region / ecosystem fit.
  if (profile.preferredRegions && profile.preferredRegions.length > 0) {
    if (matchesRegion(program, profile.preferredRegions)) {
      reasons.push(
        positive(
          'region-fit',
          `Located in a region you prefer (${program.country}${program.city ? `, ${program.city}` : ''}).`,
          WEIGHTS.regionFit,
        ),
      );
    }
  } else if (profile.location && !profile.willingToRelocate && isInLocation(program, profile.location)) {
    // No explicit region prefs, but staying put: reward local programs.
    reasons.push(
      positive('region-local', `Based in your location (${program.country}).`, WEIGHTS.regionFit),
    );
  }

  // Funding fit.
  if (profile.fundingNeed && provides(program, 'funding')) {
    reasons.push(positive('funding-fit', 'Provides funding / investment, which you need.', WEIGHTS.fundingFit));
  }

  // Equity preference fit (soft side of the equity axis).
  if (
    (profile.equityTolerance === 'prefer-equity-free' || profile.equityTolerance === 'equity-free-only')
  ) {
    const cost = programCostModel(program);
    if (cost === 'equity-free-grant' || cost === 'free' || cost === 'stipend') {
      reasons.push(
        positive('equity-fit', 'Non-dilutive — does not take equity, matching your preference.', WEIGHTS.equityFit),
      );
    }
  }

  // Sector fit.
  if (profile.sector && matchesSector(program, profile.sector)) {
    reasons.push(positive('sector-fit', `Focuses on your sector (${profile.sector}).`, WEIGHTS.sectorFit));
  }

  // Team-status fit.
  if (profile.teamStatus === 'seeking-cofounder' && provides(program, 'co-founder-matching')) {
    reasons.push(
      positive('team-cofounder', 'Helps you find a co-founder, which you are looking for.', WEIGHTS.teamFit),
    );
  } else if (profile.teamStatus === 'solo' && provides(program, 'community')) {
    reasons.push(
      positive('team-community', 'Offers a peer community — useful as a solo founder.', WEIGHTS.teamFit),
    );
  }

  // Visa fit (the positive counterpart; the disqualifier handled the miss).
  if (profile.visaNeed && provides(program, 'visa-support')) {
    reasons.push(positive('visa-fit', 'Offers visa / relocation support, which you need.', WEIGHTS.visaFit));
  }

  // MVP / trust biases.
  if (program.mvp === true) {
    reasons.push(positive('mvp-bias', 'Curated, launch-ready record — higher trust.', WEIGHTS.mvpBias));
  }
  if (program.verificationStatus === 'verified') {
    reasons.push(positive('verified-bias', 'Independently verified entry.', WEIGHTS.verifiedBias));
  }

  // ---------------------------------------------------------------------
  // SOFT PENALTIES — never silently recommend closed / stale / unverified.
  // ---------------------------------------------------------------------

  // Closed cohort (only a caution here; the apply-now case was disqualified).
  if (isClosed && profile.urgency !== 'apply-now') {
    cautions.push(
      caution(
        'closed',
        'This cohort is currently closed — check the site for the next cycle.',
        WEIGHTS.closedPenalty,
      ),
    );
  }

  // Stale or missing last-verified date.
  const lastVerified = program.lastVerified ? new Date(program.lastVerified) : undefined;
  const isStale =
    !lastVerified || Number.isNaN(lastVerified.getTime()) || daysBetween(now, lastVerified) > STALE_DAYS;
  if (isStale) {
    cautions.push(
      caution(
        'stale',
        program.lastVerified
          ? `Last verified ${program.lastVerified} — this entry may be out of date.`
          : 'This entry has no last-verified date — treat its details with caution.',
        WEIGHTS.stalePenalty,
      ),
    );
  }

  // Unverified / needs-review.
  if (program.verificationStatus === 'unverified' || program.verificationStatus === 'needs-review') {
    cautions.push(
      caution(
        'unverified',
        `This entry is ${program.verificationStatus} — details are not independently confirmed.`,
        WEIGHTS.unverifiedPenalty,
      ),
    );
  }

  // ---------------------------------------------------------------------
  // SCORE — normalize the weighted sum into 0–100; 0 if disqualified.
  // ---------------------------------------------------------------------
  let score = 0;
  if (disqualifiers.length === 0) {
    const positiveSum = reasons.reduce((acc, r) => acc + r.weight, 0);
    const penaltySum = cautions.reduce((acc, r) => acc + r.weight, 0); // weights are negative
    const raw = positiveSum + penaltySum;
    score = Math.max(0, Math.min(100, Math.round((raw / MAX_POSITIVE_SCORE) * 100)));
  }

  return {
    programId: programSlug(program.name),
    programName: program.name,
    score,
    reasons,
    cautions,
    disqualifiers,
    suggestedNextStep: suggestNextStep(program, { disqualified: disqualifiers.length > 0, isClosed, isStale }),
  };
}

/** Pick a single actionable next step based on the program + match flags. */
function suggestNextStep(
  program: Program,
  flags: { disqualified: boolean; isClosed: boolean; isStale: boolean },
): string {
  if (flags.disqualified) {
    return 'Likely not a fit — review the blockers before applying, or adjust your needs.';
  }
  if (flags.isClosed) {
    return `Applications are closed — open ${program.url || program.domain} and watch for the next cohort.`;
  }
  if (flags.isStale) {
    return `Verify the latest details on ${program.url || program.domain} before applying.`;
  }
  const applyTarget = program.applyUrl || program.url || program.domain;
  return applyTarget
    ? `Apply or learn more at ${applyTarget}.`
    : 'Look up the program online to find how to apply.';
}
