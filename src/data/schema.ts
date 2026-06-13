// Canonical schema description (Stream 2).
//
// A documented, machine-readable description of the canonical Orbital
// program schema: every field, its meaning, whether it is MVP-required or
// optional, and whether it is a legacy free-text field or a canonical field.
//
// This is intentionally a plain TS data structure (not a runtime validator and
// not a JSON Schema) so that later streams (S9 exports) can mechanically turn it
// into `public/schemas/program.schema.json` and friends without a breaking
// change here. Nothing in this file alters the `Program` interface.

import type { TaxonomyDimension } from './taxonomy';

/** Whether a field is required for an MVP-ready record, or optional. */
export type FieldRequirement = 'mvp-required' | 'optional';

/** Origin of a field on the `Program` interface. */
export type FieldKind =
  | 'legacy' // pre-existing free-text / display field — kept working, never removed
  | 'legacy-optional' // pre-existing optional founder-schema field
  | 'canonical'; // new canonical field added in Stream 2 (always optional on Program)

/** Primitive/shape hint for export generation. */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'boolean-nullable'
  | 'string[]'
  | 'date-iso'
  | 'enum'
  | 'enum[]';

export interface SchemaField {
  /** Field name as it appears on the `Program` interface. */
  field: string;
  /** What this field means. */
  meaning: string;
  /** MVP-required vs optional. */
  requirement: FieldRequirement;
  /** Legacy vs canonical origin. */
  kind: FieldKind;
  /** Type hint for downstream JSON-schema generation. */
  type: FieldType;
  /** For enum fields, the taxonomy dimension that constrains valid IDs. */
  taxonomy?: TaxonomyDimension;
}

/**
 * The canonical schema. Field order roughly follows: identity → location →
 * legacy descriptors → canonical descriptors → provenance → MVP scope markers.
 *
 * IMPORTANT: MVP-required does NOT mean "required on the TypeScript type". Every
 * canonical field is optional on `Program` for backward compatibility; the
 * `mvp-required` flag is a *data-quality contract* that Stream 3 / Stream 7
 * enforce per curated MVP record — not a compile-time constraint.
 */
export const PROGRAM_SCHEMA: SchemaField[] = [
  // ---- Identity ----
  { field: 'name', meaning: 'Program name.', requirement: 'mvp-required', kind: 'legacy', type: 'string' },
  {
    field: 'type',
    meaning: 'Legacy free-text program category (e.g. "Accelerator", "Hacker House / Coliving"). Still rendered; canonicalized via canonicalType.',
    requirement: 'mvp-required',
    kind: 'legacy',
    type: 'string',
  },
  { field: 'url', meaning: 'Program website / application URL.', requirement: 'mvp-required', kind: 'legacy', type: 'string' },
  { field: 'domain', meaning: 'Program website domain.', requirement: 'optional', kind: 'legacy', type: 'string' },
  { field: 'operator', meaning: 'Organization or person running the program.', requirement: 'optional', kind: 'legacy', type: 'string' },
  { field: 'dataset', meaning: 'Deprecated, derived back-compat value (residential | traditional) computed from canonicalType/format — NOT a stored field. Prefer canonicalType.', requirement: 'optional', kind: 'legacy', type: 'string' },

  // ---- Location ----
  { field: 'country', meaning: 'Country (or "Remote").', requirement: 'mvp-required', kind: 'legacy', type: 'string' },
  { field: 'city', meaning: 'City when physical.', requirement: 'optional', kind: 'legacy', type: 'string' },
  { field: 'lat', meaning: 'Latitude.', requirement: 'optional', kind: 'legacy', type: 'number' },
  { field: 'lng', meaning: 'Longitude.', requirement: 'optional', kind: 'legacy', type: 'number' },
  { field: 'region', meaning: 'Broader region grouping.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },

  // ---- Legacy descriptors (free-text, kept working) ----
  { field: 'focus', meaning: 'Areas of focus (comma-separated text).', requirement: 'optional', kind: 'legacy', type: 'string' },
  { field: 'stage', meaning: 'Legacy free-text founder stage served (e.g. "Pre-seed / seed"). Canonicalized via canonicalStages/stageFit.', requirement: 'mvp-required', kind: 'legacy', type: 'string' },
  { field: 'highlight', meaning: 'Optional differentiator / key fact.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },
  { field: 'subtype', meaning: 'Free-text sub-category.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },
  { field: 'format', meaning: 'Living model: live-in | relocation | hybrid | in-person | remote | unknown.', requirement: 'optional', kind: 'legacy-optional', type: 'enum' },
  { field: 'sectorFocus', meaning: 'Sector focus tags.', requirement: 'optional', kind: 'legacy-optional', type: 'string[]' },
  { field: 'stageFit', meaning: 'Canonical-aligned founder stages served (StageFit[]). Mirrors founderStage taxonomy IDs.', requirement: 'optional', kind: 'legacy-optional', type: 'enum[]', taxonomy: 'founderStage' },
  { field: 'founderFit', meaning: 'Founder archetypes served (FounderFit[]).', requirement: 'optional', kind: 'legacy-optional', type: 'enum[]' },

  // ---- Application / cohort (legacy optional) ----
  { field: 'status', meaning: 'Recruiting status enum (rolling/open/closing-soon/opening-soon/running/closed).', requirement: 'mvp-required', kind: 'legacy', type: 'string' },
  { field: 'status_detail', meaning: 'Human-readable recruiting detail.', requirement: 'optional', kind: 'legacy', type: 'string' },
  { field: 'applyUrl', meaning: 'Direct application URL (falls back to url).', requirement: 'optional', kind: 'legacy-optional', type: 'string' },
  { field: 'applicationDeadline', meaning: 'Next application deadline (ISO date).', requirement: 'optional', kind: 'legacy-optional', type: 'date-iso' },
  { field: 'nextCohortStart', meaning: 'Next cohort start (ISO date).', requirement: 'optional', kind: 'legacy-optional', type: 'date-iso' },
  { field: 'durationWeeksMin', meaning: 'Minimum program length (weeks).', requirement: 'optional', kind: 'legacy-optional', type: 'number' },
  { field: 'durationWeeksMax', meaning: 'Maximum program length (weeks).', requirement: 'optional', kind: 'legacy-optional', type: 'number' },
  { field: 'cohortSize', meaning: 'Approximate cohort size.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },

  // ---- Cost / funding (legacy optional) ----
  { field: 'fundingAmount', meaning: 'Funding offered (free text).', requirement: 'optional', kind: 'legacy-optional', type: 'string' },
  { field: 'equityTaken', meaning: 'Equity taken (free text).', requirement: 'optional', kind: 'legacy-optional', type: 'string' },
  { field: 'cost', meaning: 'Cost / fee to the founder.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },

  // ---- provides* booleans (legacy optional) ----
  { field: 'providesHousing', meaning: 'true|false|null — housing provided.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesWorkspace', meaning: 'true|false|null — workspace provided.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesFunding', meaning: 'true|false|null — funding provided.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesMentorship', meaning: 'true|false|null — mentorship provided.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesInvestorAccess', meaning: 'true|false|null — investor access.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesDemoDay', meaning: 'true|false|null — demo day.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },
  { field: 'providesVisaSupport', meaning: 'true|false|null — visa/relocation support.', requirement: 'optional', kind: 'legacy-optional', type: 'boolean-nullable' },

  // ---- Provenance (legacy optional) ----
  { field: 'sourceUrls', meaning: 'Sources used to verify this entry.', requirement: 'mvp-required', kind: 'legacy-optional', type: 'string[]' },
  { field: 'lastVerified', meaning: 'Date this entry was last verified (ISO date).', requirement: 'mvp-required', kind: 'legacy-optional', type: 'date-iso' },
  { field: 'verificationStatus', meaning: 'verified | needs-review | unverified.', requirement: 'mvp-required', kind: 'legacy-optional', type: 'enum' },
  { field: 'tags', meaning: 'Free-form tags.', requirement: 'optional', kind: 'legacy-optional', type: 'string[]' },
  { field: 'notes', meaning: 'Short editorial note.', requirement: 'optional', kind: 'legacy-optional', type: 'string' },

  // ---- Canonical fields (Stream 2; always optional on Program) ----
  {
    field: 'canonicalType',
    meaning: 'Canonical program-type ID derived from legacy `type` (see programType taxonomy). Non-destructive; legacy `type` stays the display value.',
    requirement: 'mvp-required',
    kind: 'canonical',
    type: 'enum',
    taxonomy: 'programType',
  },
  {
    field: 'supportModes',
    meaning: 'Canonical support modes the program provides (funding, housing, mentorship, …).',
    requirement: 'mvp-required',
    kind: 'canonical',
    type: 'enum[]',
    taxonomy: 'supportMode',
  },
  {
    field: 'intakeMethod',
    meaning: 'How founders get in (rolling, cohort-application, invitation, open-call, …).',
    requirement: 'optional',
    kind: 'canonical',
    type: 'enum',
    taxonomy: 'intakeMethod',
  },
  {
    field: 'intakeFrequency',
    meaning: 'How often intake happens (rolling, annual, biannual, quarterly, ad-hoc, unknown).',
    requirement: 'optional',
    kind: 'canonical',
    type: 'enum',
    taxonomy: 'intakeFrequency',
  },
  {
    field: 'costFundingModel',
    meaning: 'The equity/money axis (equity, equity-free-grant, fee, free, stipend, venture-debt, mixed, unknown).',
    requirement: 'optional',
    kind: 'canonical',
    type: 'enum',
    taxonomy: 'costFundingModel',
  },

  // ---- MVP scope markers (Stream 2; populated by Stream 3) ----
  {
    field: 'mvp',
    meaning: 'True when this record is a curated, launch-ready MVP record. Set by Stream 3.',
    requirement: 'optional',
    kind: 'canonical',
    type: 'boolean',
  },
  {
    field: 'ecosystem',
    meaning: 'MVP ecosystem tag (e.g. "finland-nordics", "estonia", "eu-europe", "uk", "us-global-remote"). Set by Stream 3.',
    requirement: 'optional',
    kind: 'canonical',
    type: 'string',
  },
];

/** Field names that an MVP-ready record must carry (data-quality contract). */
export const MVP_REQUIRED_FIELDS: string[] = PROGRAM_SCHEMA.filter(
  (f) => f.requirement === 'mvp-required',
).map((f) => f.field);

/** The canonical (Stream-2-added) field names, all optional on `Program`. */
export const CANONICAL_FIELDS: string[] = PROGRAM_SCHEMA.filter((f) => f.kind === 'canonical').map(
  (f) => f.field,
);

/** Lookup a field's schema entry by name. */
export function schemaFieldFor(field: string): SchemaField | undefined {
  return PROGRAM_SCHEMA.find((f) => f.field === field);
}
