// Loads the single unified source dataset into one typed array.
// All records live in `programs-data.json`, categorized by the canonical
// taxonomy (`canonicalType`) rather than the legacy residential/traditional
// split. The merge/facets logic lives here and is consumed both by the pages
// and the /api + /llms endpoints.

import programsRaw from './programs-data.json';
import { STATUS } from '../lib/status';
import { PROGRAM_TYPES, labelFor } from './taxonomy';
import type {
  ProgramTypeId,
  SupportModeId,
  IntakeMethodId,
  IntakeFrequencyId,
  CostFundingModelId,
} from './taxonomy';

// Re-export the canonical taxonomy ID unions for convenience, so consumers can
// import program shape + canonical IDs from one place. (Additive; does not
// change any existing export.)
export type {
  ProgramTypeId,
  SupportModeId,
  IntakeMethodId,
  IntakeFrequencyId,
  CostFundingModelId,
} from './taxonomy';

/**
 * @deprecated Legacy binary dataset axis. This is no longer a source field — it
 * is *derived* from `canonicalType`/`format` via {@link deriveDataset} purely
 * for back-compat with the legacy `/api/programs.json` contract. New code should
 * categorize by `canonicalType`.
 */
export type Dataset = 'residential' | 'traditional';

// Founder-facing enums (handoff §14). Values are optional on Program for now and
// left empty/"unknown" until the data is filled — see the 0rbital-data-review
// skill. The UI shows "Unknown" wherever a value is absent.
export type ProgramFormat = 'in-person' | 'remote' | 'hybrid' | 'live-in' | 'relocation' | 'unknown';
export type StageFit =
  | 'pre-idea' | 'idea' | 'pre-product' | 'mvp' | 'pre-seed' | 'seed'
  | 'series-a-plus' | 'repeat-founder' | 'student' | 'researcher' | 'unknown';
export type FounderFit =
  | 'first-time-founder' | 'solo-founder' | 'technical-builder' | 'domain-expert'
  | 'repeat-founder' | 'student-founder' | 'researcher' | 'international-founder'
  | 'relocating-founder' | 'fundraising-soon' | 'needs-focus' | 'needs-community'
  | 'needs-customers' | 'needs-capital';
export type VerificationStatus = 'verified' | 'needs-review' | 'unverified';

export interface Program {
  /**
   * @deprecated Derived back-compat value (residential | traditional) computed
   * by {@link deriveDataset}, NOT a stored source field. Kept on the in-memory
   * `Program` so legacy consumers + the legacy API keep working. Prefer
   * `canonicalType`.
   */
  dataset: Dataset;
  name: string;
  /** Human-readable type LABEL (free text). The machine axis is `canonicalType`. */
  type: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  /**
   * Optional second ("origin") location for hybrid/relocation programs that
   * begin in one country and run in another (e.g. Silta: Helsinki → SF). When
   * set, the map/globe render a second pin at the origin so the program is
   * visible from both ends. `originCity`/`originCountry` label that pin.
   */
  originLat?: number;
  originLng?: number;
  originCity?: string;
  originCountry?: string;
  focus: string;
  operator: string;
  stage: string;
  status: string;
  status_detail: string;
  domain: string;
  url: string;
  highlight?: string;

  // ---- Phase-1 founder schema (all optional; populated later, not inferred) ----
  subtype?: string;
  region?: string;
  format?: ProgramFormat;
  stageFit?: StageFit[];
  founderFit?: FounderFit[];
  sectorFocus?: string[];
  applicationDeadline?: string;
  nextCohortStart?: string;
  durationWeeksMin?: number;
  durationWeeksMax?: number;
  cohortSize?: string;
  fundingAmount?: string;
  equityTaken?: string;
  cost?: string;
  providesHousing?: boolean | null;
  providesWorkspace?: boolean | null;
  providesFunding?: boolean | null;
  providesMentorship?: boolean | null;
  providesInvestorAccess?: boolean | null;
  providesDemoDay?: boolean | null;
  providesVisaSupport?: boolean | null;
  applyUrl?: string;
  sourceUrls?: string[];
  lastVerified?: string;
  verificationStatus?: VerificationStatus;
  tags?: string[];
  notes?: string;

  // ---- Stream 2 canonical fields (all optional; derived, not source-of-truth) ----
  // These are populated by `src/lib/normalizeProgram.ts` (derivation) or later
  // streams. They never replace the legacy free-text fields above; `type`,
  // `stage`, and `format` remain the rendered values.
  /** Canonical program-type ID derived from / aligned to legacy `type`. */
  canonicalType?: ProgramTypeId;
  /** Canonical support modes the program provides. */
  supportModes?: SupportModeId[];
  /** How founders get in (rolling, cohort-application, invitation, …). */
  intakeMethod?: IntakeMethodId;
  /** How often intake happens. */
  intakeFrequency?: IntakeFrequencyId;
  /** The equity / money axis. */
  costFundingModel?: CostFundingModelId;
  /** True when this is a curated, launch-ready MVP record (set by Stream 3). */
  mvp?: boolean;
  /** MVP ecosystem tag, e.g. "finland-nordics", "estonia", "uk" (set by Stream 3). */
  ecosystem?: string;

  /**
   * Runtime-only marker (never stored in the JSON source): set on the synthetic
   * "twin" record produced by {@link withOriginPins} so the views can tell an
   * origin pin apart from the primary one. The twin carries the same program
   * data, repositioned at the origin coordinates.
   */
  isOriginPin?: boolean;
}

/**
 * Expand a program list into a render-ready pin list: every program passes
 * through unchanged, and any program carrying `originLat`/`originLng` also
 * yields a second "twin" positioned at its origin (`isOriginPin: true`). Both
 * pins keep the same name/domain/url so popups and the detail panel render the
 * same program from either end. Used only for map/globe markers — sidebar lists
 * and counts stay on the un-expanded program list so they show one row each.
 */
export function withOriginPins(programs: Program[]): Program[] {
  const out: Program[] = [];
  for (const p of programs) {
    out.push(p);
    if (typeof p.originLat === 'number' && typeof p.originLng === 'number') {
      out.push({
        ...p,
        lat: p.originLat,
        lng: p.originLng,
        city: p.originCity ?? p.city,
        country: p.originCountry ?? p.country,
        isOriginPin: true,
      });
    }
  }
  return out;
}

/** URL slug for a program (mirrors countrySlug in countries.ts). */
export function programSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Source record shape: the unified JSON stores no `dataset` field. */
type SourceProgram = Omit<Program, 'dataset'>;

interface SourceFile {
  meta?: Record<string, unknown>;
  programs: SourceProgram[];
}

const source = programsRaw as SourceFile;

/**
 * @deprecated Derive the legacy residential|traditional value from a record's
 * canonical fields. `residential` when the record is a founder-residency /
 * hacker-house OR is `format: 'live-in'`; `traditional` otherwise. This is the
 * only place the legacy binary is produced, and it exists purely for the
 * back-compat `/api/programs.json` shape — prefer `canonicalType`.
 */
export function deriveDataset(p: Pick<Program, 'canonicalType' | 'format'>): Dataset {
  if (
    p.canonicalType === 'founder-residency' ||
    p.canonicalType === 'hacker-house' ||
    p.format === 'live-in'
  ) {
    return 'residential';
  }
  return 'traditional';
}

/**
 * The single program-facing filter axis Orbital exposes: does a place give you
 * somewhere to live, somewhere to work, or both? Derived from the populated
 * `supportModes` (housing/workspace) with the explicit booleans as a stronger
 * signal when present. Co-living houses that report neither default to `both`
 * (they're live-and-build spaces by definition).
 */
export type WorkLiveModel = 'co-living' | 'co-working' | 'both';
export function programModel(
  p: Pick<Program, 'providesHousing' | 'providesWorkspace' | 'supportModes'>,
): WorkLiveModel {
  const housing = p.providesHousing === true || !!p.supportModes?.includes('housing');
  const workspace = p.providesWorkspace === true || !!p.supportModes?.includes('workspace');
  if (housing && workspace) return 'both';
  if (housing) return 'co-living';
  if (workspace) return 'co-working';
  return 'both';
}

/**
 * The dataset every page, island and API route consumes. The source JSON is now
 * co-living-only (founder residencies and hacker/founder houses — see
 * `src/data/programs-data.json`), so there is no wider corpus to filter against:
 * every record here is a live-in / residential cohort. Facets, country/city
 * counts, static-path generation and the APIs all derive from this single array.
 */
export const PROGRAMS: Program[] = source.programs.map((p) => ({
  ...(p as SourceProgram),
  dataset: deriveDataset(p as Program),
}));

/**
 * @deprecated Back-compat alias. The dataset used to carry non-co-living records
 * that were filtered out at runtime; now the JSON itself is co-living-only, so
 * `ALL_PROGRAMS` and {@link PROGRAMS} are the same set. Prefer `PROGRAMS`.
 */
export const ALL_PROGRAMS: Program[] = PROGRAMS;

function countBy(items: Program[], key: keyof Program): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const v = it[key];
    if (v === undefined || v === null || v === '') continue;
    out[String(v)] = (out[String(v)] || 0) + 1;
  }
  return out;
}

export const FACETS = {
  canonicalType: countBy(PROGRAMS, 'canonicalType'),
  country: countBy(PROGRAMS, 'country'),
  status: countBy(PROGRAMS, 'status'),
};

/**
 * Program-type label map (canonical ID → human label) for filter UIs + tables.
 * Ordered with the 8 MVP types first, then the rest.
 */
export const PROGRAM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROGRAM_TYPES.map((e) => [e.id, e.label]),
);

/** Program-type facet entries (id, label, mvp, count), MVP types first. */
export const PROGRAM_TYPE_FACETS: Array<{
  id: ProgramTypeId;
  label: string;
  mvp: boolean;
  count: number;
}> = PROGRAM_TYPES.map((e) => ({
  id: e.id,
  label: e.label,
  mvp: e.mvp,
  count: FACETS.canonicalType[e.id] ?? 0,
}))
  .filter((e) => e.count > 0)
  .sort((a, b) => (a.mvp === b.mvp ? b.count - a.count : a.mvp ? -1 : 1));

/** Human label for a canonical program-type id (raw-id fallback). */
export function programTypeLabel(id: string | undefined): string {
  if (!id) return 'Unknown';
  return labelFor('programType', id);
}

/** Sorted distinct values, handy for filter dropdowns. */
export const TYPES = Object.keys(countBy(PROGRAMS, 'type')).sort();
export const COUNTRIES = Object.keys(FACETS.country).sort();

export const STATUS_LEGEND: Record<string, string> = {
  rolling: 'Accepts applications on a rolling/always-open basis',
  open: 'A specific cohort window is currently open',
  'closing-soon': 'Open but with an imminent deadline',
  'opening-soon': 'Next cohort applications announced, opening shortly',
  running: 'Cohort currently in session',
  closed: 'Latest cohort closed; check site for next cycle',
};

export const API_SCHEMA: Record<string, string> = {
  name: 'Program name',
  type: 'Human-readable type label (free text, e.g. "Seed Accelerator", "Hacker House")',
  canonicalType:
    'Canonical program-type ID (primary categorical axis): ' + PROGRAM_TYPES.map((e) => e.id).join(' | '),
  dataset: '(deprecated, derived) residential | traditional — derived from canonicalType/format for back-compat; prefer canonicalType',
  city: 'City',
  country: 'Country',
  lat: 'Latitude (number)',
  lng: 'Longitude (number)',
  originLat: 'Latitude of the optional origin location (hybrid/relocation programs)',
  originLng: 'Longitude of the optional origin location (hybrid/relocation programs)',
  originCity: 'City of the optional origin location',
  originCountry: 'Country of the optional origin location',
  focus: 'Areas of focus (comma-separated text)',
  operator: 'Organization or person running the program',
  stage: 'Founder stage served (e.g. Pre-seed / very early)',
  status: 'Recruiting status enum: ' + Object.keys(STATUS).join(' | '),
  status_detail: 'Human-readable recruiting detail',
  domain: 'Program website domain',
  url: 'Application / visit URL',
  highlight: 'Optional differentiator / key fact',
  // Founder schema (optional; "unknown"/absent until verified & filled).
  format: 'Living model: live-in | relocation | hybrid | in-person | remote | unknown',
  supportModes: 'Canonical support modes provided (array, e.g. funding, housing, mentorship)',
  mvp: 'true when this is a curated, launch-ready MVP record',
  ecosystem: 'MVP ecosystem tag (e.g. "finland-nordics", "estonia", "uk") when set',
  stageFit: 'Founder stages served (array, e.g. mvp, pre-seed)',
  founderFit: 'Founder archetypes served (array)',
  sectorFocus: 'Sector focus tags (array)',
  applicationDeadline: 'Next application deadline (ISO date) when known',
  nextCohortStart: 'Next cohort start (ISO date) when known',
  durationWeeksMin: 'Minimum program length in weeks',
  durationWeeksMax: 'Maximum program length in weeks',
  cohortSize: 'Approximate cohort size',
  fundingAmount: 'Funding offered (free text, e.g. "$250K") when known',
  equityTaken: 'Equity taken (free text, e.g. "7%") when known',
  cost: 'Cost / fee to the founder when known',
  providesHousing: 'true | false | null(unknown) — housing provided',
  providesWorkspace: 'true | false | null(unknown) — workspace provided',
  providesFunding: 'true | false | null(unknown) — funding provided',
  providesMentorship: 'true | false | null(unknown) — mentorship provided',
  providesInvestorAccess: 'true | false | null(unknown) — investor access',
  providesDemoDay: 'true | false | null(unknown) — demo day',
  providesVisaSupport: 'true | false | null(unknown) — visa/relocation support',
  applyUrl: 'Direct application URL (falls back to url)',
  sourceUrls: 'Sources used to verify this entry (array)',
  lastVerified: 'Date this entry was last verified (ISO date)',
  verificationStatus: 'verified | needs-review | unverified',
  tags: 'Free-form tags (array)',
  notes: 'Short editorial note',
};

/** Fields that are part of the founder schema but optional/unknown for now. */
export const HAS_DATA = (key: keyof Program): boolean =>
  PROGRAMS.some((p) => {
    const v = p[key];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '';
  });
