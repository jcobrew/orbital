// Stream 8 — Proposed-update validation.
//
// Validates a `ProposedProgramUpdate` against:
//   1. structural shape (well-formed proposal object),
//   2. the Stream 2 canonical taxonomy/schema (changed enum/canonical fields
//      must carry valid IDs), and
//   3. the sensitive-field-source rule (deadline, application status, equity,
//      funding amount, eligibility, visa support, cost, location, program
//      status all REQUIRE at least one source on the proposal).
//
// Pure + side-effect-free so the apply script and the test suite share it.

import {
  isProgramTypeId,
  PROGRAM_TYPE_IDS,
  SUPPORT_MODES,
  FOUNDER_STAGES,
  INTAKE_METHODS,
  INTAKE_FREQUENCIES,
  COST_FUNDING_MODELS,
} from '../../data/taxonomy';
import { STATUS } from '../status';
import type {
  ProposedProgramUpdate,
  ValidationIssue,
  ValidationResult,
  ProposableProgramFields,
} from './types';
import { SENSITIVE_FIELDS } from './types';

const VALID_FORMATS = new Set([
  'in-person',
  'remote',
  'hybrid',
  'live-in',
  'relocation',
  'unknown',
]);
const VALID_VERIFICATION = new Set(['verified', 'needs-review', 'unverified']);
const VALID_STATUS = new Set(Object.keys(STATUS));

const supportModeIds = new Set(SUPPORT_MODES.map((e) => e.id));
const founderStageIds = new Set(FOUNDER_STAGES.map((e) => e.id));
const intakeMethodIds = new Set(INTAKE_METHODS.map((e) => e.id));
const intakeFrequencyIds = new Set(INTAKE_FREQUENCIES.map((e) => e.id));
const costFundingIds = new Set(COST_FUNDING_MODELS.map((e) => e.id));

/** True when a string looks like an http(s) URL. */
function looksLikeUrl(s: unknown): boolean {
  return typeof s === 'string' && /^https?:\/\/\S+$/i.test(s.trim());
}

/** True when a value is a non-empty ISO-ish date string. */
function looksLikeIsoDate(s: unknown): boolean {
  if (typeof s !== 'string' || !s.trim()) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/** Does the proposal carry at least one usable source? */
export function hasUsableSource(proposal: ProposedProgramUpdate): boolean {
  return (
    Array.isArray(proposal.sources) &&
    proposal.sources.some((s) => s && looksLikeUrl(s.url))
  );
}

/** Which sensitive fields does this set of changes touch? */
export function touchedSensitiveFields(changes: ProposableProgramFields): string[] {
  return SENSITIVE_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(changes, f));
}

/**
 * Validate the canonical/enum field values in a change set against the Stream 2
 * taxonomy. Pushes an issue per invalid value. (Free-text fields like `name`,
 * `focus`, `notes` are intentionally unconstrained.)
 */
function validateTaxonomy(changes: ProposableProgramFields, issues: ValidationIssue[]): void {
  const c = changes as Record<string, unknown>;

  if ('type' in c && typeof c.type === 'string') {
    // Legacy free-text `type` is allowed, but must be canonicalizable. We accept
    // either a canonical id OR any non-empty free text (normalizeProgram maps it
    // at read time). We only reject an empty string here.
    if (!c.type.trim()) {
      issues.push({ code: 'malformed', field: 'type', message: 'type must not be empty.' });
    }
  }

  if ('canonicalType' in c && typeof c.canonicalType === 'string') {
    if (!isProgramTypeId(c.canonicalType)) {
      issues.push({
        code: 'invalid-taxonomy',
        field: 'canonicalType',
        message: `canonicalType "${c.canonicalType}" is not a known program-type id. Valid ids: ${PROGRAM_TYPE_IDS.join(', ')}.`,
      });
    }
  }

  const enumArrayChecks: Array<[string, Set<string>, string]> = [
    ['supportModes', supportModeIds, 'supportMode'],
    ['stageFit', founderStageIds, 'founderStage'],
  ];
  for (const [field, valid, dim] of enumArrayChecks) {
    if (field in c) {
      const arr = c[field];
      if (!Array.isArray(arr)) {
        issues.push({ code: 'malformed', field, message: `${field} must be an array of ${dim} ids.` });
        continue;
      }
      for (const v of arr) {
        if (typeof v !== 'string' || !valid.has(v)) {
          issues.push({
            code: 'invalid-taxonomy',
            field,
            message: `${field} contains invalid ${dim} id ${JSON.stringify(v)}.`,
          });
        }
      }
    }
  }

  const enumChecks: Array<[string, Set<string>, string]> = [
    ['intakeMethod', intakeMethodIds, 'intakeMethod'],
    ['intakeFrequency', intakeFrequencyIds, 'intakeFrequency'],
    ['costFundingModel', costFundingIds, 'costFundingModel'],
    ['format', VALID_FORMATS, 'format'],
    ['verificationStatus', VALID_VERIFICATION, 'verificationStatus'],
    ['status', VALID_STATUS, 'status'],
  ];
  for (const [field, valid, dim] of enumChecks) {
    if (field in c && c[field] != null) {
      const v = c[field];
      if (typeof v !== 'string' || !valid.has(v)) {
        issues.push({
          code: 'invalid-taxonomy',
          field,
          message: `${field} ${JSON.stringify(v)} is not a valid ${dim} value (allowed: ${[...valid].join(', ')}).`,
        });
      }
    }
  }

  // Lightweight type checks on a few structured fields.
  if ('sourceUrls' in c && c.sourceUrls != null && !Array.isArray(c.sourceUrls)) {
    issues.push({ code: 'malformed', field: 'sourceUrls', message: 'sourceUrls must be an array.' });
  }
  for (const dateField of ['applicationDeadline', 'nextCohortStart', 'lastVerified']) {
    if (dateField in c && c[dateField] != null && !looksLikeIsoDate(c[dateField])) {
      issues.push({
        code: 'malformed',
        field: dateField,
        message: `${dateField} ${JSON.stringify(c[dateField])} is not a parseable date.`,
      });
    }
  }
}

/** Validate the overall structural shape of a proposal. */
function validateShape(proposal: ProposedProgramUpdate, issues: ValidationIssue[]): void {
  if (!proposal || typeof proposal !== 'object') {
    issues.push({ code: 'malformed', message: 'Proposal is not an object.' });
    return;
  }
  if (proposal.schemaVersion !== 1) {
    issues.push({ code: 'unsupported-version', message: `Unsupported schemaVersion ${JSON.stringify(proposal.schemaVersion)} (expected 1).` });
  }
  if (!proposal.id || typeof proposal.id !== 'string') {
    issues.push({ code: 'malformed', field: 'id', message: 'Proposal must have a string id.' });
  }
  if (!proposal.submitter || typeof proposal.submitter !== 'string') {
    issues.push({ code: 'malformed', field: 'submitter', message: 'Proposal must name a submitter.' });
  }
  if (!proposal.submittedAt || !looksLikeIsoDate(proposal.submittedAt)) {
    issues.push({ code: 'malformed', field: 'submittedAt', message: 'submittedAt must be a valid ISO timestamp.' });
  }
  if (!['pending', 'approved', 'rejected'].includes(proposal.status as string)) {
    issues.push({ code: 'malformed', field: 'status', message: `status ${JSON.stringify(proposal.status)} is not pending|approved|rejected.` });
  }

  const t = proposal.target;
  if (!t || typeof t !== 'object') {
    issues.push({ code: 'malformed', field: 'target', message: 'Proposal must have a target.' });
  } else if (t.kind === 'new') {
    if (t.dataset !== 'residential' && t.dataset !== 'traditional') {
      issues.push({ code: 'malformed', field: 'target.dataset', message: 'A "new" proposal must name target.dataset (residential|traditional).' });
    }
    if (!proposal.changes || typeof proposal.changes.name !== 'string' || !proposal.changes.name.trim()) {
      issues.push({ code: 'malformed', field: 'changes.name', message: 'A "new" proposal must include a program name.' });
    }
  } else if (t.kind === 'update') {
    if (!t.slug && !t.name) {
      issues.push({ code: 'malformed', field: 'target', message: 'An "update" proposal must identify the program by slug or name.' });
    }
  } else {
    issues.push({ code: 'malformed', field: 'target.kind', message: `target.kind ${JSON.stringify((t as { kind?: unknown }).kind)} must be "new" or "update".` });
  }

  if (!proposal.changes || typeof proposal.changes !== 'object') {
    issues.push({ code: 'malformed', field: 'changes', message: 'Proposal must include a changes object.' });
  } else if (Object.keys(proposal.changes).length === 0) {
    issues.push({ code: 'empty-changes', field: 'changes', message: 'Proposal has no field changes.' });
  }

  if (!Array.isArray(proposal.sources)) {
    issues.push({ code: 'malformed', field: 'sources', message: 'sources must be an array (may be empty for non-sensitive changes).' });
  } else {
    for (const s of proposal.sources) {
      if (s && s.url != null && !looksLikeUrl(s.url)) {
        issues.push({ code: 'malformed', field: 'sources', message: `Source url ${JSON.stringify(s.url)} is not a valid http(s) URL.` });
      }
    }
  }
}

/**
 * Validate a proposal fully. Returns `{ valid, issues }`. A proposal is valid
 * when there are no issues. The sensitive-field rule and taxonomy validation
 * run only when the shape is well-formed enough to evaluate them.
 */
export function validateProposal(proposal: ProposedProgramUpdate): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateShape(proposal, issues);

  // Only evaluate field-level rules when we have a changes object to inspect.
  if (proposal && proposal.changes && typeof proposal.changes === 'object') {
    validateTaxonomy(proposal.changes, issues);

    // Sensitive-field-source enforcement.
    const sensitive = touchedSensitiveFields(proposal.changes);
    if (sensitive.length > 0 && !hasUsableSource(proposal)) {
      issues.push({
        code: 'missing-source',
        message: `Sensitive field(s) [${sensitive.join(', ')}] changed but no source URL provided. A source is required for: deadline, application status, equity, funding amount, eligibility, visa support, cost, location, program status.`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}
