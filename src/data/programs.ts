// Loads + merges the two human-edited source datasets into one typed array.
// This replaces the old standalone build-api.js: the merge/facets logic now
// lives here and is consumed both by the pages and the /api + /llms endpoints.

import residentialRaw from './startup-programs-data.json';
import traditionalRaw from './traditional-programs-data.json';
import { STATUS } from '../lib/status';

export type Dataset = 'residential' | 'traditional';

// Founder-facing enums (handoff §14). Values are optional on Program for now and
// left empty/"unknown" until the data is filled — see the founder-atlas-refresh
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
  dataset: Dataset;
  name: string;
  type: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
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
}

/** URL slug for a program (mirrors countrySlug in countries.ts). */
export function programSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SourceFile {
  meta?: Record<string, unknown>;
  programs: Omit<Program, 'dataset'>[];
}

const residential = residentialRaw as SourceFile;
const traditional = traditionalRaw as SourceFile;

export const PROGRAMS: Program[] = [
  ...residential.programs.map((p) => ({ dataset: 'residential' as const, ...p })),
  ...traditional.programs.map((p) => ({ dataset: 'traditional' as const, ...p })),
];

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
  dataset: countBy(PROGRAMS, 'dataset'),
  type: countBy(PROGRAMS, 'type'),
  country: countBy(PROGRAMS, 'country'),
  status: countBy(PROGRAMS, 'status'),
};

/** Sorted distinct values, handy for filter dropdowns. */
export const TYPES = Object.keys(FACETS.type).sort();
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
  type: 'Program category (e.g. Accelerator, Residency, Hacker House)',
  dataset: 'residential | traditional',
  city: 'City',
  country: 'Country',
  lat: 'Latitude (number)',
  lng: 'Longitude (number)',
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
