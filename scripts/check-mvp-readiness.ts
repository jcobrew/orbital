#!/usr/bin/env -S npx tsx
/**
 * Stream 7 — MVP-readiness check (report-only, offline, safe-by-default).
 *
 * Implements the per-record MVP-readiness criteria and the MVP scope caps as
 * WARNINGS (never hard failures). It NEVER modifies data.
 *
 * Readiness criteria track **Stream 3's** data-quality spec. At time of writing
 * `docs/program-data-quality.md` / `docs/mvp-data-scope.md` are not yet on
 * master, so these checks follow the plan's "Required MVP program fields" and
 * the MVP-required field list documented in `docs/data-model.md`. If Stream 3
 * lands a stricter spec, update `MVP_REQUIRED_FIELDS` / `readinessForRecord`
 * to match.
 *
 * Required MVP fields (per docs/data-model.md + plan):
 *   name · type · url · country (or remote) · stage · status · sourceUrls ·
 *   lastVerified · verificationStatus · canonicalType · supportModes.
 * Conditionally required (when applicable, not hard-checked here):
 *   city (if physical) · applyUrl · deadline/intake · cost/equity · eligibility.
 *
 * MVP caps (warnings):
 *   100–200 curated records · 3–5 ecosystems · 6–8 program types.
 *
 * Run:
 *   npx tsx scripts/check-mvp-readiness.ts          # all records
 *   npx tsx scripts/check-mvp-readiness.ts --mvp-only   # only records tagged mvp:true
 *   npx tsx scripts/check-mvp-readiness.ts --json
 */

import { PROGRAMS, type Program } from '../src/data/programs';
import { normalizeProgram } from '../src/lib/normalizeProgram';
import { isMvpProgramType } from '../src/data/taxonomy';

/** MVP-required fields, mirroring docs/data-model.md "MVP-required fields". */
export const MVP_REQUIRED_FIELDS = [
  'name',
  'type',
  'url',
  'country',
  'stage',
  'status',
  'sourceUrls',
  'lastVerified',
  'verificationStatus',
  'canonicalType',
  'supportModes',
] as const;

// MVP scope caps from the plan / risks table.
export const CAP_RECORDS_MIN = 100;
export const CAP_RECORDS_MAX = 200;
export const CAP_ECOSYSTEMS_MIN = 3;
export const CAP_ECOSYSTEMS_MAX = 5;
export const CAP_TYPES_MIN = 6;
export const CAP_TYPES_MAX = 8;

export interface RecordReadiness {
  name: string;
  dataset: string;
  mvp: boolean;
  ready: boolean;
  missing: string[];
  warnings: string[];
}

export interface ReadinessSummary {
  scope: 'all' | 'mvp-only';
  total: number;
  ready: number;
  notReady: number;
  taggedMvp: number;
  ecosystems: string[];
  mvpTypes: string[];
  capWarnings: string[];
  records: RecordReadiness[];
}

/** Does a value count as "present" for readiness purposes? */
function present(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Evaluate a single record. Canonical fields (`canonicalType`, `supportModes`)
 * may not be stored on the record yet — they are derivable from legacy fields,
 * so we treat them as present when normalization can derive them.
 */
export function readinessForRecord(program: Program): RecordReadiness {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Derive canonical fields when absent (non-destructive, no data mutation).
  const derived = normalizeProgram(program);
  const effective: Record<string, unknown> = {
    ...program,
    canonicalType: program.canonicalType ?? derived.canonicalType,
    supportModes:
      program.supportModes && program.supportModes.length
        ? program.supportModes
        : derived.canonicalSupportModes,
  };

  for (const field of MVP_REQUIRED_FIELDS) {
    // `country` requirement is satisfied by either a country or a remote marker.
    if (field === 'country') {
      const hasLocation =
        present(program.country) ||
        program.format === 'remote' ||
        (program.tags ?? []).some((t) => /remote/i.test(t));
      if (!hasLocation) missing.push('country|remote');
      continue;
    }
    if (!present(effective[field])) missing.push(field);
  }

  // `canonicalType` resolving to the catch-all 'other' is a soft warning.
  if (effective.canonicalType === 'other') {
    warnings.push('canonicalType resolves to "other" (legacy type unmapped)');
  }
  // Verified is best; flag non-verified MVP candidates.
  if (program.verificationStatus && program.verificationStatus !== 'verified') {
    warnings.push(`verificationStatus is "${program.verificationStatus}"`);
  }

  return {
    name: program.name,
    dataset: String(program.dataset),
    mvp: Boolean(program.mvp),
    ready: missing.length === 0,
    missing,
    warnings,
  };
}

export function summarizeReadiness(
  programs: ReadonlyArray<Program> = PROGRAMS,
  mvpOnly = false,
): ReadinessSummary {
  const scoped = mvpOnly ? programs.filter((p) => p.mvp) : programs;
  const records = scoped.map(readinessForRecord);

  const taggedMvp = programs.filter((p) => p.mvp).length;
  const ecosystems = Array.from(
    new Set(scoped.map((p) => p.ecosystem).filter((e): e is string => present(e))),
  ).sort();

  const mvpTypes = Array.from(
    new Set(
      scoped
        .map((p) => p.canonicalType ?? normalizeProgram(p).canonicalType)
        .filter((t) => isMvpProgramType(t)),
    ),
  ).sort();

  const capWarnings: string[] = [];
  const recordCount = scoped.length;
  if (recordCount < CAP_RECORDS_MIN)
    capWarnings.push(`records ${recordCount} below MVP floor (${CAP_RECORDS_MIN})`);
  if (recordCount > CAP_RECORDS_MAX)
    capWarnings.push(`records ${recordCount} above MVP cap (${CAP_RECORDS_MAX})`);
  // Ecosystem/type caps only meaningful once tagging exists; warn if out of band.
  if (ecosystems.length > 0) {
    if (ecosystems.length < CAP_ECOSYSTEMS_MIN)
      capWarnings.push(`ecosystems ${ecosystems.length} below MVP floor (${CAP_ECOSYSTEMS_MIN})`);
    if (ecosystems.length > CAP_ECOSYSTEMS_MAX)
      capWarnings.push(`ecosystems ${ecosystems.length} above MVP cap (${CAP_ECOSYSTEMS_MAX})`);
  } else {
    capWarnings.push('no records carry an `ecosystem` tag yet (Stream 3 tagging pending)');
  }
  if (mvpTypes.length > CAP_TYPES_MAX)
    capWarnings.push(`MVP program types ${mvpTypes.length} above cap (${CAP_TYPES_MAX})`);
  if (taggedMvp === 0)
    capWarnings.push('no records carry `mvp: true` yet (Stream 3 tagging pending)');

  return {
    scope: mvpOnly ? 'mvp-only' : 'all',
    total: records.length,
    ready: records.filter((r) => r.ready).length,
    notReady: records.filter((r) => !r.ready).length,
    taggedMvp,
    ecosystems,
    mvpTypes,
    capWarnings,
    records,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { mvpOnly: boolean; json: boolean } {
  let mvpOnly = false;
  let json = false;
  for (const arg of argv) {
    if (arg === '--mvp-only') mvpOnly = true;
    else if (arg === '--json') json = true;
  }
  return { mvpOnly, json };
}

function renderText(summary: ReadinessSummary): string {
  const lines: string[] = [];
  lines.push('MVP-readiness report (criteria track Stream 3 / docs/data-model.md)');
  lines.push(`  scope: ${summary.scope}`);
  lines.push('');
  lines.push(`  records ${summary.total} | ready ${summary.ready} | not-ready ${summary.notReady}`);
  lines.push(`  tagged mvp:true ${summary.taggedMvp}`);
  lines.push(`  ecosystems (${summary.ecosystems.length}): ${summary.ecosystems.join(', ') || '—'}`);
  lines.push(`  MVP program types (${summary.mvpTypes.length}): ${summary.mvpTypes.join(', ') || '—'}`);

  if (summary.capWarnings.length) {
    lines.push('');
    lines.push('  Cap warnings:');
    for (const w of summary.capWarnings) lines.push(`    ! ${w}`);
  }

  const notReady = summary.records.filter((r) => !r.ready);
  if (notReady.length) {
    lines.push('');
    lines.push(`  Not MVP-ready (${notReady.length}):`);
    for (const r of notReady) {
      lines.push(`    - ${r.name} (${r.dataset}) missing: ${r.missing.join(', ')}`);
    }
  }
  return lines.join('\n');
}

function isMain(): boolean {
  return Boolean(process.argv[1] && import.meta.url === `file://${process.argv[1]}`);
}

if (isMain()) {
  const { mvpOnly, json } = parseArgs(process.argv.slice(2));
  const summary = summarizeReadiness(PROGRAMS, mvpOnly);
  if (json) console.log(JSON.stringify(summary, null, 2));
  else console.log(renderText(summary));
  process.exit(0); // Report-only: never fail the build.
}
