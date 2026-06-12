// Stream 8 — Review Queue for Proposed Updates.
//
// The `ProposedProgramUpdate` model is the structured, on-disk record for a
// staged change to the program datasets. It lives BESIDE the existing prefilled
// GitHub-issue submission flow (`src/lib/submit.ts`) — it does not replace it.
//
// Lifecycle (see data/review-queue/README.md):
//   pending/  → a freshly captured proposal, untouched by automation.
//   approved/ → a human reviewer moved it here; ONLY these are ever applied.
//   rejected/ → declined; kept for the audit trail, never applied.
//
// Nothing in this module mutates the datasets; it only describes + validates
// proposals. Application is done — dry-run by default — by
// `scripts/apply-updates.ts`.

import type { Program } from '../../data/programs';

/** Proposal status. Only `approved` items are ever applied. */
export type ProposalStatus = 'pending' | 'approved' | 'rejected';

/** Which physical dataset a `new` program would be written to. */
export type TargetDataset = 'residential' | 'traditional';

/**
 * A single source backing a proposed change. At least one is required whenever
 * the proposal touches a sensitive field (see `SENSITIVE_FIELDS`).
 */
export interface ProposalSource {
  /** The URL backing the claim (primary source preferred). */
  url: string;
  /** Optional human label / publisher. */
  title?: string;
  /** Optional ISO date the source was checked. */
  retrievedAt?: string;
}

/**
 * The fields a proposal may change. This is the subset of `Program` that a
 * proposal is allowed to set — identity/location/application/cost/provenance
 * descriptors. Lat/lng and the merge-only `dataset` discriminator are derived,
 * not proposed directly (a `new` proposal names its target dataset separately).
 */
export type ProposableProgramFields = Partial<
  Omit<Program, 'dataset' | 'lat' | 'lng'>
> & {
  // lat/lng MAY be proposed for a brand-new program, but are optional.
  lat?: number;
  lng?: number;
  /**
   * Eligibility notes. Not a first-class `Program` field today (eligibility
   * lives in free text), but it is a named sensitive field in the MVP plan, so
   * a proposal may carry it explicitly. Treated as sensitive (requires source).
   */
  eligibility?: string;
};

export interface ProposedProgramUpdate {
  /** Schema version, so the apply script can refuse formats it doesn't know. */
  schemaVersion: 1;

  /** Stable id for this proposal (used in filenames + the audit log). */
  id: string;

  /**
   * What this proposal targets:
   *   - 'new'  → create a brand-new program record.
   *   - { slug } / { name } → update an existing program, matched by
   *     `programSlug(name)` (slug) or exact name.
   */
  target: { kind: 'new'; dataset: TargetDataset } | { kind: 'update'; slug?: string; name?: string };

  /** The proposed field values (a full record for `new`, a partial for updates). */
  changes: ProposableProgramFields;

  /** Sources backing the change. Required for sensitive-field changes. */
  sources: ProposalSource[];

  /** Who proposed it (email, handle, or "agent:<name>"). */
  submitter: string;

  /** ISO timestamp the proposal was captured. */
  submittedAt: string;

  /** Lifecycle status. Derived from the directory too, but stored for clarity. */
  status: ProposalStatus;

  /** Free-text reason / context for the change. */
  rationale?: string;

  /** Optional reviewer note (set when approving/rejecting). */
  reviewNote?: string;
}

/**
 * Fields whose change REQUIRES at least one source (MVP plan, Stream 8):
 * deadline · application status · equity · funding amount · eligibility ·
 * visa support · cost · location · program status.
 *
 * Mapped onto concrete `Program` field names (location = country/city;
 * eligibility lives in `notes`/`focus`-adjacent free text, captured here as the
 * dedicated optional fields a proposal can carry).
 */
export const SENSITIVE_FIELDS = [
  'applicationDeadline', // deadline
  'status', // application/program status
  'status_detail',
  'equityTaken', // equity
  'fundingAmount', // funding amount
  'cost', // cost
  'providesVisaSupport', // visa support
  'country', // location
  'city', // location
  'eligibility', // eligibility notes (proposal-only field, see below)
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/** A validation problem found on a proposal. */
export interface ValidationIssue {
  /** Machine code, e.g. 'missing-source', 'invalid-taxonomy', 'malformed'. */
  code: string;
  /** Which field (when field-specific). */
  field?: string;
  /** Human-readable message. */
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/** A single applied-change record in the audit trail. */
export interface AuditEntry {
  appliedAt: string;
  proposalId: string;
  target: ProposedProgramUpdate['target'];
  submitter: string;
  /** Field-level before/after for an update; full record for a create. */
  diff: FieldChange[];
  /** 'created' | 'updated'. */
  action: 'created' | 'updated';
  /** Dataset file the change was written to. */
  dataset: TargetDataset;
  /** Program name (resolved). */
  programName: string;
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}
