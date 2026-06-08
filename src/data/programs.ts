// Loads + merges the two human-edited source datasets into one typed array.
// This replaces the old standalone build-api.js: the merge/facets logic now
// lives here and is consumed both by the pages and the /api + /llms endpoints.

import residentialRaw from './startup-programs-data.json';
import traditionalRaw from './traditional-programs-data.json';
import { STATUS } from '../lib/status';

export type Dataset = 'residential' | 'traditional';

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
};
