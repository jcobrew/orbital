#!/usr/bin/env -S npx tsx
/**
 * Stream 7 — Freshness check (report-only, offline, safe-by-default).
 *
 * Detects stale program records from their `lastVerified` date and flags
 * records that are missing a verification date entirely. This script NEVER
 * modifies the JSON data — it only reads `PROGRAMS` and prints a report.
 *
 * Pure detection helpers are exported so `generate-update-report.ts` and the
 * Vitest suite can reuse them without re-implementing the logic.
 *
 * Run:
 *   npx tsx scripts/check-program-freshness.ts            # default 180-day threshold
 *   npx tsx scripts/check-program-freshness.ts --days=90  # custom threshold
 *   npx tsx scripts/check-program-freshness.ts --json     # machine-readable
 */

import { PROGRAMS, type Program } from '../src/data/programs';

/** Default staleness threshold in days. A record verified longer ago than this
 *  (or with no verification date) is treated as needing a refresh. */
export const DEFAULT_STALE_DAYS = 180;

export type FreshnessState = 'fresh' | 'stale' | 'missing-date' | 'invalid-date';

export interface FreshnessRecord {
  name: string;
  dataset: string;
  lastVerified?: string;
  verificationStatus?: string;
  ageDays: number | null;
  state: FreshnessState;
}

export interface FreshnessSummary {
  thresholdDays: number;
  now: string;
  total: number;
  fresh: number;
  stale: number;
  missingDate: number;
  invalidDate: number;
  records: FreshnessRecord[];
}

/** Parse an ISO-ish date string; returns null when unparseable. */
export function parseDate(value: string | undefined): Date | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days between two dates (a - b), floored. */
export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Classify a single program's freshness against a threshold + reference date. */
export function classifyFreshness(
  program: Pick<Program, 'name' | 'dataset' | 'lastVerified' | 'verificationStatus'>,
  thresholdDays: number = DEFAULT_STALE_DAYS,
  now: Date = new Date(),
): FreshnessRecord {
  const lastVerified = program.lastVerified;
  let state: FreshnessState;
  let ageDays: number | null = null;

  if (!lastVerified) {
    state = 'missing-date';
  } else {
    const d = parseDate(lastVerified);
    if (!d) {
      state = 'invalid-date';
    } else {
      ageDays = daysBetween(now, d);
      state = ageDays > thresholdDays ? 'stale' : 'fresh';
    }
  }

  return {
    name: program.name,
    dataset: String(program.dataset),
    lastVerified,
    verificationStatus: program.verificationStatus,
    ageDays,
    state,
  };
}

/** Build the freshness summary across all programs. */
export function summarizeFreshness(
  programs: ReadonlyArray<Program> = PROGRAMS,
  thresholdDays: number = DEFAULT_STALE_DAYS,
  now: Date = new Date(),
): FreshnessSummary {
  const records = programs.map((p) => classifyFreshness(p, thresholdDays, now));
  return {
    thresholdDays,
    now: now.toISOString().slice(0, 10),
    total: records.length,
    fresh: records.filter((r) => r.state === 'fresh').length,
    stale: records.filter((r) => r.state === 'stale').length,
    missingDate: records.filter((r) => r.state === 'missing-date').length,
    invalidDate: records.filter((r) => r.state === 'invalid-date').length,
    records,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { days: number; json: boolean } {
  let days = DEFAULT_STALE_DAYS;
  let json = false;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg.startsWith('--days=')) {
      const n = Number(arg.slice('--days='.length));
      if (Number.isFinite(n) && n > 0) days = Math.floor(n);
    }
  }
  return { days, json };
}

function renderText(summary: FreshnessSummary): string {
  const lines: string[] = [];
  lines.push('Program freshness report');
  lines.push(`  reference date: ${summary.now}`);
  lines.push(`  stale threshold: ${summary.thresholdDays} days`);
  lines.push('');
  lines.push(
    `  total ${summary.total} | fresh ${summary.fresh} | stale ${summary.stale} | ` +
      `missing-date ${summary.missingDate} | invalid-date ${summary.invalidDate}`,
  );

  const flagged = summary.records.filter((r) => r.state !== 'fresh');
  if (flagged.length) {
    lines.push('');
    lines.push('  Needs attention:');
    for (const r of flagged) {
      const age = r.ageDays === null ? '—' : `${r.ageDays}d`;
      lines.push(`    [${r.state}] ${r.name} (${r.dataset}) last=${r.lastVerified ?? 'none'} age=${age}`);
    }
  } else {
    lines.push('');
    lines.push('  All records fresh.');
  }
  return lines.join('\n');
}

function isMain(): boolean {
  // Works under tsx/node ESM: compare resolved entry to this module URL.
  return Boolean(process.argv[1] && import.meta.url === `file://${process.argv[1]}`);
}

if (isMain()) {
  const { days, json } = parseArgs(process.argv.slice(2));
  const summary = summarizeFreshness(PROGRAMS, days);
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(renderText(summary));
  }
  // Report-only: always exit 0 so this never fails a build.
  process.exit(0);
}
