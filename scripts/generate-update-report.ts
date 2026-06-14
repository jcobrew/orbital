#!/usr/bin/env -S npx tsx
/**
 * Stream 7 — Aggregate update report (report-only, offline-safe by default).
 *
 * Composes the three focused checks — freshness, source-URL health, and
 * MVP-readiness — into a single report. It NEVER modifies data and NEVER fails
 * the build (always exits 0). Network probing of source URLs is OPT-IN via
 * `--check`; without it the URL section is an offline inventory only.
 *
 * The `--json` form is the machine-readable shape that Stream 9's
 * `/api/update-report.json` export can consume directly.
 *
 * Run:
 *   npx tsx scripts/generate-update-report.ts                 # offline text report
 *   npx tsx scripts/generate-update-report.ts --check         # opt-in URL probing
 *   npx tsx scripts/generate-update-report.ts --days=90        # custom stale threshold
 *   npx tsx scripts/generate-update-report.ts --mvp-only       # readiness over mvp:true only
 *   npx tsx scripts/generate-update-report.ts --json           # machine-readable
 *   npx tsx scripts/generate-update-report.ts --json --out=report.json
 */

import { writeFileSync } from 'node:fs';
import { PROGRAMS } from '../src/data/programs';
import { summarizeFreshness, DEFAULT_STALE_DAYS, type FreshnessSummary } from './check-program-freshness';
import { summarizeSourceUrls, type SourceUrlSummary } from './check-source-urls';
import { summarizeReadiness, type ReadinessSummary } from './check-mvp-readiness';

export interface UpdateReport {
  generatedAt: string;
  thresholdDays: number;
  networkChecked: boolean;
  freshness: FreshnessSummary;
  sourceUrls: SourceUrlSummary;
  readiness: ReadinessSummary;
  /** High-signal headline counts for quick scanning / dashboards. */
  headline: {
    totalPrograms: number;
    stale: number;
    missingVerificationDate: number;
    missingSourceUrls: number;
    brokenOrUnreachableUrls: number;
    notMvpReady: number;
    taggedMvp: number;
  };
}

export interface ReportOptions {
  thresholdDays?: number;
  network?: boolean;
  timeoutMs?: number;
  mvpOnly?: boolean;
}

/** Build the aggregate report object. Pure aside from the optional network probe. */
export async function generateUpdateReport(opts: ReportOptions = {}): Promise<UpdateReport> {
  const thresholdDays = opts.thresholdDays ?? DEFAULT_STALE_DAYS;
  const network = opts.network ?? false;

  const freshness = summarizeFreshness(PROGRAMS, thresholdDays);
  const sourceUrls = await summarizeSourceUrls(PROGRAMS, {
    network,
    timeoutMs: opts.timeoutMs ?? 8000,
  });
  const readiness = summarizeReadiness(PROGRAMS, opts.mvpOnly ?? false);

  return {
    generatedAt: new Date().toISOString(),
    thresholdDays,
    networkChecked: network,
    freshness,
    sourceUrls,
    readiness,
    headline: {
      totalPrograms: PROGRAMS.length,
      stale: freshness.stale,
      missingVerificationDate: freshness.missingDate,
      missingSourceUrls: sourceUrls.missingSources,
      brokenOrUnreachableUrls: sourceUrls.broken + sourceUrls.unreachable,
      notMvpReady: readiness.notReady,
      taggedMvp: readiness.taggedMvp,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  thresholdDays: number;
  network: boolean;
  timeoutMs: number;
  mvpOnly: boolean;
  json: boolean;
  out?: string;
} {
  let thresholdDays = DEFAULT_STALE_DAYS;
  let network = false;
  let timeoutMs = 8000;
  let mvpOnly = false;
  let json = false;
  let out: string | undefined;
  for (const arg of argv) {
    if (arg === '--check' || arg === '--network') network = true;
    else if (arg === '--json') json = true;
    else if (arg === '--mvp-only') mvpOnly = true;
    else if (arg.startsWith('--days=')) {
      const n = Number(arg.slice('--days='.length));
      if (Number.isFinite(n) && n > 0) thresholdDays = Math.floor(n);
    } else if (arg.startsWith('--timeout=')) {
      const n = Number(arg.slice('--timeout='.length));
      if (Number.isFinite(n) && n > 0) timeoutMs = Math.floor(n);
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    }
  }
  return { thresholdDays, network, timeoutMs, mvpOnly, json, out };
}

function renderText(report: UpdateReport): string {
  const h = report.headline;
  const lines: string[] = [];
  lines.push('============================================');
  lines.push(' Orbital — update report');
  lines.push('============================================');
  lines.push(`  generated: ${report.generatedAt}`);
  lines.push(`  stale threshold: ${report.thresholdDays} days`);
  lines.push(`  network URL check: ${report.networkChecked ? 'ENABLED (opt-in)' : 'disabled (offline-safe)'}`);
  lines.push('');
  lines.push('  Headline:');
  lines.push(`    programs ............... ${h.totalPrograms}`);
  lines.push(`    stale .................. ${h.stale}`);
  lines.push(`    missing verify date .... ${h.missingVerificationDate}`);
  lines.push(`    missing source URLs .... ${h.missingSourceUrls}`);
  lines.push(`    broken/unreachable URLs  ${report.networkChecked ? h.brokenOrUnreachableUrls : '— (run with --check)'}`);
  lines.push(`    not MVP-ready .......... ${h.notMvpReady}`);
  lines.push(`    tagged mvp:true ........ ${h.taggedMvp}`);

  if (report.readiness.capWarnings.length) {
    lines.push('');
    lines.push('  Scope/cap warnings:');
    for (const w of report.readiness.capWarnings) lines.push(`    ! ${w}`);
  }

  const staleRecords = report.freshness.records.filter((r) => r.state === 'stale' || r.state === 'missing-date');
  if (staleRecords.length) {
    lines.push('');
    lines.push(`  Freshness attention (${staleRecords.length}):`);
    for (const r of staleRecords.slice(0, 40)) {
      const age = r.ageDays === null ? '—' : `${r.ageDays}d`;
      lines.push(`    [${r.state}] ${r.name} (${r.dataset}) age=${age}`);
    }
    if (staleRecords.length > 40) lines.push(`    … and ${staleRecords.length - 40} more`);
  }

  lines.push('');
  lines.push('  (report-only — no data was modified)');
  return lines.join('\n');
}

function isMain(): boolean {
  return Boolean(process.argv[1] && import.meta.url === `file://${process.argv[1]}`);
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  generateUpdateReport({
    thresholdDays: args.thresholdDays,
    network: args.network,
    timeoutMs: args.timeoutMs,
    mvpOnly: args.mvpOnly,
  })
    .then((report) => {
      const output = args.json ? JSON.stringify(report, null, 2) : renderText(report);
      if (args.out) {
        writeFileSync(args.out, output + '\n', 'utf8');
        console.log(`update report written to ${args.out}`);
      } else {
        console.log(output);
      }
      process.exit(0); // Report-only: never fail the build.
    })
    .catch((err) => {
      console.error('generate-update-report: degraded (non-fatal):', err instanceof Error ? err.message : err);
      process.exit(0);
    });
}
