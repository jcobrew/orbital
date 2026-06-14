// Stream 4 — Provenance / source model.
//
// First-class source + trust objects, linked to programs EXTERNALLY by program
// slug (see `programSlug` in ./programs). This stream does NOT edit the
// `Program` type; instead it keys provenance off the slug so a program can carry
// richer provenance without touching its source-of-truth record.
//
// This is additive: programs without any SourceRecord here keep rendering with
// their existing `sourceUrls` / `lastVerified` fields untouched.

import { type VerificationStatus } from './programs';

// Re-export the existing verification enum so consumers can import provenance
// shape + verification status from one place. (Additive; no new source of truth.)
export type { VerificationStatus } from './programs';

/** What kind of artefact a source is. Drives how much weight we give it. */
export type SourceKind =
  | 'official' // the program's own site / application page
  | 'official-social' // the program's own verified social account / newsletter
  | 'press' // reputable third-party reporting
  | 'aggregator' // directories (F6S, Crunchbase, …) — weaker
  | 'community' // forums, word-of-mouth — weakest
  | 'sample'; // clearly-marked placeholder, not a real citation

/**
 * Trust level for a piece of provenance. Distinct from `VerificationStatus`
 * (which describes whether a *record* was reviewed): `TrustStatus` describes how
 * much we trust the *source* behind a particular fact.
 */
export type TrustStatus =
  | 'trusted' // official / primary source, recently retrieved
  | 'reported' // credible secondary source
  | 'unverified' // weak/aggregator/community source, or never confirmed
  | 'sample'; // placeholder data, never to be presented as fact

/** A single citation backing a program's facts. */
export interface SourceRecord {
  /** Canonical URL of the source. */
  url: string;
  /** Human-readable title of the page/article. */
  title: string;
  /** Who published it (e.g. "Y Combinator", "TechCrunch"). */
  publisher?: string;
  /** ISO date (YYYY-MM-DD) the source was retrieved/checked. */
  retrievedAt?: string;
  /** What kind of source this is. */
  kind: SourceKind;
  /** How much we trust it. */
  trust: TrustStatus;
  /** Optional short note about what this source backs. */
  note?: string;
}

/** Provenance bundle for one program, keyed by program slug. */
export interface ProgramProvenance {
  programSlug: string;
  sources: SourceRecord[];
  /** Optional record-level verification status override / restatement. */
  verificationStatus?: VerificationStatus;
}

/**
 * Sample provenance for a few MVP-relevant programs already in the dataset.
 * Slugs verified against the live JSON (see programSlug). Real official URLs are
 * cited; sample/illustrative entries are explicitly marked `kind: 'sample'`.
 */
export const PROGRAM_SOURCES: Record<string, ProgramProvenance> = {
  'y-combinator': {
    programSlug: 'y-combinator',
    verificationStatus: 'verified',
    sources: [
      {
        url: 'https://www.ycombinator.com/apply',
        title: 'Apply to Y Combinator',
        publisher: 'Y Combinator',
        retrievedAt: '2026-06-10',
        kind: 'official',
        trust: 'trusted',
        note: 'Official application page — batch dates and deadlines.',
      },
    ],
  },
  'entrepreneur-first-ef': {
    programSlug: 'entrepreneur-first-ef',
    verificationStatus: 'verified',
    sources: [
      {
        url: 'https://www.joinef.com/apply/',
        title: 'Apply — Entrepreneur First',
        publisher: 'Entrepreneur First',
        retrievedAt: '2026-06-10',
        kind: 'official',
        trust: 'trusted',
      },
    ],
  },
  'south-park-commons': {
    programSlug: 'south-park-commons',
    verificationStatus: 'verified',
    sources: [
      {
        url: 'https://www.southparkcommons.com/founder-fellowship',
        title: 'Founder Fellowship — South Park Commons',
        publisher: 'South Park Commons',
        retrievedAt: '2026-06-10',
        kind: 'official',
        trust: 'trusted',
        note: 'Fellowship cohorts open ahead of each intake.',
      },
    ],
  },
  'startup-wise-guys': {
    programSlug: 'startup-wise-guys',
    sources: [
      {
        url: 'https://startupwiseguys.com/accelerator-programs/',
        title: 'Accelerator programs — Startup Wise Guys',
        publisher: 'Startup Wise Guys',
        retrievedAt: '2026-06-10',
        kind: 'official',
        trust: 'trusted',
      },
      {
        url: 'https://example.com/swg-cohort-note',
        title: 'Illustrative cohort note (sample data)',
        publisher: 'Orbital (sample)',
        kind: 'sample',
        trust: 'sample',
        note: 'Placeholder — replace with a real citation before launch.',
      },
    ],
  },
};

/** Look up provenance for a program by slug. Returns undefined when absent. */
export function provenanceForSlug(slug: string): ProgramProvenance | undefined {
  return PROGRAM_SOURCES[slug];
}
